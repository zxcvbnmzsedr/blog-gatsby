---
title: JVM锁优化
date: 2022-04-21 19:40  
tags: [并发工具,各种锁]
---
从JDK0.6开始，JVM对锁进行了各种各样的优化，目的是为了提高线程之间共享数据的效率，以及提高互斥同步的性能。

## 锁消除

锁消除是发生在编译器级别的一种锁优化方式。
有时候我们写的代码完全不需要加锁，却执行了加锁操作。

比如，StringBuffer类的append操作：

```java
@Override
public synchronized StringBuffer append(CharSequence s) {
  toStringCache = null;
  super.append(s);
  return this;
}
```

从源码中可以看出，append方法用了synchronized关键词，它是线程安全的。但我们可能仅在线程内部把StringBuffer当作局部变量使用：

```java
public class Demo {
public static void main(String[] args) {
  long start = System.currentTimeMillis();
  int size = 10000;
  for (int i = 0; i < size; i++) {
    createStringBuffer("123", "456");
  }
  long timeCost = System.currentTimeMillis() - start;
  System.out.println("createStringBuffer:" + timeCost + " ms");
}
  public static String createStringBuffer(String str1, String str2) {
    StringBuffer sBuf = new StringBuffer();
    sBuf.append(str1);// append方法是同步操作
    sBuf.append(str2);
    return sBuf.toString();
  }
}
```

代码中createStringBuffer方法中的局部对象sBuf，就只在该方法内的作用域有效，不同线程同时调用createStringBuffer()方法时，都会创建不同的sBuf对象，因此此时的append操作若是使用同步操作，就是白白浪费的系统资源。

这时我们可以通过编译器将其优化，将锁消除，前提是java必须运行在server模式（server模式会比client模式作更多的优化），同时必须开启逃逸分析: -server -XX:+DoEscapeAnalysis -XX:+EliminateLocks

> 逃逸分析：比如上面的代码，它要看sBuf是否可能逃出它的作用域？如果将sBuf作为方法的返回值进行返回，那么它在方法外部可能被当作一个全局对象使用，就有可能发生线程安全问题，这时就可以说sBuf这个对象发生逃逸了，因而不应将append操作的锁消除，但我们上面的代码没有发生锁逃逸，锁消除就可以带来一定的性能提升。
>

## 锁粗化

原则上，我们在编写代码的时候，总是推荐将同步块的作用范围限制得尽量小，只在共享数据的实际作用域中才进行同步，这样是为了使得需要同步的操作数量尽可能变小，如果存在锁竞争，那等待锁的线程也能尽快拿到锁。大部分情况下，上面的原则都是正确的，但是如果一系列的连续操作都对同一个对象反复加锁和解锁，甚至加锁操作是出现在循环体中的，那即使没有线程竞争，频繁地进行互斥同步操作也会导致不必要的性能损耗。

比如:

```java
for (int i = 0; i < 1000; i++) {
    synchronized (this) {
        //do something
    }
}
```

就会被粗化成:

```java
synchronized (this) {
   for (int i = 0; i < 1000; i++) {
          //do something
    }
}
```

## 自适应锁自旋

自适应意味着自旋的时间不再固定。

而是会根据最近自旋尝试的成功率、失败率，以及当前锁的拥有者的状态等多种因素来共同决定，自旋的持续时间是变化的。

比如，如果最近尝试自旋获取某一把锁成功了，那么下一次可能还会继续使用自旋，并且允许自旋更长的时间；

但是如果最近自旋获取某一把锁失败了，那么可能会省略掉自旋的过程，以便减少无用的自旋，提高效率。

## 偏向锁/轻量级锁/重量级锁

- 偏向锁

  对于偏向锁而言，它的思想是如果自始至终，对于这把锁都不存在竞争，那么其实就没必要上锁，只要打个标记就行了。一个对象在被初始化后，如果还没有任何线程来获取它的锁时，它就是可偏向的，当有第一个线程来访问它尝试获取锁的时候，它就记录下来这个线程，如果后面尝试获取锁的线程正是这个偏向锁的拥有者，就可以直接获取锁，开销很小。
- 轻量级锁

  JVM 的开发者发现在很多情况下，synchronized 中的代码块是被多个线程交替执行的，也就是说，并不存在实际的竞争，或者是只有短时间的锁竞争，用 CAS 就可以解决。这种情况下，重量级锁是没必要的。轻量级锁指当锁原来是偏向锁的时候，被另一个线程所访问，说明存在竞争，那么偏向锁就会升级为轻量级锁，线程会通过自旋的方式尝试获取锁，不会阻塞。
- 重量级锁

  这种锁利用操作系统的同步机制实现，所以开销比较大。当多个线程直接有实际竞争，并且锁竞争时间比较长的时候，此时偏向锁和轻量级锁都不能满足需求，锁就会膨胀为重量级锁。重量级锁会让其他申请却拿不到锁的线程进入阻塞状态。

## synchronized加锁流程

由于synchronized的加锁是通过对象头中的mark-word中的标记来判断的，所以我们必须得先了解对象结构。

![synchronized原理](https://www.shiyitopo.tech/uPic/synchronized%E5%8E%9F%E7%90%86.png)

在Hotspot虚拟机中，有其对应的对象结构:

http://hg.openjdk.java.net/jdk8/jdk8/hotspot/file/87ee5ee27509/src/share/vm/oops/markOop.hpp

```c++
64 bits:
--------
unused:25 hash:31 -->| unused:1   age:4    biased_lock:1 lock:2 (normal object)
JavaThread*:54 epoch:2 unused:1   age:4    biased_lock:1 lock:2 (biased object)
PromotedObject*:61 --------------------->| promo_bits:3 ----->| (CMS promoted object)
size:64 ----------------------------------------------------->| (CMS free block)
unused:25 hash:31 -->| cms_free:1 age:4    biased_lock:1 lock:2 (COOPs && normal object)
JavaThread*:54 epoch:2 cms_free:1 age:4    biased_lock:1 lock:2 (COOPs && biased object)
narrowOop:32 unused:24 cms_free:1 unused:4 promo_bits:3 ----->| (COOPs && CMS promoted objec
unused:21 size:35 -->| cms_free:1 unused:7 ------------------>| (COOPs && CMS free block)
```

整个加锁过程:

**整个加锁逻辑都在这里，最好自己手绘一遍，以领会其精神**

![加锁过程](https://www.shiyitopo.tech/uPic/%E5%8A%A0%E9%94%81%E8%BF%87%E7%A8%8B.png)
