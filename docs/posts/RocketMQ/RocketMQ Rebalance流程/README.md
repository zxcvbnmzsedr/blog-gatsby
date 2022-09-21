---
title: RocketMQ Rebalance流程
date: 2022-05-11 17:06
permalink: /posts/RocketMQ/RocketMQ%20Rebalance%E6%B5%81%E7%A8%8B
categories:
- posts
tags: 
---
RocketMQ存在Rebalance机制，这个机制的作用是将一个Topic下的多个队列，在同一个消费者组下的多个consumer之间重新进行分配。

　　Rebalance机制目的是为了提升消息的并行处理能力。

　　假设不存在Rebalance机制，那就意味着原本有一个Consumer承载着Topic的8个队列，由于业务的增长无法用单个Consumer可以及时消费，这个时候没有Rebalance机制的存在导致即使增加了Consumer，也不会有任何改变。

# Rebalance局限性

1. 由于一个队列最多分配给一个消费者，因此当某个消费者组下的消费者实例大于队列数量时，多余的消费者将分配不到任何队列。
2. 消费暂停

    考虑在只有*Consumer 1*的情况下，其负责消费所有4个队列;

    在新增*Consumer 2*，触发`Rebalance`时，需要分配2个队列给其消费。

    那么*Consumer 1*就需要停止这2个队列的消费，等到这两个队列分配给*Consumer 2*后，这两个队列才能继续被消费。
3. 重复消费

    *Consumer 2* 在消费分配给自己的2个队列时，必须接着从*Consumer 1*之前已经消费到的offset继续开始消费。

    然而默认情况下，offset是异步提交的，如*Consumer 1*当前消费到offset为10，但是异步提交给broker的offset为8；

    那么如果*Consumer 2*从8的offset开始消费，那么就会有2条消息重复。

    也就是说，*Consumer 2* 并不会等待*Consumer1*提交完offset后，再进行`Rebalance`，因此提交间隔越长，可能造成的重复消费就越多。
4. 消费突刺

    由于`Rebalance`可能导致重复消费，如果需要重复消费的消息过多；

    或者因为`Rebalance`暂停时间过长，导致积压了部分消息。

    那么都有可能导致在`Rebalance`结束之后瞬间可能需要消费很多消息。

# Rebalance分配规则

　　`Rebalance`是没有做统一分配的，而是消费者通过自己再整体消费者中的偏移量来计算出自己应该获得哪些队列

　　分配算法需要实现下面这个接口: 

```java
/**
 * Strategy Algorithm for message allocating between consumers
 */
public interface AllocateMessageQueueStrategy {

    /**
     * Allocating by consumer id
     *
     * @param consumerGroup current consumer group
     * @param currentCID current consumer id
     * @param mqAll message queue set in current topic
     * @param cidAll consumer set in current consumer group
     * @return The allocate result of given strategy
     */
    List<MessageQueue> allocate(
        final String consumerGroup,
        final String currentCID,
        final List<MessageQueue> mqAll,
        final List<String> cidAll
    );

    /**
     * Algorithm name
     *
     * @return The strategy name
     */
    String getName();
}
```

　　这个接口的 getName() 只是一个唯一标识，用以标识该消费者实例是用什么负载均衡算法去分配队列。

　　关键在于`allocate`这个方法，这个方法的出参就是这次Rebalace的结果 —— 本消费者实例应该去获取的队列列表。

　　其余四个入参分别是：

1. 消费者组名
2. 当前的消费者实例的唯一ID，实际上就是client 的ip@instanceName。
3. 全局这个消费者组可以分配的队列集合
4. 当前这个消费者组消费者集合（值是消费者实例的唯一id）

　　‍

　　试想下，假设要你去做一个分配队列的算法，实际上最关键的就是两个视图：

1. 这个topic下全局当前在线的消费者列表
2. topic在全局下有哪些队列。

