---
title: CountDownLatch详解
date: 2022-04-21 19:40  
tags: [并发工具,线程协作]
---
## 介绍

CountDownLatch是由AQS实现的，用来同步一个或多个任务的并发工具类。

利用它可以实现类似计数器的功能，比如有一个任务A，它要等待其他4个任务执行完毕之后才能执行，此时就可以利用CountDownLatch来实现这种功能。

就像下面的这个例子，主线程会阻塞到`Thread-1`、和`Thread-2`都执行完成之后，才能往下执行

```java
public class Test {
    public static void main(String[] args) {
        final CountDownLatch latch = new CountDownLatch(2);
        new Thread() {
            public void run() {
                try {
                    System.out.println("子线程" + Thread.currentThread().getName() + "正在执行");
                    Thread.sleep(3000);
                    System.out.println("子线程" + Thread.currentThread().getName() + "执行完毕");
                    latch.countDown();
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
            };
        }.start();
        new Thread() {
            public void run() {
                try {
                    System.out.println("子线程" + Thread.currentThread().getName() + "正在执行");
                    Thread.sleep(3000);
                    System.out.println("子线程" + Thread.currentThread().getName() + "执行完毕");
                    latch.countDown();
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
            };
        }.start();
        try {
            System.out.println("等待2个子线程执行完毕...");
            latch.await();
            System.out.println("2个子线程已经执行完毕");
            System.out.println("继续执行主线程");
        } catch (InterruptedException e) { e.printStackTrace();   }    }}
```

输出结果:

```java
等待2个子线程执行完毕...
子线程Thread-1正在执行
子线程Thread-0正在执行
子线程Thread-0执行完毕
子线程Thread-1执行完毕
2个子线程已经执行完毕
继续执行主线程
```
