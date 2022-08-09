---
title: synchronized和Lock的对比
date: 2022-04-21 19:40
permalink: /topic/Java%E5%B9%B6%E5%8F%91%E5%B7%A5%E5%85%B7%E5%8C%85/%E5%B9%B6%E5%8F%91%E5%B7%A5%E5%85%B7/%E5%90%84%E7%A7%8D%E9%94%81/synchronized%E5%92%8CLock%E7%9A%84%E5%AF%B9%E6%AF%94
topic: 
  - topic
tags: null
categories: 
  - topic
  - Java并发工具包
  - 并发工具
  - 各种锁
  - synchronized和Lock的对比
---
## 相同点

### 用来保护资源安全

　　最基本的作用

### 都可以保证可见性

　　对于 synchronized 而言，线程 A 在进入 synchronized 块之前或在 synchronized 块内进行操作，对于后续的获得同一个 monitor 锁的线程 B 是可见的，也就是线程 B 是可以看到线程 A 之前的操作的，这也体现了 happens-before 针对 synchronized 的一个原则。

　　![绘图2](https://www.shiyitopo.tech/uPic/%E7%BB%98%E5%9B%BE2.png)

　　而对于 Lock 而言，它和 synchronized 是一样，都可以保证可见性，如图所示，在解锁之前的所有操作对加锁之后的所有操作都是可见的。

　　![LockHappensBefor](https://www.shiyitopo.tech/uPic/LockHappensBefor.png)

### 都可重入

　　可重入指的是某个线程如果已经获得了一个锁，现在试图再次请求这个它已经获得的锁，如果它无需提前释放这个锁，而是直接可以继续使用持有的这个锁。
如果必须释放锁后才能再次申请这个锁，就是不可重入的。

　　而 synchronized 和 ReentrantLock 都具有可重入的特性。

## 不同点

### 用法不同

+ Lock的加锁方式是显示的。

  必须使用Lock对象来加锁和解锁，通常会在finally中使用unlock进行解锁，以避免出现异常锁无法释放的情况。
+ Synchronized的加锁方式是隐式。

  加锁解锁都不需要手动去控制，仅仅需要声明一下即可。不需要指定锁对象，可以在方法上、也可以在代码中加锁。

### 加解锁顺序不同

+ Lock的加解锁顺序可以自由控制

  如果有多把Lock锁，可以不按照加锁的顺序来反序解锁。如代码所示

  ```java
  lock1.lock();
  lock2.lock()
  ....
  lock1.unlock();
  lock2.unlock();
  ```
+ Synchronized的解锁顺序必须和解锁顺序完全相反

  ```java
  synchronized(obj1){
      synchronized(obj2){
          .....
      }
  }
  ```

  因为synchronized的由JVM控制的，在编译的时候会将上列代码解析成大致如下

  ```java
  monitorenter // 加obj1的锁
    monitorenter // 加obj2的锁

    monitorexit // 解obj2的锁
  monitorexit // 解obj2的锁
  ```

### synchronized锁不够灵活

　　一旦 synchronized 锁已经被某个线程获得了，此时其他线程如果还想获得，那它只能被阻塞，直到持有锁的线程运行完毕或者发生异常从而释放这个锁。如果持有锁的线程持有很长时间才释放，那么整个程序的运行效率就会降低，而且如果持有锁的线程永远不释放锁，那么尝试获取锁的线程只能永远等下去。

　　相比之下，Lock 类在等锁的过程中，如果使用的是 lockInterruptibly 方法，那么如果觉得等待的时间太长了不想再继续等待，可以中断退出，也可以用 tryLock() 等方法尝试获取锁，如果获取不到锁也可以做别的事，更加灵活。

### synchronized锁同时只能被一个线程拥有，Lock没有这个限制

　　例如在读写锁中的读锁，是可以同时被多个线程持有的，可是 synchronized 做不到。

　　Lock 根据实现不同，有不同的原理，例如 ReentrantLock 内部是通过 AQS 来获取和释放锁的。

### 是否可以设置公平锁

　　公平锁是指多个线程在等待同一个锁时，根据先来后到的原则依次获得锁。

　　ReentrantLock 等 Lock 实现类可以根据自己的需要来设置公平或非公平，synchronized 则不能设置。

### 性能区别

　　在 Java 5 以及之前，synchronized 的性能比较低，但是到了 Java 6 以后，发生了变化，因为 JDK 对 synchronized 进行了很多优化，比如自适应自旋、锁消除、锁粗化、轻量级锁、偏向锁等，所以后期的 Java 版本里的 synchronized 的性能并不比 Lock 差。

## [如何选择](lock的常用方法.md)

1. 如果能不用最好既不使用 Lock 也不使用 synchronized。

   因为在许多情况下你可以使用 java.util.concurrent 包中的机制，它会为你处理所有的加锁和解锁操作，也就是推荐优先使用工具类来加解锁。
2. 如果 synchronized 关键字适合你的程序， 那么请尽量使用它，这样可以减少编写代码的数量，减少出错的概率。

   因为一旦忘记在 finally 里 unlock，代码可能会出很大的问题，而使用 synchronized 更安全。
3. 如果特别需要 Lock 的特殊功能，比如尝试获取锁、可中断、超时功能等,或者是需要实现分布式锁的时候，才使用 Lock。
