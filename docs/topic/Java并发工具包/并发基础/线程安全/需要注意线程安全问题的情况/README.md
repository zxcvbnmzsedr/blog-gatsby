---
title: 需要注意线程安全问题的情况
date: 2022-04-21 19:40
permalink: /topic/Java%E5%B9%B6%E5%8F%91%E5%B7%A5%E5%85%B7%E5%8C%85/%E5%B9%B6%E5%8F%91%E5%9F%BA%E7%A1%80/%E7%BA%BF%E7%A8%8B%E5%AE%89%E5%85%A8/%E9%9C%80%E8%A6%81%E6%B3%A8%E6%84%8F%E7%BA%BF%E7%A8%8B%E5%AE%89%E5%85%A8%E9%97%AE%E9%A2%98%E7%9A%84%E6%83%85%E5%86%B5
topic: 
  - topic
tags: null
categories: 
  - topic
  - Java并发工具包
  - 并发基础
  - 线程安全
  - 需要注意线程安全问题的情况
---
# 需要注意线程安全问题的情况

## 访问共享变量或资源

一个变量在被多个线程同时读写时候，就会有线程安全问题

```java
public class ThreadNotSafe {
    static int i;
    public static void main(String[] args) throws InterruptedException {
        Runnable r = new Runnable() {
            @Override
            public void run() {
                for (int j = 0; j < 10000; j++) {
                    i++;
                }
            }
        };
        Thread thread1 = new Thread(r);
        Thread thread2 = new Thread(r);
        thread1.start();
        thread2.start();
        thread1.join();
        thread2.join();
        System.out.println(i);
    }
}
```

两个线程同时操作i这个变量，但是在相加之后总数总小于20000

## 依赖时序的操作

来看下面这段代码，在单线程的情况下没有任何问题。

在多线程的情况下，存在多个线程同时都进入map.containsKey(key)的代码，在A线程已经删除了obj之后，B线程依然来进行删除。

在多线程，进入一个不是原子的操作时，就会发生这种问题

```java
if (map.containsKey(key)){
		map.remove(obj);
}
```

## 对方没有声明自己是线程安全的

使用其他类时，如果对方没有声明自己是线程安全的，那么这种情况下对其他类进行多线程的并发操作，就有可能会发生线程安全问题。举个例子，比如说我们定义了 ArrayList，它本身并不是线程安全的，如果此时多个线程同时对 ArrayList 进行并发读/写，那么就有可能会产生线程安全问题，造成数据出错，而这个责任并不在 ArrayList，因为它本身并不是并发安全的，正如源码注释所写的：

```java
Note that this implementation is not synchronized. If multiple threads

access an ArrayList instance concurrently, and at least one of the threads

modifies the list structurally, it must be synchronized externally.
```

这段话的意思是说，如果我们把 ArrayList 用在了多线程的场景，需要在外部手动用 synchronized 等方式保证并发安全。

所以 ArrayList 默认不适合并发读写，是我们错误地使用了它，导致了线程安全问题。所以，我们在使用其他类时如果会涉及并发场景，那么一定要首先确认清楚，对方是否支持并发操作，以上就是四种需要我们额外注意线程安全问题的场景，分别是访问共享变量或资源，依赖时序的操作，不同数据之间存在绑定关系，以及对方没有声明自己是线程安全的。
