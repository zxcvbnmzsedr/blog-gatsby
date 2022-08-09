---
title: RocketMQ事务消息实现原理
date: 2022-05-05 20:27
permalink: /posts/RocketMQ/RocketMQ%E4%BA%8B%E5%8A%A1%E6%B6%88%E6%81%AF%E5%AE%9E%E7%8E%B0%E5%8E%9F%E7%90%86
categories:
- posts
tags: 
---
RocketMQ提供了事务消息的功能，采用了2PC+事务回查来实现事务，最终能通过RocketMQ提供的事务消息，能够简单方便的实现分布式事务。

# 概念介绍

* 事务消息

  RocketMQ提供类似XA或Open XA的分布式事务功能，通过RocketMQ事务消息能达到分布式事务的最终一致。
* 半事务消息

  暂不能投递的消息，生产者已经成功地将消息发送到了RocketMQ服务端，但是RocketMQ服务端未收到生产者对该消息的二次确认，此时该消息被标记成“暂不能投递”状态，处于该种状态下的消息即半事务消息。
* 消息回查

  由于网络闪断、生产者应用重启等原因，导致某条事务消息的二次确认丢失，RocketMQ服务端通过扫描发现某条消息长期处于“半事务消息”时，需要主动向消息生产者询问该消息的最终状态（Commit或是Rollback），该询问过程即消息回查。

## 交互流程

　　事务消息交互流程如下图所示。

