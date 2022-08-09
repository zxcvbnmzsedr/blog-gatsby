---
title: RocketMQ顺序消息
date: 2022-05-09 17:23
permalink: /posts/RocketMQ/RocketMQ%E9%A1%BA%E5%BA%8F%E6%B6%88%E6%81%AF
categories:
- posts
tags: 
---
消息有序指的是可以按照消息的发送顺序来消费(FIFO)。RocketMQ可以严格的保证消息有序，可以分为分区有序或者全局有序。

> 电商的订单创建，以订单ID作为Sharding Key，那么同一个订单相关的创建订单消息、订单支付消息、订单退款消息、订单物流消息都会按照发布的先后顺序来消费。
>

# 基本原理

　　在默认的情况下消息发送会采取Round Robin轮询方式把消息发送到不同的queue(分区队列)；

　　而消费消息的时候从多个queue上拉取消息，这种情况发送和消费是不能保证顺序。

　　如下图所示: 

![](https://image.ztianzeng.com/uPic/20220509173821.png)

![](https://image.ztianzeng.com/uPic/20220509173700.png)

　　但是如果控制发送的顺序消息只依次发送到同一个queue中，消费的时候只从这个queue上依次拉取，则就保证了顺序。

　　当发送和消费参与的queue只有一个，则是全局有序；如果多个queue参与，则为分区有序，即相对每个queue，消息都是有序的。

　　![](https://image.ztianzeng.com/uPic/20220509173907.png)

　　下面用订单进行分区有序的示例: 

> 一个订单的顺序流程是：创建、付款、推送、完成。订单号相同的消息会被先后发送到同一个队列中，消费时，同一个OrderId获取到的肯定是同一个队列。
>

　　

```java
public class Producer {
   public static void main(String[] args) throws Exception {
       DefaultMQProducer producer = new DefaultMQProducer("please_rename_unique_group_name");
       producer.setNamesrvAddr("127.0.0.1:9876");
       producer.start();
       String[] tags = new String[]{"TagA", "TagC", "TagD"};
       // 订单列表
       List<OrderStep> orderList = new Producer().buildOrders();
       Date date = new Date();
       SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
       String dateStr = sdf.format(date);
       for (int i = 0; i < 10; i++) {
           // 加个时间前缀
           String body = dateStr + " Hello RocketMQ " + orderList.get(i);
           Message msg = new Message("TopicTest", tags[i % tags.length], "KEY" + i, body.getBytes());

           SendResult sendResult = producer.send(msg, new MessageQueueSelector() {
               @Override
               public MessageQueue select(List<MessageQueue> mqs, Message msg, Object arg) {
                   Long id = (Long) arg;  //根据订单id选择发送queue
                   long index = id % mqs.size();
                   return mqs.get((int) index);
               }
           }, orderList.get(i).getOrderId());//订单id

           System.out.printf("SendResult status:%s, queueId:%d, body:%s%n",
               sendResult.getSendStatus(),
               sendResult.getMessageQueue().getQueueId(),
               body);
       }
       producer.shutdown();
   }

   /**
    * 订单的步骤
    */
   @Data
   private static class OrderStep {
       private long orderId;
       private String desc;
   }

   /**
    * 生成模拟订单数据
    */
   private List<OrderStep> buildOrders() {
       List<OrderStep> orderList = new ArrayList<OrderStep>();
       OrderStep orderDemo = new OrderStep();
       orderDemo.setOrderId(15103111039L);
       orderDemo.setDesc("创建");
       orderList.add(orderDemo);
       orderDemo = new OrderStep();
       orderDemo.setOrderId(15103111065L);
       orderDemo.setDesc("创建");
       orderList.add(orderDemo);
       orderDemo = new OrderStep();
       orderDemo.setOrderId(15103111039L);
       orderDemo.setDesc("付款");
       orderList.add(orderDemo);
       orderDemo = new OrderStep();
       orderDemo.setOrderId(15103117235L);
       orderDemo.setDesc("创建");
       orderList.add(orderDemo);
       orderDemo = new OrderStep();
       orderDemo.setOrderId(15103111065L);
       orderDemo.setDesc("付款");
       orderList.add(orderDemo);
       orderDemo = new OrderStep();
       orderDemo.setOrderId(15103117235L);
       orderDemo.setDesc("付款");
       orderList.add(orderDemo);
       orderDemo = new OrderStep();
       orderDemo.setOrderId(15103111065L);
       orderDemo.setDesc("完成");
       orderList.add(orderDemo);
       orderDemo = new OrderStep();
       orderDemo.setOrderId(15103111039L);
       orderDemo.setDesc("推送");
       orderList.add(orderDemo);
       orderDemo = new OrderStep();
       orderDemo.setOrderId(15103117235L);
       orderDemo.setDesc("完成");
       orderList.add(orderDemo);
       orderDemo = new OrderStep();
       orderDemo.setOrderId(15103111039L);
       orderDemo.setDesc("完成");
       orderList.add(orderDemo);
       return orderList;
   }
}
```

　　这是消费者的代码: 

```java
public class ConsumerInOrder {
   public static void main(String[] args) throws Exception {
       DefaultMQPushConsumer consumer = new DefaultMQPushConsumer("please_rename_unique_group_name_3");
       consumer.setNamesrvAddr("127.0.0.1:9876");
       /**
        * 设置Consumer第一次启动是从队列头部开始消费还是队列尾部开始消费<br>
        * 如果非第一次启动，那么按照上次消费的位置继续消费
        */
       consumer.setConsumeFromWhere(ConsumeFromWhere.CONSUME_FROM_FIRST_OFFSET);
       consumer.subscribe("TopicTest", "TagA || TagC || TagD");
       consumer.registerMessageListener(new MessageListenerOrderly() {
           Random random = new Random();

           @Override
           public ConsumeOrderlyStatus consumeMessage(List<MessageExt> msgs, ConsumeOrderlyContext context) {
               context.setAutoCommit(true);
               for (MessageExt msg : msgs) {
                   // 可以看到每个queue有唯一的consume线程来消费, 订单对每个queue(分区)有序
                   System.out.println("consumeThread=" + Thread.currentThread().getName() + "queueId=" + msg.getQueueId() + ", content:" + new String(msg.getBody()));
               }
               try {
                   //模拟业务逻辑处理中...
                   TimeUnit.SECONDS.sleep(random.nextInt(10));
               } catch (Exception e) {
                   e.printStackTrace();
               }
               return ConsumeOrderlyStatus.SUCCESS;
           }
       });
       consumer.start();
       System.out.println("Consumer Started.");
   }
}
```

　　可以看出来，生产者那边需要实现`MessageQueueSelector`完成队列的选举，而消费者需要实现`MessageListenerOrderly`以完成消息的顺序消费

# 问题

　　如果我们整个RocketMQ搭建的环境是，单个NameServer当个Broker的话，初始MessageQueue的队列为4。

　　有ID为13, 整个时候Hash情况如下图所示:

　　![](https://image.ztianzeng.com/uPic/20220510133921.png)

　　我们由于业务的增长，新增了一个Broker，Broker非成倍数扩容，导致逻辑队列的QueueId无法路由到原有队列中，就变成了这样

　　![](https://image.ztianzeng.com/uPic/20220510141046.png)

# 解决方案

## 成倍扩容

　　成倍扩容，实现扩容前后，同样的 key，hash 到原队列，或者 hash 到新扩容的队列。

　　因为可以参考HashMap的成倍扩容原理，消息要么在原队列上，要么在原有队列上+扩容的长度，由于RocketMQ的特性，他们的QueueId是一致的，所以可以顺序消费

## 一致性Hash

　　用一致性Hash来计算需要放置的MessageQueue队列

## 自定义负载算法

　　实现一个自定义的队列负载算法，需要传入一个队列的总队列个数，在负载均衡过程中如果发现数量不对时将消息先暂存到数据库，并将这些失败的队列信息存储到redis中，在发送新消息时，如果计算的负载队列是失败的队列，并且当前的队列信息已经恢复到当前初始值，则先判断数据库中是否有待发送到消息，如果有，则继续将消息发送到数据库，并开启一个线程，将数据库中的消息发送到mq中，这样后续的消息就会继续进入到MQ

　　
