---
title: RocketMQ延迟消息原理
date: 2022-05-06 17:05
permalink: /posts/RocketMQ/RocketMQ%E5%BB%B6%E8%BF%9F%E6%B6%88%E6%81%AF%E5%8E%9F%E7%90%86
categories:
- posts
tags: 
---
# RocketMQ延迟消息原理

RocketMQ提供了延迟消息的功能，消息在发送到RocketMQ服务端之后不会马上投递，而是根据消息中的属性延迟固定时间之后才会投递到消费者那。

# 使用场景

电商里，提交了一个订单就可以发送一个延时消息，1h后去检查这个订单的状态，如果还是未付款就取消订单释放库存。

## 启动消费者等待传入订阅消息

```java
public class ScheduledMessageConsumer {
   public static void main(String[] args) throws Exception {
      // 实例化消费者
      DefaultMQPushConsumer consumer = new DefaultMQPushConsumer("ExampleConsumer");
      // 订阅Topics
      consumer.subscribe("TestTopic", "*");
      // 注册消息监听者
      consumer.registerMessageListener(new MessageListenerConcurrently() {
          @Override
          public ConsumeConcurrentlyStatus consumeMessage(List<MessageExt> messages, ConsumeConcurrentlyContext context) {
              for (MessageExt message : messages) {
                  // Print approximate delay time period
                  System.out.println("Receive message[msgId=" + message.getMsgId() + "] " + (System.currentTimeMillis() - message.getBornTimestamp()) + "ms later");
              }
              return ConsumeConcurrentlyStatus.CONSUME_SUCCESS;
          }
      });
      // 启动消费者
      consumer.start();
  }
}
```

## 发送延迟消息

> 现在RocketMq并不支持任意时间的延时，需要设置几个固定的延时等级，从1s到2h分别对应着等级1到18 消息消费失败会进入延时消息队列，消息发送时间与设置的延时等级和重试次数有关

```java
public class ScheduledMessageProducer {
   public static void main(String[] args) throws Exception {
      // 实例化一个生产者来产生延时消息
      DefaultMQProducer producer = new DefaultMQProducer("ExampleProducerGroup");
      // 启动生产者
      producer.start();
      int totalMessagesToSend = 100;
      for (int i = 0; i < totalMessagesToSend; i++) {
          Message message = new Message("TestTopic", ("Hello scheduled message " + i).getBytes());
          // 设置延时等级3,这个消息将在10s之后发送(现在只支持固定的几个时间,详看delayTimeLevel)
          message.setDelayTimeLevel(3);
          // 发送消息
          producer.send(message);
      }
       // 关闭生产者
      producer.shutdown();
  }
}
```

# 原理分析

Productor发送没啥好说的，与事务消息队列相比简单太多，与正常发送相比仅仅设置了一个`DelayTimeLevel`的属性。

## broker接收流程

消息从`SendMessageProcessor#asyncProcessRequest` 进来之后，会一步步向下执行

```java
// SendMessageProcessor.java
 private CompletableFuture<RemotingCommand> asyncSendMessage(ChannelHandlerContext ctx, RemotingCommand request,
                                                                SendMessageContext mqtraceContext,
                                                                SendMessageRequestHeader requestHeader) {
        // ......
        CompletableFuture<PutMessageResult> putMessageResult = null;
        String transFlag = origProps.get(MessageConst.PROPERTY_TRANSACTION_PREPARED);
        if (transFlag != null && Boolean.parseBoolean(transFlag)) {
            if (this.brokerController.getBrokerConfig().isRejectTransactionMessage()) {
                response.setCode(ResponseCode.NO_PERMISSION);
                response.setRemark(
                        "the broker[" + this.brokerController.getBrokerConfig().getBrokerIP1()
                                + "] sending transaction message is forbidden");
                return CompletableFuture.completedFuture(response);
            }
            //存储事务消息
            putMessageResult = this.brokerController.getTransactionalMessageService().asyncPrepareMessage(msgInner);
        } else {
            //存储普通消息
            putMessageResult = this.brokerController.getMessageStore().asyncPutMessage(msgInner);
        }
        return handlePutMessageResultFuture(putMessageResult, response, request, msgInner, responseHeader, mqtraceContext, ctx, queueIdInt);
    }

```

然后会调用到`DefaultMessageStore#asyncPutMessage`

```java
// DefaultMessageStore#asyncPutMessage.java
public CompletableFuture<PutMessageResult> asyncPutMessage(MessageExtBrokerInner msg) {
 	// 检查存储状态：是否关闭、是否slave、是否不可写、写入是否频繁
        PutMessageStatus checkStoreStatus = this.checkStoreStatus();
        if (checkStoreStatus != PutMessageStatus.PUT_OK) {
            return CompletableFuture.completedFuture(new PutMessageResult(checkStoreStatus, null));
        }
	// 检查msg长度是否合法：topic是否超过127、body长度是否超过限定值
        PutMessageStatus msgCheckStatus = this.checkMessage(msg);
        if (msgCheckStatus == PutMessageStatus.MESSAGE_ILLEGAL) {
            return CompletableFuture.completedFuture(new PutMessageResult(msgCheckStatus, null));
        }

        PutMessageStatus lmqMsgCheckStatus = this.checkLmqMessage(msg);
        if (msgCheckStatus == PutMessageStatus.LMQ_CONSUME_QUEUE_NUM_EXCEEDED) {
            return CompletableFuture.completedFuture(new PutMessageResult(lmqMsgCheckStatus, null));
        }


        long beginTime = this.getSystemClock().now();
	// 往commitLog中塞入消息（核心！！）
        CompletableFuture<PutMessageResult> putResultFuture = this.commitLog.asyncPutMessage(msg);

        putResultFuture.thenAccept((result) -> {
            long elapsedTime = this.getSystemClock().now() - beginTime;
            if (elapsedTime > 500) {
                log.warn("putMessage not in lock elapsed time(ms)={}, bodyLength={}", elapsedTime, msg.getBody().length);
            }
            this.storeStatsService.setPutMessageEntireTimeMax(elapsedTime);

            if (null == result || !result.isOk()) {
                this.storeStatsService.getPutMessageFailedTimes().add(1);
            }
        });

        return putResultFuture;
    }
```