　　![RSb0i0](https://image.ztianzeng.com/uPic/RSb0i0.jpg)

　　事务消息发送步骤如下：

1. 生产者将半事务消息发送至RocketMQ服务端。
2. RocketMQ服务端将消息持久化成功之后，向生产者返回Ack确认消息已经发送成功，此时消息为半事务消息。
3. 生产者开始执行本地事务逻辑。
4. 生产者根据本地事务执行结果向服务端提交二次确认结果（Commit或是Rollback），服务端收到确认结果后处理逻辑如下：

    * 二次确认结果为Commit：服务端将半事务消息标记为可投递，并投递给消费者。
    * 二次确认结果为Rollback：服务端将回滚事务，不会将半事务消息投递给消费者。
5. 在断网或者是生产者应用重启的特殊情况下，若服务端未收到发送者提交的二次确认结果，或服务端收到的二次确认结果为Unknown未知状态，经过固定时间后，服务端将对消息生产者即生产者集群中任一生产者实例发起消息回查。

　　事务消息回查步骤如下：

1. 生产者收到消息回查后，需要检查对应消息的本地事务执行的最终结果。
2. 生产者根据检查得到的本地事务的最终状态再次提交二次确认，服务端仍按照步骤4对半事务消息进行处理。

# 使用限制

1. 事务消息不支持延时消息和批量消息。
2. 为了避免单个消息被检查太多次而导致半队列消息累积，我们默认将单个消息的检查次数限制为 15 次，但是用户可以通过 Broker 配置文件的 `transactionCheckMax`参数来修改此限制。如果已经检查某条消息超过 N 次的话（ N = `transactionCheckMax` ） 则 Broker 将丢弃此消息，并在默认情况下同时打印错误日志。用户可以通过重写 `AbstractTransactionalMessageCheckListener` 类来修改这个行为。
3. 事务消息将在 Broker 配置文件中的参数 `transactionTimeout` 这样的特定时间长度之后被检查。当发送事务消息时，用户还可以通过设置用户属性 `CHECK_IMMUNITY_TIME_IN_SECONDS` 来改变这个限制，该参数优先于 `transactionTimeout` 参数。
4. 事务性消息可能不止一次被检查或消费。
5. 提交给用户的目标主题消息可能会失败，目前这依日志的记录而定。它的高可用性通过 RocketMQ 本身的高可用性机制来保证，如果希望确保事务消息不丢失、并且事务完整性得到保证，建议使用同步的双重写入机制。
6. 事务消息的生产者 ID 不能与其他类型消息的生产者 ID 共享。与其他类型的消息不同，事务消息允许反向查询、MQ服务器能通过它们的生产者 ID 查询到消费者。

# 原理分析

　　整个事务消息，分为两大块，发送流程和回查流程: 

* 发送流程：发送half message(半消息)，执行本地事务，发送事务执行结果
* 定时任务回查流程：MQ定时任务扫描半消息，回查本地事务，发送事务执行结果

## Productor发送消息

　　发送端的代码:

```java
public class TransactionProducer {
   public static void main(String[] args) throws MQClientException, InterruptedException {
       TransactionListener transactionListener = new TransactionListenerImpl();
       TransactionMQProducer producer = new TransactionMQProducer("please_rename_unique_group_name");
       ExecutorService executorService = new ThreadPoolExecutor(2, 5, 100, TimeUnit.SECONDS, new ArrayBlockingQueue<Runnable>(2000), new ThreadFactory() {
           @Override
           public Thread newThread(Runnable r) {
               Thread thread = new Thread(r);
               thread.setName("client-transaction-msg-check-thread");
               return thread;
           }
       });
       producer.setExecutorService(executorService);
       producer.setTransactionListener(transactionListener);
       producer.start();
       String[] tags = new String[] {"TagA", "TagB", "TagC", "TagD", "TagE"};
       for (int i = 0; i < 10; i++) {
           try {
               Message msg =
                   new Message("TopicTest1234", tags[i % tags.length], "KEY" + i,
                       ("Hello RocketMQ " + i).getBytes(RemotingHelper.DEFAULT_CHARSET));
               SendResult sendResult = producer.sendMessageInTransaction(msg, null);
               System.out.printf("%s%n", sendResult);
               Thread.sleep(10);
           } catch (MQClientException | UnsupportedEncodingException e) {
               e.printStackTrace();
           }
       }
       for (int i = 0; i < 100000; i++) {
           Thread.sleep(1000);
       }
       producer.shutdown();
   }

	public class TransactionListenerImpl implements TransactionListener {
	  private AtomicInteger transactionIndex = new AtomicInteger(0);
	  private ConcurrentHashMap<String, Integer> localTrans = new ConcurrentHashMap<>();
	  @Override
	  public LocalTransactionState executeLocalTransaction(Message msg, Object arg) {
	      int value = transactionIndex.getAndIncrement();
	      int status = value % 3;
	      localTrans.put(msg.getTransactionId(), status);
	      return LocalTransactionState.UNKNOW;
	  }
	  @Override
	  public LocalTransactionState checkLocalTransaction(MessageExt msg) {
	      Integer status = localTrans.get(msg.getTransactionId());
	      if (null != status) {
	          switch (status) {
	              case 0:
	                  return LocalTransactionState.UNKNOW;
	              case 1:
	                  return LocalTransactionState.COMMIT_MESSAGE;
	              case 2:
	                  return LocalTransactionState.ROLLBACK_MESSAGE;
	          }
	      }
	      return LocalTransactionState.COMMIT_MESSAGE;
	  }
	}
	
}
```

　　从代码中可以看出，发送半消息是通过`TransactionMQProducer`的`sendMessageInTransaction`来进行发送

```java
public TransactionSendResult sendMessageInTransaction(final Message msg,
        final Object arg) throws MQClientException {
        //判断transactionListener是否存在
        if (null == this.transactionListener) {
            throw new MQClientException("TransactionListener is null", null);
        }

        msg.setTopic(NamespaceUtil.wrapNamespace(this.getNamespace(), msg.getTopic()));
        //发送事务消息
        return this.defaultMQProducerImpl.sendMessageInTransaction(msg, null, arg);
}
```

　　`transactionListener` 是消息回查的类，它提供了两个方法

* executeLocalTransaction: 执行本地事务
* checkLocalTransaction: 回查本地事务

　　`TransactionMQProducer`的`sendMessageInTransaction`最终会进入到`DefaultMQProducerImpl.sendMessageInTransaction`

```java
public TransactionSendResult sendMessageInTransaction(final Message msg,
        final LocalTransactionExecuter localTransactionExecuter, final Object arg)
        throws MQClientException {
        //判断检查本地事务的listener是否存在
        TransactionListener transactionListener = getCheckListener();
        if (null == localTransactionExecuter && null == transactionListener) {
            throw new MQClientException("tranExecutor is null", null);
        }
        // ignore DelayTimeLevel parameter
        if (msg.getDelayTimeLevel() != 0) {
            MessageAccessor.clearProperty(msg, MessageConst.PROPERTY_DELAY_TIME_LEVEL);
        }

        Validators.checkMessage(msg, this.defaultMQProducer);

        SendResult sendResult = null;
        MessageAccessor.putProperty(msg, MessageConst.PROPERTY_TRANSACTION_PREPARED, "true");
        MessageAccessor.putProperty(msg, MessageConst.PROPERTY_PRODUCER_GROUP, this.defaultMQProducer.getProducerGroup());
        try {
            //发送半消息
            sendResult = this.send(msg);
        } catch (Exception e) {
            throw new MQClientException("send message Exception", e);
        }

        LocalTransactionState localTransactionState = LocalTransactionState.UNKNOW;
        Throwable localException = null;
        switch (sendResult.getSendStatus()) {
            case SEND_OK: {
                try {
                    if (sendResult.getTransactionId() != null) {
                        msg.putUserProperty("__transactionId__", sendResult.getTransactionId());
                    }
                    String transactionId = msg.getProperty(MessageConst.PROPERTY_UNIQ_CLIENT_MESSAGE_ID_KEYIDX);
                    if (null != transactionId && !"".equals(transactionId)) {
                        msg.setTransactionId(transactionId);
                    }
                    if (null != localTransactionExecuter) {
                        localTransactionState = localTransactionExecuter.executeLocalTransactionBranch(msg, arg);
                    } else if (transactionListener != null) {
                        //发送消息成功，执行本地事务
                        log.debug("Used new transaction API");
                        localTransactionState = transactionListener.executeLocalTransaction(msg, arg);
                    }
                    if (null == localTransactionState) {
                        localTransactionState = LocalTransactionState.UNKNOW;
                    }

                    if (localTransactionState != LocalTransactionState.COMMIT_MESSAGE) {
                        log.info("executeLocalTransactionBranch return {}", localTransactionState);
                        log.info(msg.toString());
                    }
                } catch (Throwable e) {
                    log.info("executeLocalTransactionBranch exception", e);
                    log.info(msg.toString());
                    localException = e;
                }
            }
            break;
            case FLUSH_DISK_TIMEOUT:
            case FLUSH_SLAVE_TIMEOUT:
            case SLAVE_NOT_AVAILABLE:
                localTransactionState = LocalTransactionState.ROLLBACK_MESSAGE;
                break;
            default:
                break;
        }

        try {
            //执行endTransaction方法
            // 如果半消息发送失败或本地事务执行失败告诉服务端是删除半消息
            // 半消息发送成功且本地事务执行成功则告诉服务端生效半消息
            this.endTransaction(msg, sendResult, localTransactionState, localException);
        } catch (Exception e) {
            log.warn("local transaction execute " + localTransactionState + ", but end broker transaction failed", e);
        }

        TransactionSendResult transactionSendResult = new TransactionSendResult();
        transactionSendResult.setSendStatus(sendResult.getSendStatus());
        transactionSendResult.setMessageQueue(sendResult.getMessageQueue());
        transactionSendResult.setMsgId(sendResult.getMsgId());
        transactionSendResult.setQueueOffset(sendResult.getQueueOffset());
        transactionSendResult.setTransactionId(sendResult.getTransactionId());
        transactionSendResult.setLocalTransactionState(localTransactionState);
        return transactionSendResult;
    }
```

　　这个方法的功能: 

1. 给消息追加上事务消息相关的`tag`,用于broker区分普通消息和事务消息
2. 调用`this.send(msg)`发送半消息
3. 发送成功由用户自己编写的`transactionListener`，执行本地事务
4. 事务结束之后，执行`endTransaction`，告诉`broker`执行`commit/rollback`

　　在`transactionListener`执行完之后有三种情况: `UNKNOW`、`COMMIT`、`RollBack`，然后调用`endTransaction`来结束事务

```java
public void endTransaction(
        final Message msg,
        final SendResult sendResult,
        final LocalTransactionState localTransactionState,
        final Throwable localException) throws RemotingException, MQBrokerException, InterruptedException, UnknownHostException {
        final MessageId id;
        if (sendResult.getOffsetMsgId() != null) {
            id = MessageDecoder.decodeMessageId(sendResult.getOffsetMsgId());
        } else {
            id = MessageDecoder.decodeMessageId(sendResult.getMsgId());
        }
        String transactionId = sendResult.getTransactionId();
        final String brokerAddr = this.mQClientFactory.findBrokerAddressInPublish(sendResult.getMessageQueue().getBrokerName());
        EndTransactionRequestHeader requestHeader = new EndTransactionRequestHeader();
        requestHeader.setTransactionId(transactionId);
        requestHeader.setCommitLogOffset(id.getOffset());
	// 根据事务执行的结果，来设置提交给broker的状态
        switch (localTransactionState) {
		// 提交事务
            case COMMIT_MESSAGE:
                requestHeader.setCommitOrRollback(MessageSysFlag.TRANSACTION_COMMIT_TYPE);
                break;
		// 回滚
            case ROLLBACK_MESSAGE:
                requestHeader.setCommitOrRollback(MessageSysFlag.TRANSACTION_ROLLBACK_TYPE);
                break;
            case UNKNOW:
                requestHeader.setCommitOrRollback(MessageSysFlag.TRANSACTION_NOT_TYPE);
                break;
            default:
                break;
        }

        doExecuteEndTransactionHook(msg, sendResult.getMsgId(), brokerAddr, localTransactionState, false);
        requestHeader.setProducerGroup(this.defaultMQProducer.getProducerGroup());
        requestHeader.setTranStateTableOffset(sendResult.getQueueOffset());
        requestHeader.setMsgId(sendResult.getMsgId());
        String remark = localException != null ? ("executeLocalTransactionBranch exception: " + localException.toString()) : null;
        this.mQClientFactory.getMQClientAPIImpl().endTransactionOneway(brokerAddr, requestHeader, remark,
            this.defaultMQProducer.getSendMsgTimeout());
    }
```

## Broker处理半消息（第一次send）

　　Broker端通过`SendMessageProcessor.processRequest()`方法接收处理 Producer 发送的半消息

　　最后会调用到`SendMessageProcessor.asyncSendMessage()`，判断消息类型，进行消息存储。

```java
private CompletableFuture<RemotingCommand> asyncSendMessage(ChannelHandlerContext ctx, RemotingCommand request,
                                                                SendMessageContext mqtraceContext,
                                                                SendMessageRequestHeader requestHeader) {
        // 。。。没必要看，都是set一些属性
        String transFlag = origProps.get(MessageConst.PROPERTY_TRANSACTION_PREPARED);
	// 如果是事务消息
        if (transFlag != null && Boolean.parseBoolean(transFlag)) {
            if (this.brokerController.getBrokerConfig().isRejectTransactionMessage()) {
                response.setCode(ResponseCode.NO_PERMISSION);
                response.setRemark(
                        "the broker[" + this.brokerController.getBrokerConfig().getBrokerIP1()
                                + "] sending transaction message is forbidden");
                return CompletableFuture.completedFuture(response);
            }
            //存储半消息
            putMessageResult = this.brokerController.getTransactionalMessageService().asyncPrepareMessage(msgInner);
        } else {
            //存储普通消息
            putMessageResult = this.brokerController.getMessageStore().asyncPutMessage(msgInner);
        }
        return handlePutMessageResultFuture(putMessageResult, response, request, msgInner, responseHeader, mqtraceContext, ctx, queueIdInt);
    }
```

　　存储半消息的核心代码: 

```java
public CompletableFuture<PutMessageResult> asyncPutHalfMessage(MessageExtBrokerInner messageInner) {
        return store.asyncPutMessage(parseHalfMessageInner(messageInner));
    }

    private MessageExtBrokerInner parseHalfMessageInner(MessageExtBrokerInner msgInner) {
        //备份消息的原主题名称与原队列ID
        MessageAccessor.putProperty(msgInner, MessageConst.PROPERTY_REAL_TOPIC, msgInner.getTopic());
        MessageAccessor.putProperty(msgInner, MessageConst.PROPERTY_REAL_QUEUE_ID,
            String.valueOf(msgInner.getQueueId()));
        msgInner.setSysFlag(
            MessageSysFlag.resetTransactionValue(msgInner.getSysFlag(), MessageSysFlag.TRANSACTION_NOT_TYPE));
        //事务消息的topic和queueID是写死固定的
        msgInner.setTopic(TransactionalMessageUtil.buildHalfTopic());
        msgInner.setQueueId(0);
        msgInner.setPropertiesString(MessageDecoder.messageProperties2String(msgInner.getProperties()));
        return msgInner;
    }
```

　　在这一步，备份消息的原主题名称与原队列ID，然后取消事务消息的消息标签，重新设置消息的主题为：RMQ_SYS_TRANS_HALF_TOPIC，队列ID固定为0。

　　与其他普通消息区分开，然后完成消息持久化。到这里，Broker 就初步处理完了 Producer 发送的事务半消息。

## Broker处理事务消息的二次提交

　　

```java
public RemotingCommand processRequest(ChannelHandlerContext ctx, RemotingCommand request) throws
        RemotingCommandException {
        final RemotingCommand response = RemotingCommand.createResponseCommand(null);
        final EndTransactionRequestHeader requestHeader =
            (EndTransactionRequestHeader)request.decodeCommandCustomHeader(EndTransactionRequestHeader.class);
        LOGGER.debug("Transaction request:{}", requestHeader);
        //从节点不处理
        if (BrokerRole.SLAVE == brokerController.getMessageStoreConfig().getBrokerRole()) {
            response.setCode(ResponseCode.SLAVE_NOT_AVAILABLE);
            LOGGER.warn("Message store is slave mode, so end transaction is forbidden. ");
            return response;
        }
        // .....一堆没啥太大影响的代码
        OperationResult result = new OperationResult();
	// 核心流程
        if (MessageSysFlag.TRANSACTION_COMMIT_TYPE == requestHeader.getCommitOrRollback()) {
            //根据commitLogOffset从commitlog文件中查找消息
            result = this.brokerController.getTransactionalMessageService().commitMessage(requestHeader);
            if (result.getResponseCode() == ResponseCode.SUCCESS) {
		// 如果是提交动作，就恢复原消息的主题与队列，再次存入commitlog文件进而转到消息消费队列，供消费者消费，
            	// 然后将原预处理消息存入一个新的主题RMQ_SYS_TRANS_OP_HALF_TOPIC，代表该消息已被处理
                RemotingCommand res = checkPrepareMessage(result.getPrepareMessage(), requestHeader);
                if (res.getCode() == ResponseCode.SUCCESS) {
                    MessageExtBrokerInner msgInner = endMessageTransaction(result.getPrepareMessage());
                    msgInner.setSysFlag(MessageSysFlag.resetTransactionValue(msgInner.getSysFlag(), requestHeader.getCommitOrRollback()));
                    msgInner.setQueueOffset(requestHeader.getTranStateTableOffset());
                    msgInner.setPreparedTransactionOffset(requestHeader.getCommitLogOffset());
                    msgInner.setStoreTimestamp(result.getPrepareMessage().getStoreTimestamp());
                    MessageAccessor.clearProperty(msgInner, MessageConst.PROPERTY_TRANSACTION_PREPARED);
                    RemotingCommand sendResult = sendFinalMessage(msgInner);
                    if (sendResult.getCode() == ResponseCode.SUCCESS) {
                        //其实是将消息存储在主题为：RMQ_SYS_TRANS_OP_HALF_TOPIC的主题中，代表这些消息已经被处理（提交或回滚）。
                        this.brokerController.getTransactionalMessageService().deletePrepareMessage(result.getPrepareMessage());
                    }
                    return sendResult;
                }
                return res;
            }
        } else if (MessageSysFlag.TRANSACTION_ROLLBACK_TYPE == requestHeader.getCommitOrRollback()) {
            //根据commitlogOffset查找消息
            result = this.brokerController.getTransactionalMessageService().rollbackMessage(requestHeader);
            if (result.getResponseCode() == ResponseCode.SUCCESS) {
                RemotingCommand res = checkPrepareMessage(result.getPrepareMessage(), requestHeader);
                if (res.getCode() == ResponseCode.SUCCESS) {
                    //删除预处理消息(prepare)
                    //其实是将消息存储在主题为：RMQ_SYS_TRANS_OP_HALF_TOPIC的主题中，代表这些消息已经被处理（提交或回滚）。
                    this.brokerController.getTransactionalMessageService().deletePrepareMessage(result.getPrepareMessage());
                }
                return res;
            }
        }
        response.setCode(result.getResponseCode());
        response.setRemark(result.getResponseRemark());
        return response;
    }
```

　　其流程大概如下:

* 根据commitlogOffset找到消息
* 如果是提交动作，就恢复原消息的主题与队列，再次存入commitlog文件进而转到消息消费队列，供消费者消费，然后将原预处理消息存入一个新的主题RMQ_SYS_TRANS_OP_HALF_TOPIC，代表该消息已被处理
* 回滚消息，则直接将原预处理消息存入一个新的主题RMQ_SYS_TRANS_OP_HALF_TOPIC，代表该消息已被处理

## 半消息事务回查

　　两段式协议发送与提交回滚消息，执行完本地事务消息的状态为`UNKNOW`时，结束事务不做任何操作。通过事务状态定时回查得到发送端的事务状态是`rollback`或`commit`。

　　通过`TransactionalMessageCheckService`线程定时去检测`RMQ_SYS_TRANS_HALF_TOPIC`主题中的消息，回查消息的事务状态。

* RMQ_SYS_TRANS_HALF_TOPIC

  prepare消息的主题，事务消息首先先进入到该主题。
* RMQ_SYS_TRANS_OP_HALF_TOPIC

  当消息服务器收到事务消息的提交或回滚请求后，会将消息存储在该主题下。

```java
// TransactionalMessageCheckService   
@Override
    public void run() {
        log.info("Start transaction check service thread!");
        long checkInterval = brokerController.getBrokerConfig().getTransactionCheckInterval();
        while (!this.isStopped()) {
            this.waitForRunning(checkInterval);
        }
        log.info("End transaction check service thread!");
    }

    @Override
    protected void onWaitEnd() {
        //事务过期时间
        long timeout = brokerController.getBrokerConfig().getTransactionTimeOut();
        int checkMax = brokerController.getBrokerConfig().getTransactionCheckMax();
        long begin = System.currentTimeMillis();
        log.info("Begin to check prepare message, begin time:{}", begin);
        //检查本地事务
        this.brokerController.getTransactionalMessageService().check(timeout, checkMax, this.brokerController.getTransactionalMessageCheckListener());
        log.info("End to check prepare message, consumed time:{}", System.currentTimeMillis() - begin);
    }
```

　　时序图如下:

　　![](https://image.ztianzeng.com/uPic/20220506195258.png)

# 异常情况

## Producer发送半消息失败

　　在发送成功之后才会执行本地事务，所以半消息发送失败之后就直接退出发送流程了。

　　发送失败会抛出异常信息，可以自己针对异常信息再做进一步处理，是重试还是回滚上一步操作。

## 半消息发送成功，没收到MQ返回的响应

　　本地事务执行失败，本地事务会进行回滚。

　　然后，发送rollback给MQ，MQ会删除之前发送的半消息，也就不会继续调用下游服务了。

## 半消息发送成功，没收到MQ返回的响应

　　发送半消息成功，但是没有收到MQ返回的响应，让我们系统误以为MQ消息发送失败，执行回滚逻辑。但是实际上MQ这个时候已经保存成功了。

　　这种情况下，就需要通过MQ的回查逻辑`TransactionalMessageCheckService`定时扫描半消息队列，然后回查本地事务的状态

# 总结

　　RocketMQ实现事务消息的原理是通过改写`Topic`和`queueId`，将消息重写到对Consumer不可见的队列中，然后在Productor执行完本地事务之后，提交事务状态再决定将半事务消息`Commit`或者`Rollback`。

　　如果由于某种情况，服务宕机或者网络抖动等原因，Broker没有收到Productor的事务状态请求，则会进入到补偿阶段，通过定时任务扫描半事务消息进行事务回查。
