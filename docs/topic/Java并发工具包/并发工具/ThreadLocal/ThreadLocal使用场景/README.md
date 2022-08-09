---
title: ThreadLocal使用场景
date: 2022-04-21 19:40
permalink: /topic/Java%E5%B9%B6%E5%8F%91%E5%B7%A5%E5%85%B7%E5%8C%85/%E5%B9%B6%E5%8F%91%E5%B7%A5%E5%85%B7/ThreadLocal/ThreadLocal%E4%BD%BF%E7%94%A8%E5%9C%BA%E6%99%AF
topic: 
  - topic
tags: null
categories: 
  - topic
  - Java并发工具包
  - 并发工具
  - ThreadLocal
  - ThreadLocal使用场景
---
在业务开发中有两种典型的使用场景。

1. 保存线程不安全的对象。
2. 传递全局变量

## 保存线程不安全的工具类

　　典型的类: SimpleDateFormat

　　如果有多个线程同时调用下面这个方法，由于dateFormat是局部变量，不会有线程安全问题；但是会创建出大量的SimpleDateFormat对象，造成频繁的GC。

```java
public String date() {
        SimpleDateFormat dateFormat = new SimpleDateFormat("mm:ss");
        return dateFormat.format(new Date());
 }
```

　　如果我们声明成全局变量呢？

```java
static SimpleDateFormat dateFormat = new SimpleDateFormat("mm:ss");
public String date(){
   return dateFormat.format(new Date());
}
```

　　在多个线程访问下，不同的线程都是指向同一个对象，会有线程安全的问题、

　　用传统的解决方法: 加锁

```java
static SimpleDateFormat dateFormat = new SimpleDateFormat("mm:ss");
public synchronized String date(){
   return dateFormat.format(new Date());
}
```

　　加锁的方式的确能够解决线程不安全的问题，但是也带来了性能低下。

　　正确的方式是采用ThreadLocal来创建对象

```java
public synchronized String date(){
   SimpleDateFormat dateFormat = ThreadSafeFormatter.dateFormatThreadLocal.get();
   return dateFormat.format(new Date());
}
class ThreadSafeFormatter {
    public static ThreadLocal<SimpleDateFormat> dateFormatThreadLocal = new ThreadLocal<SimpleDateFormat>() {
        @Override
        protected SimpleDateFormat initialValue() {
            return new SimpleDateFormat("mm:ss");
        }
    };

}
```

　　这种创建的方式，最多创建的对象只和线程数相同。这样既高效的使用了内存，也保证了线程安全。

## 传递全局变量

　　每个线程内需要保存类似于全局变量的信息，可以让不同方法直接使用，避免参数传递的麻烦却不想被多线程共享。

　　例如，用 ThreadLocal 保存一些业务内容，这些信息在同一个线程内相同，但是不同的线程使用的业务内容是不相同的。

　　在线程生命周期内，都通过这个静态 ThreadLocal 实例的 get() 方法取得自己 set 过的那个对象，避免了将这个对象作为参数传递的麻烦。

　　案例:

+ 在分布式链路追踪中，log4j的MDC对象
+ 业务系统中，使用ThreadLocal传递用户信息

## 面试题: ThreadLocal是用来解决共享资源的多线程访问吗?

　　这道题的答案很明确——不是。

　　ThreadLocal不是用来解决共享资源问题的。虽然ThreadLocal可以用于解决多线程情况下的线程安全问题，但是**资源不是共享的，而是每个线程独享过的**。

　　面试官在忽悠你，独享资源何来的多线程访问呢？

　　ThreadLocal解决线程安全问题的时候，相比于使用“锁”而言，避免了竞争，采用了线程独享来进行操作。

　　具体而言，它可以在 initialValue 中 new 出自己线程独享的资源，而多个线程之间，它们所访问的对象本身是不共享的，自然就不存在任何并发问题。这是 ThreadLocal 解决并发问题的最主要思路。

　　如果变量变成了共享，则依然是线程不安全的:

```java
	public synchronized String date(){
   SimpleDateFormat dateFormat = ThreadSafeFormatter.dateFormatThreadLocal.get();
   return dateFormat.format(new Date());
}
class ThreadSafeFormatter {
  	static SimpleDateFormat format = new SimpleDateFormat();
    public static ThreadLocal<SimpleDateFormat> dateFormatThreadLocal = new ThreadLocal<SimpleDateFormat>() {
        @Override
        protected SimpleDateFormat initialValue() {
            return ThreadSafeFormatter.format;
        }
    };

}
```

### ThreadLocal 和 synchronized 是什么关系

　　当 ThreadLocal 用于解决线程安全问题的时候，也就是把一个对象给每个线程都生成一份独享的副本的，在这种场景下，ThreadLocal 和 synchronized 都可以理解为是用来保证线程安全的手段。

　　但是效果和实现原理不同：

- ThreadLocal 是通过让每个线程独享自己的副本，避免了资源的竞争。
- synchronized 主要用于临界资源的分配，在同一时刻限制最多只有一个线程能访问该资源。
