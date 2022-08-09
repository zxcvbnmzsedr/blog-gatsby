---
title: 线程不安全
date: 2022-04-21 19:40
permalink: /topic/Java%E5%B9%B6%E5%8F%91%E5%B7%A5%E5%85%B7%E5%8C%85/%E5%B9%B6%E5%8F%91%E5%9F%BA%E7%A1%80/%E7%BA%BF%E7%A8%8B%E5%AE%89%E5%85%A8/%E7%BA%BF%E7%A8%8B%E4%B8%8D%E5%AE%89%E5%85%A8
topic: 
  - topic
tags: null
categories: 
  - topic
  - Java并发工具包
  - 并发基础
  - 线程安全
  - 线程不安全
---
## 线程不安全示例

　　如果多个线程对同一个共享数据进行访问而不采取同步操作的话，那么操作的结果是不一致的。

　　以下代码演示了 1000 个线程同时对 cnt 执行自增操作，操作结束之后它的值有可能小于 1000。

```java
public class ThreadUnsafeExample {

    private int cnt = 0;

    public void add() {
        cnt++;
    }

    public int get() {
        return cnt;
    }
}

public static void main(String[] args) throws InterruptedException {
    final int threadSize = 1000;
    ThreadUnsafeExample example = new ThreadUnsafeExample();
    final CountDownLatch countDownLatch = new CountDownLatch(threadSize);
    ExecutorService executorService = Executors.newCachedThreadPool();
    for (int i = 0; i < threadSize; i++) {
        executorService.execute(() -> {
            example.add();
            countDownLatch.countDown();
        });
    }
    countDownLatch.await();
    executorService.shutdown();
    System.out.println(example.get());
}

997 // 结果总是小于1000

```
