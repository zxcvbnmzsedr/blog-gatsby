---
title: 生产者消费者模型
date: 2022-04-21 19:40
permalink: /topic/Java%E5%B9%B6%E5%8F%91%E5%B7%A5%E5%85%B7%E5%8C%85/%E5%B9%B6%E5%8F%91%E5%9F%BA%E7%A1%80/%E7%BA%BF%E7%A8%8B%E5%9F%BA%E7%A1%80/%E7%94%9F%E4%BA%A7%E8%80%85%E6%B6%88%E8%B4%B9%E8%80%85%E6%A8%A1%E5%9E%8B
topic: 
  - topic
tags: null
categories: 
  - topic
  - Java并发工具包
  - 并发基础
  - 线程基础
  - 生产者消费者模型
---
## 生产者消费者模式

　　生产者消费者，是在软件开发中很常见的一种设计模式，大致结构如下图

　　![生产者消费者模型](https://www.shiyitopo.tech/uPic/%E7%94%9F%E4%BA%A7%E8%80%85%E6%B6%88%E8%B4%B9%E8%80%85%E6%A8%A1%E5%9E%8B.png)

　　生产者和消费者最核心的就是那个队列，用于平衡**生产者生产速度和消费者消费速度不一致**

1. 在队列满了之后，生产者则会阻塞，在队列空了之后，消费者则会阻塞。
2. 队列非空组则提醒消费者继续消费，队列非慢则提醒生产者继续生产

## 使用 BlockingQueue 实现生产者消费者模式

　　代码很简单

　　就是创建两个消费者线程和两个生产者线程，通过BlockQueue这个中间媒介，时期不断的进行生产-> 消费的循环

```java
public static void main(String[] args) {
        BlockingQueue<Object> queue = new ArrayBlockingQueue<>(10);
        Runnable producer = () -> {
            while (true) {
                try {
                    queue.put(new Object());
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
            }
        };
        new Thread(producer).start();
        new Thread(producer).start();
        Runnable consumer = () -> {
            while (true) {
                try {
                    queue.take();
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
            }

        };
        new Thread(consumer).start();
        new Thread(consumer).start();
    }
```

## 使用 Condition 实现生产者消费者模式

　　我们利用lock的Condition来实现一个简易版的BlockingQueue

```java
public static class MyBlockingQueueForCondition {
        private Queue queue;
        private int max = 16;
        private ReentrantLock lock = new ReentrantLock();
        private Condition notFull = lock.newCondition();
        private Condition notEmpty = lock.newCondition();

        public MyBlockingQueueForCondition(int max) {
            this.max = max;
            queue = new LinkedList();
        }

        public void put(Object v) throws InterruptedException {
            lock.lock();
            try {
                while (queue.size() == max) {
                    notFull.await();
                }
                queue.add(v);
                notEmpty.signalAll();
            } finally {
                lock.unlock();
            }
        }

        public Object take() throws InterruptedException {
            lock.lock();
            try {
                while (queue.size() == 0) {
                    notEmpty.await();
                }
                Object o = queue.remove();
                notFull.signalAll();
                return o;
            } finally {
                lock.unlock();
            }
        }
    }
```

　　最灵魂的操作是使用while循环来判断临界情况 ，**为什么不用if来进行判断**?

　　在多个线程进入put操作的时候，发现队列已经满了，多个线程都进入等待状态，然后在notFull.signalAll()的时候多个线程都会调用add(v)操作，导致队列中的数量大于max的限定值;反之，同理。

## 使用 wait/notify 实现生产者消费者模式

　　使用wait/notify的方式，是使用lock的方式相似。

```java
class MyBlockingQueue {

   private int maxSize;

   private LinkedList<Object> storage;

   public MyBlockingQueue(int size) {

       this.maxSize = size;

       storage = new LinkedList<>();

   }

   public synchronized void put() throws InterruptedException {
       while (storage.size() == maxSize) {
           wait();
       }
       storage.add(new Object());
       notifyAll();
   }

   public synchronized void take() throws InterruptedException {
       while (storage.size() == 0) {
           wait();
       }
       storage.poll();
       notifyAll();
   }

}
```
