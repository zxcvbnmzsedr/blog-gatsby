---
title: Thread的状态
date: 2022-04-21 19:40  
tags: [并发基础,线程基础]
---
![image-20211101163645288](https://www.shiyitopo.tech/uPic/image-20211101163645288.png)

## New

new状态标识Thread已经创建了，也就是new Thread() ,但是没有调用start方法。

一旦调用start方法，状态就会从New 转换成 Runable

## Runable

Java中的Runable状态，对应着操作系统中的两种状态Running 或者 Ready

Java重处于Runable中的线程，有可能处于正在`执行`的状态，也有可能处于没有正在`执行`等待分配CPU资源

## 阻塞态

### Block

从Runable进入到Block只会有一种情况，在Synchronized修饰的代码运行时没有获取到monitor锁的时候，会进入Block状态

### Timed Watting

进入timed watting有三种可能性

1. 设置timeout参数的Object.wait()
2. 设置timeout参数的Thread.join()
3. LockSuport.parkUntil(timeout)或LockSuport.parkNanos(timeout)方法

## Watting

进入watting有三种可能性

1. 没有设置timeout参数的Object.wait()
2. 没有设置timeout参数的Thread.join()
3. LockSuport.park()方法

如果其他线程调用notify或者notifyAll方法来唤醒线程，会直接进入到block状态。因为唤醒watting的线程必须要持有monitor，所以处于watting状态的线程被唤醒时拿不到monitor锁则会进入block状态
