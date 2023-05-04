---
title: 原子类的性能分析
date: 2022-04-21 19:40
permalink: /topic/Java%E5%B9%B6%E5%8F%91%E5%B7%A5%E5%85%B7%E5%8C%85/%E5%B9%B6%E5%8F%91%E5%B7%A5%E5%85%B7/%E5%8E%9F%E5%AD%90%E7%B1%BB/%E5%8E%9F%E5%AD%90%E7%B1%BB%E7%9A%84%E6%80%A7%E8%83%BD%E5%88%86%E6%9E%90
topic: 
  - topic
tags: null
categories: 
  - topic
  - Java并发工具包
  - 并发工具
  - 原子类
  - 原子类的性能分析
---
# 原子类的性能分析

在并发情况下，如果我们需要实现一个计数器，则可以利用AtomicInteger和AtomicLong来进行实现，

这样可以避免加锁和复杂的代码逻辑，并且还能有较好的性能，而我们仅仅需要调用已经封装好的方法。

但是,**如果业务场景的并发量十分的大，会有较大的性能问题**

我们使用AtomicLong来举例

## AtomicLong的问题

常见的用法是调用**incrementAndGet()**来实现i++的操作，我们来看下这个方法是如何实现的。

```java
public class AtomicLong extends Number implements java.io.Serializable {
...
private static final long VALUE  = U.objectFieldOffset(AtomicLong.class, "value");
private volatile long value;
public final long incrementAndGet() {
        return U.getAndAddLong(this, VALUE, 1L) + 1L;
 }
 ...
}
```

他会调用Unsafe方法中的getAndAddLong来实现，而Unsafe中的方法都是采用CAS的形式来实现线程安全的。

在大量冲突的时候，大量线程处在自旋状态，导致CPU飙升。

而且，对于AtomicLong内部的value属性而言，是被volatile修饰的，这样一来每一次数值变化都需要进行flush到共享内存和reflush到本地内存。由于竞争激烈，这种flush和reflush也会浪费大量的时间。

## 升级版LongAdder

因为 LongAdder 引入了分段累加的概念，内部一共有两个参数参与计数：第一个叫作 base，它是一个变量，第二个是 Cell[] ，是一个数组。

其中的 base 是用在竞争不激烈的情况下的，可以直接把累加结果改到 base 变量上。

那么，当竞争激烈的时候，就要用到我们的 Cell[] 数组了。一旦竞争激烈，各个线程会分散累加到自己所对应的那个 Cell[] 数组的某一个对象中，而不会大家共用同一个。

这样一来，LongAdder 会把不同线程对应到不同的 Cell 上进行修改，降低了冲突的概率，这是一种分段的理念，提高了并发性，这就和 Java 7 的 ConcurrentHashMap 的 16 个 Segment 的思想类似。

竞争激烈的时候，LongAdder 会通过计算出每个线程的 hash 值来给线程分配到不同的 Cell 上去，每个 Cell 相当于是一个独立的计数器，这样一来就不会和其他的计数器干扰，Cell 之间并不存在竞争关系，所以在自加的过程中，就大大减少了刚才的 flush 和 refresh，以及降低了冲突的概率，这就是为什么 LongAdder 的吞吐量比 AtomicLong 大的原因，本质是空间换时间，因为它有多个计数器同时在工作，所以占用的内存也要相对更大一些。

## 如何选择

在低竞争的情况下，AtomicLong 和 LongAdder 这两个类具有相似的特征，吞吐量也是相似的，因为竞争不高。但是在竞争激烈的情况下，LongAdder 的预期吞吐量要高得多，经过试验，LongAdder 的吞吐量大约是 AtomicLong 的十倍，不过凡事总要付出代价，LongAdder 在保证高效的同时，也需要消耗更多的空间。

### AtomicLong 可否被 LongAdder 替代？

那么我们就要考虑了，有了更高效的 LongAdder，那 AtomicLong 可否不使用了呢？是否凡是用到 AtomicLong 的地方，都可以用 LongAdder 替换掉呢？答案是不是的，这需要区分场景。

LongAdder 只提供了 add、increment 等简单的方法，适合的是统计求和计数的场景，场景比较单一，而 AtomicLong 还具有 compareAndSet 等高级方法，可以应对除了加减之外的更复杂的需要 CAS 的场景。

## 结论

如果我们的场景仅仅是需要用到加和减操作的话，那么可以直接使用更高效的 LongAdder，但如果我们需要利用 CAS 比如 compareAndSet 等操作的话，就需要使用 AtomicLong 来完成。
