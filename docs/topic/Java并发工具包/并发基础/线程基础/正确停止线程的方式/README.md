---
title: 正确停止线程的方式
date: 2022-04-21 19:40
permalink: /topic/Java%E5%B9%B6%E5%8F%91%E5%B7%A5%E5%85%B7%E5%8C%85/%E5%B9%B6%E5%8F%91%E5%9F%BA%E7%A1%80/%E7%BA%BF%E7%A8%8B%E5%9F%BA%E7%A1%80/%E6%AD%A3%E7%A1%AE%E5%81%9C%E6%AD%A2%E7%BA%BF%E7%A8%8B%E7%9A%84%E6%96%B9%E5%BC%8F
topic: 
  - topic
tags: null
categories: 
  - topic
  - Java并发工具包
  - 并发基础
  - 线程基础
  - 正确停止线程的方式
---
正常情况下，我们不会主动去停止线程，而是让程序执行完，线程自动停止。

　　但是，在某些情况下，比如用户主动关闭程序、或者程序出错的时候，需要我们提前停止线程。

　　但是,**在Java中，没有干净，快速或可靠的方法来阻止线程。**

　　不过在Java中，依然可以使用不太优雅的方式来停止线程，大致可以分为三种

1. 直接调用thread.stop、或者thread.suspend
2. 通过volatile关键字
3. 通过interrupt机制

　　其中，第一种方式，已经被JDK废弃，会带来不可预知的风险

　　第二种方式，则不够完美，也不建议使用

## 废弃的停止方式

### Thread.stop和suspend被废弃的原因

　　在官方文档注释中，已经标明了废弃的原因。https://docs.oracle.com/javase/8/docs/technotes/guides/concurrency/threadPrimitiveDeprecation.html

　　**对于stop被废弃的原因: **

> Because it is inherently unsafe. Stopping a thread causes it to unlock all the monitors that it has locked. (The monitors are unlocked as the ThreadDeath exception propagates up the stack.) If any of the objects previously protected by these monitors were in an inconsistent state, other threads may now view these objects in an inconsistent state. Such objects are said to be damaged. When threads operate on damaged objects, arbitrary behavior can result. This behavior may be subtle and difficult to detect, or it may be pronounced. Unlike other unchecked exceptions, ThreadDeath kills threads silently; thus, the user has no warning that his program may be corrupted. The corruption can manifest itself at any time after the actual damage occurs, even hours or days in the future.
>
> 因为stop方法天生就是不安全的，调用stop方法来停止线程，会导致这个线程释放所有的监视器锁，如果有其他线程也在获取这个监视器锁，那么就会看到这个被解锁的对象，当线程去操作这个对象的时候会导致意外的结果。这些行为可能是微妙且难以预测，或者也有可能展现出明显的错误。不想其他的受检的异常，ThreadDeath会默默的杀死线程，因此在用户在没有收到这个异常的错误的时候，运行结果可能是错误的。但是错误可能在几个小时甚至是几天之后才能被发现。
>

　　**对于suspend被废弃的原因**

> `Thread.suspend` is inherently deadlock-prone. If the target thread holds a lock on the monitor protecting a critical system resource when it is suspended, no thread can access this resource until the target thread is resumed. If the thread that would resume the target thread attempts to lock this monitor prior to calling `resume`, deadlock results. Such deadlocks typically manifest themselves as "frozen" processes.
>
> suspend有天然的死锁情况，如果目标线程持有了监视器锁，在他挂起的时候，没有任何线程可以访问这个锁资源，知道目标线程调用resume唤起了线程。如果在某种情况下要先获取锁在执行resume方法， 那么这个时候就会造成死锁，这个表现为线程的冻结。
>

### volatile标记停止位的错误

　　在一般情况下没有问题，如下面的代码:

　　通过canceled来标记取消状态，正常情况下没有任何问题

```java
public class Demo implements Runnable {
    private static volatile boolean canceled = false;
    @Override
    public void run() {
        int num = 0;
        while(num <= Integer.MAX_VALUE / 2 && !canceled){
            if(num % 100 == 0){
                System.out.println(num + "是100的倍数");
            }
            num++;
        }
        System.out.println("退出");
    }
    public static void main(String[] args) throws InterruptedException {
        Thread thread = new Thread(new Demo7());
        thread.start();
        Thread.sleep(1000);
        canceled = true;
    }
}
```

