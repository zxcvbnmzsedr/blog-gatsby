---
title: 使用CyclicBarrier解决团建问题
date: 2022-04-21 19:40
permalink: /topic/Java%E5%B9%B6%E5%8F%91%E5%B7%A5%E5%85%B7%E5%8C%85/%E5%B9%B6%E5%8F%91%E5%B7%A5%E5%85%B7/%E7%BA%BF%E7%A8%8B%E5%8D%8F%E4%BD%9C/%E4%BD%BF%E7%94%A8CyclicBarrier%E8%A7%A3%E5%86%B3%E5%9B%A2%E5%BB%BA%E9%97%AE%E9%A2%98
topic: 
  - topic
tags: null
categories: 
  - topic
  - Java并发工具包
  - 并发工具
  - 线程协作
  - 使用CyclicBarrier解决团建问题
---
# 使用CyclicBarrier解决团建问题

## 团建问题介绍

假设有一家公司要全体员工进行团建活动，活动内容为爬山，但是由于每一个人爬山的时间都是不一样的，因此需要等到所有人都爬过山头之后才能够一起去吃饭，但是每个饭桌只能容纳2个人。

## 模拟场景

我们用代码模拟这个场景:

```java
public class PartyBuilding {
    public static void main(String[] args) {
        CyclicBarrier cyclicBarrier = new CyclicBarrier(2, () -> System.out.println("有两人到齐了,干饭~~~"));
        Climbing employee1 = new Climbing("甲", cyclicBarrier);
        Climbing employee2 = new Climbing("乙", cyclicBarrier);
        Climbing employee3 = new Climbing("丙", cyclicBarrier);
        Climbing employee4 = new Climbing("丁", cyclicBarrier);
        Climbing employee5 = new Climbing("戊", cyclicBarrier);
        Climbing employee6 = new Climbing("己", cyclicBarrier);
        ExecutorService executorService = Executors.newFixedThreadPool(5);
        executorService.submit(employee1);
        executorService.submit(employee2);
        executorService.submit(employee3);
        executorService.submit(employee4);
        executorService.submit(employee5);
        executorService.submit(employee6);
    }

    public static class Climbing implements Runnable {
        private String name;
        private CyclicBarrier cyclicBarrier;

        public Climbing(String name, CyclicBarrier cyclicBarrier) {
            this.name = name;
            this.cyclicBarrier = cyclicBarrier;
        }

        @Override
        public void run() {
            System.out.println("员工:" + name + "开始爬山~~");
            try {
                long climbingTime = (long) (Math.random() * 4000);
                Thread.sleep(climbingTime);
                System.out.println("员工:" + name + " 用时:" + climbingTime + ",等待人齐去吃饭~~");
                cyclicBarrier.await();
            } catch (InterruptedException | BrokenBarrierException e) {
                e.printStackTrace();
            }
        }
    }
}
```

运行结果如下:

```java
员工:乙开始爬山~~
员工:戊开始爬山~~
员工:甲开始爬山~~
员工:丁开始爬山~~
员工:丙开始爬山~~
员工:丁 用时:813,等待人齐去吃饭~~
员工:丙 用时:2022,等待人齐去吃饭~~
有两人到齐了,干饭~~~
员工:己开始爬山~~
员工:乙 用时:2500,等待人齐去吃饭~~
员工:己 用时:933,等待人齐去吃饭~~
有两人到齐了,干饭~~~
员工:甲 用时:3215,等待人齐去吃饭~~
员工:戊 用时:3898,等待人齐去吃饭~~
有两人到齐了,干饭~~~
```

能够看到，这段代码输出的结果，符合我们的预期

从这段代码中，首先建了参数为2的一个CyclicBarrier，这意味着需要等待2个线程到达这个集结点才统一放行，每2个执行一次runable里面的干饭逻辑。

## CyclicBarrier 和 CountDownLatch 的异同

### 相同点

都能够阻塞一个或一组线程，直到某个预设的条件达成发送，再统一出发。

### 不同点

#### 作用对象不同

CyclicBarrier作用于线程，需要等到线程执行完成之后，计数器则减一，到0的时候就继续执行。

CountDownLatch作用于事件，需要通过调用countDown才能够计数器减一，直到0才继续执行。

#### 可重用性不同

CyclicBarrier可以重复使用，在计时器归零后，会重置计时器重新开始计数，甚至还能通过reset主动重置计数器，如果重置时有线程已经调用await并开始等待，等待的线程会抛出BrokenBarrierException异常。

CountDownLatch在倒数到0的时候，就不能再次使用了，除非新建一个新的实例。

#### 执行动作不同

CyclicBarrier有执行动作，在满足计数器归零的时候会调用barrierAction执行一个回调操作。

CountDownLatch没有这个功能