> 例如，你知道当前有4个消费者 c1 c2 c3 c4在线，也知道topic 下有 8个队列 q0,q1,q2,q3,q4,…q6，那么8/4=2，你就能知道每个消费者应该获取两个队列。
>
> 例如： c1–>q0,q1, c2–>q2,q3, c3–>q4,q5, c4–>q5,q6。
>

　　实际上，这就是rocketmq默认的分配方案。

　　‍

　　但现在唯一的问题在于，我们刚刚说的，我们没有一个中心节点统一地做分配，所以RocketMQ需要做一定的修改。

* 如对于C1：

  “我是C1，我知道当前有4个消费者 c1 c2 c3 c4在线，也知道topic 下有 8个队列 q0,q1,q2,q3,q4,…q6，那么8/4=2，我就能知道每个消费者应该获取两个队列，而我算出来我要的队列是c1–>q0,q1”。

* 对于C2：

  “我是C2，我知道当前有4个消费者 c1 c2 c3 c4在线，也知道topic 下有 8个队列 q0,q1,q2,q3,q4,…q6，那么8/4=2，我就能知道每个消费者应该获取两个队列，而我算出来我要的队列是c2–>q2,q3。

　　要做到无中心的完成这个目标，唯一需要增加的输入项就是“我是C1”，”我是C2”这样的入参，所以上文提到的`allocate`方法下面`当前的消费者实例`的唯一ID就是干这个事用的。

　　下面的代码就是RocketMQ的默认分配代码: 

```java
public List<MessageQueue> allocate(String consumerGroup, String currentCID, List<MessageQueue> mqAll,
        List<String> cidAll) {

        List<MessageQueue> result = new ArrayList<MessageQueue>();
        if (!check(consumerGroup, currentCID, mqAll, cidAll)) {
            return result;
        }
        int index = cidAll.indexOf(currentCID);
        int mod = mqAll.size() % cidAll.size();
        // 求最大可分配个数
        // q数量不超过客户端的数量，则每个客户端最多分配一个queue
        // 否则，每个客户端平分，当不够整除时，位置在mod内的按平均值多加1个，mod外的按平均值分
        int averageSize =
            mqAll.size() <= cidAll.size() ? 1 : (mod > 0 && index < mod ? mqAll.size() / cidAll.size()
                + 1 : mqAll.size() / cidAll.size());
        // 计算当前客户端在queue列表的起始位置
        // 如果能够整除，或者不够整除时位置在mod内，则直接移动分配到的最大个数移动自己索引的倍数，给其他的客户端留位置
        // 如果不能整除且在mod外，则移动倍数之后加上mod数
        int startIndex = (mod > 0 && index < mod) ? index * averageSize : index * averageSize + mod;
        // 计算分配Q的个数，最后一组不足averageSize的只分配能分配到的个数
        int range = Math.min(averageSize, mqAll.size() - startIndex);
        // 按照挪过的位置，计算所属Q的下标
        for (int i = 0; i < range; i++) {
            result.add(mqAll.get((startIndex + i) % mqAll.size()));
        }
        return result;
    }
```

　　**RocketMQ按照Topic维度进行Rebalance，会导致一个很严重的结果：如果一个消费者组订阅多个Topic，可能会出现分配不均，部分处于排序前列的分配更多的队列，部分消费者处于空闲状态。**

　　**由于订阅多个Topic时可能会出现分配不均，这是在RocketMQ中我们为什么不建议同一个消费者组订阅多个Topic的重要原因。在这一点上，Kafka与不RocketMQ同，其是将所有Topic下的所有队列合并在一起，进行Rebalance，因此相对会更加平均。**

　　‍

# 触发时机

　　RocketMQ有三个时机会触发：

1. 启动的时候，会立即触发
2. 有消费实例数量的变更的时候。broker在接受到消费者的心跳包的时候如果发现这个实例是新的实例的时候，会广播一个消费者数量变更的事件给所有消费者实例；同理，当发现一个消费者实例的连接断了，也会广播这样的一个事件
3. 定时触发（默认20秒）。

    由于Broker只会通知一次，不保证client一定会收到变更事件通知，需要通过定时触发避免`Rebalance`通知丢失

　　‍