　　但是，在线程进入了阻塞状态，将不能通过修改volatile变量来停止线程.

　　下面的例子展示了，不断的向阻塞队列里面塞入数据，一旦塞入满了线程就会被阻塞在**this.storage.put(num);**那里。

　　这个时候，即使修改cancel变量，线程也无法停止。

```java
/**
 * 通过生产者消费者模式演示volatile的局限性，volatile不能唤醒已经阻塞的线程
 * 生产者生产速度很快，消费者消费速度很慢，通过阻塞队列存储商品
 */
public class Demo {
    public static void main(String[] args) throws InterruptedException {
        ArrayBlockingQueue storage = new ArrayBlockingQueue(10);

        Producer producer = new Producer(storage);
        Thread producerThread = new Thread(producer);
        producerThread.start();
        Thread.sleep(1000);//1s足够让生产者把阻塞队列塞满

        Consumer consumer = new Consumer(storage);
        while(consumer.needMoreNums()){
            System.out.println(storage.take() + "被消费");
            Thread.sleep(100);//让消费者消费慢一点，给生产者生产的时间
        }

        System.out.println("消费者消费完毕");
        producer.canceled = true;//让生产者停止生产（实际情况是不行的，因为此时生产者处于阻塞状态，volatile不能唤醒阻塞状态的线程）

    }
}

class Producer implements Runnable{

    public volatile boolean canceled = false;

    private BlockingQueue storage;

    public Producer(BlockingQueue storage) {
        this.storage = storage;
    }

    @Override
    public void run() {
        int num = 0;
        try{
            while(num < Integer.MAX_VALUE / 2 && !canceled){
                if(num % 100 == 0){
                    this.storage.put(num);
                    System.out.println(num + "是100的倍数，已经被放入仓库");
                }
                num++;
            }
        } catch (InterruptedException e) {
            e.printStackTrace();
        }finally {
            System.out.println("生产者停止生产");
        }
    }
}

class Consumer{
    private BlockingQueue storage;

    public Consumer(BlockingQueue storage) {
        this.storage = storage;
    }

    public boolean needMoreNums(){
        return Math.random() < 0.95 ? true : false;
    }
}
```

## 正确的停止方式

### 通过interrupt方式停止

　　还是刚刚那个例子，在生产者满了之后，无法监听到volatile状态的变化导致无法停止线程。

　　如果通过interrupt的方式就很容易解决。

```java
/**
 * 通过生产者消费者模式演示volatile的局限性，volatile不能唤醒已经阻塞的线程
 * 生产者生产速度很快，消费者消费速度很慢，通过阻塞队列存储商品
 */
public class Demo {
    public static void main(String[] args) throws InterruptedException {
        ArrayBlockingQueue storage = new ArrayBlockingQueue(10);

        Producer producer = new Producer(storage);
        Thread producerThread = new Thread(producer);
        producerThread.start();
        Thread.sleep(1000);//1s足够让生产者把阻塞队列塞满

        Consumer consumer = new Consumer(storage);
        while(consumer.needMoreNums()){
            System.out.println(storage.take() + "被消费");
            Thread.sleep(100);//让消费者消费慢一点，给生产者生产的时间
        }

        System.out.println("消费者消费完毕");
        producerThread.interrupt();
    }
}

class Producer implements Runnable{

    private BlockingQueue storage;

    public Producer(BlockingQueue storage) {
        this.storage = storage;
    }

    @Override
    public void run() {
        int num = 0;
        try{
            while(num < Integer.MAX_VALUE / 2 && !Thread.currentThread().isInterrupted()){
                if(num % 100 == 0){
                    this.storage.put(num);
                    System.out.println(num + "是100的倍数，已经被放入仓库");
                }
                num++;
            }
        } catch (InterruptedException e) {
            e.printStackTrace();
        }finally {
            System.out.println("生产者停止生产");
        }
    }
}

class Consumer{
    private BlockingQueue storage;

    public Consumer(BlockingQueue storage) {
        this.storage = storage;
    }

    public boolean needMoreNums(){
        return Math.random() < 0.95 ? true : false;
    }
}
```

## 所以Java中如何正确的停止线程

### 答题思路

1. 停止线程的正确方式是使用中断
2. 想停止线程需要停止方，被停止方，被停止方的子方法相互配合
3. 解释为何不用已被废弃的stop/suspend
4. 解释volatile为何不能用于中断线程

　　​