最后通过RocketMQ的`CommitLog`将消息存储起来，延迟消息的秘密也在这里将会得到解答

```java
public CompletableFuture<PutMessageResult> asyncPutMessage(final MessageExtBrokerInner msg) {
	// .... 省略一些代码
        if (tranType == MessageSysFlag.TRANSACTION_NOT_TYPE
                || tranType == MessageSysFlag.TRANSACTION_COMMIT_TYPE) {
            // 如果设置的延迟等级>0,则表示需要延迟进行推送
            if (msg.getDelayTimeLevel() > 0) {
                if (msg.getDelayTimeLevel() > this.defaultMessageStore.getScheduleMessageService().getMaxDelayLevel()) {
                    msg.setDelayTimeLevel(this.defaultMessageStore.getScheduleMessageService().getMaxDelayLevel());
                }

                topic = TopicValidator.RMQ_SYS_SCHEDULE_TOPIC;
                int queueId = ScheduleMessageService.delayLevel2QueueId(msg.getDelayTimeLevel());

                // 保存真实的Topic和QueueId
                MessageAccessor.putProperty(msg, MessageConst.PROPERTY_REAL_TOPIC, msg.getTopic());
                MessageAccessor.putProperty(msg, MessageConst.PROPERTY_REAL_QUEUE_ID, String.valueOf(msg.getQueueId()));
                msg.setPropertiesString(MessageDecoder.messageProperties2String(msg.getProperties()));
		// 将topic修改成延迟队列的topic
                msg.setTopic(topic);
                msg.setQueueId(queueId);
            }
        }
	// ... 省略一些代码
    }
```

RocketMQ实现延迟队列的方式大致和事务消息类似，让消息重写到一个`Consumer`无法监听的`Topic`中，这样就能够将延迟消息给保存下来

## 延迟投递原理

通过IDEA 查看 `TopicValidator#RMQ_SYS_SCHEDULE_TOPIC`,可以发现在`ScheduleMessageService`中有去扫描这个Topic，看这个类名大概也能够猜出，是延迟投递的核心实现类。

‍

```java
// ScheduleMessageService.java
public void start() {
        if (started.compareAndSet(false, true)) {
            this.load();
            this.deliverExecutorService = new ScheduledThreadPoolExecutor(this.maxDelayLevel, new ThreadFactoryImpl("ScheduleMessageTimerThread_"));
            if (this.enableAsyncDeliver) {
                this.handleExecutorService = new ScheduledThreadPoolExecutor(this.maxDelayLevel, new ThreadFactoryImpl("ScheduleMessageExecutorHandleThread_"));
            }
            for (Map.Entry<Integer, Long> entry : this.delayLevelTable.entrySet()) {
                Integer level = entry.getKey();
                Long timeDelay = entry.getValue();
                Long offset = this.offsetTable.get(level);
                if (null == offset) {
                    offset = 0L;
                }

                if (timeDelay != null) {
                    if (this.enableAsyncDeliver) {
                        this.handleExecutorService.schedule(new HandlePutResultTask(level), FIRST_DELAY_TIME, TimeUnit.MILLISECONDS);
                    }
		    // 启动延迟队列，调度任务
                    this.deliverExecutorService.schedule(new DeliverDelayedMessageTimerTask(level, offset), FIRST_DELAY_TIME, TimeUnit.MILLISECONDS);
                }
            }

            this.deliverExecutorService.scheduleAtFixedRate(new Runnable() {

                @Override
                public void run() {
                    try {
                        if (started.get()) {
			// 将任务持久化到文件中去
                            ScheduleMessageService.this.persist();
                        }
                    } catch (Throwable e) {
                        log.error("scheduleAtFixedRate flush exception", e);
                    }
                }
            }, 10000, this.defaultMessageStore.getMessageStoreConfig().getFlushDelayOffsetInterval(), TimeUnit.MILLISECONDS);
        }
    }
```

通过线程启动了一个`DeliverDelayedMessageTimerTask`来调度延迟消息。

就是通过Java自带的延迟队列，来掉队队列中的消息，满足时间了则进行投递，将定时任务的Topic中移除，放入它原本的Topic中。

这样客户端就能够接收到消息的信息。

# 总结

* producer端设置消息delayLevel延迟级别，消息属性DELAY中存储了对应了延时级别
* broker端收到消息后，判断延时消息延迟级别，如果大于0，则备份消息原始topic，queueId，并将消息topic改为延时消息队列特定topic(SCHEDULE_TOPIC)，queueId改为延时级别-1
* mq服务端ScheduleMessageService中，为每一个延迟级别单独设置一个定时器，定时(每隔1秒)拉取对应延迟级别的消费队列
* 根据消费偏移量offset从commitLog中解析出对应消息
* 从消息tagsCode中解析出消息应当被投递的时间，与当前时间做比较，判断是否应该进行投递
* 若到达了投递时间，则构建一个新的消息，并从消息属性中恢复出原始的topic，queueId，并清除消息延迟属性，从新进行消息投递

‍
