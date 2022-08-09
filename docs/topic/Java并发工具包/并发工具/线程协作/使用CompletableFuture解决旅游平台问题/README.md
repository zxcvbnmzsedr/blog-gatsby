---
title: 使用CompletableFuture解决旅游平台问题
date: 2022-04-21 19:40
permalink: /topic/Java%E5%B9%B6%E5%8F%91%E5%B7%A5%E5%85%B7%E5%8C%85/%E5%B9%B6%E5%8F%91%E5%B7%A5%E5%85%B7/%E7%BA%BF%E7%A8%8B%E5%8D%8F%E4%BD%9C/%E4%BD%BF%E7%94%A8CompletableFuture%E8%A7%A3%E5%86%B3%E6%97%85%E6%B8%B8%E5%B9%B3%E5%8F%B0%E9%97%AE%E9%A2%98
topic: 
  - topic
tags: null
categories: 
  - topic
  - Java并发工具包
  - 并发工具
  - 线程协作
  - 使用CompletableFuture解决旅游平台问题
---
## 旅游平台问题介绍

　　如果要搭建一个旅游平台，经常会有这样的需求，就是用户想同时获取多个航空公司的航班信息。

　　比如: 北京到上海的票价。由于有很多公司都有这样的航班信息，所以应该获取到所有航空公司的信息，然后聚合输出。

　　![CompletableFuture](https://www.shiyitopo.tech/uPic/CompletableFuture.png)

### 串行获取

　　最传统的解决方案

　　![串行获取示意图](https://www.shiyitopo.tech/uPic/%E4%B8%B2%E8%A1%8C%E8%8E%B7%E5%8F%96%E7%A4%BA%E6%84%8F%E5%9B%BE.png)

　　我们获取价格的时候，先去访问`国航`等`国航`有响应之后，再去访问下一个航空公司，如果航空公司较多，每个响应都需要1s的话，十几个航空公司就是几十秒，用户肯定等不及。

### 并行获取

　　![并行获取](https://www.shiyitopo.tech/uPic/%E5%B9%B6%E8%A1%8C%E8%8E%B7%E5%8F%96.png)

　　如果我们换成并行的去请求各个网站信息，效果就能好很多。

　　只需要规定一个超时的总时长，比如3s，3s之后返回的响应一概不管，只把前3s获取到的结果进行返回，即使数据有所丢失，但是也比一直等待的强。

## 使用线程池实现

```java
public class PriceDemo {
    ExecutorService threadPool = Executors.newFixedThreadPool(3);
    public static void main(String[] args) throws InterruptedException {
        PriceDemo priceDemo = new PriceDemo();
        System.out.println(priceDemo.getPrices());
    }
    private Set<String> getPrices() throws InterruptedException {
        Set<String> prices = Collections.synchronizedSet(new HashSet<>());
        threadPool.submit(new Task("国行", prices));
        threadPool.submit(new Task("海航", prices));
        threadPool.submit(new Task("东航", prices));
        Thread.sleep(3000);
        return prices;
    }
    /**
     * 获取价格
     */
    private class Task implements Runnable {
        private String name;
        private Set<String> prices;

        public Task(String name, Set<String> prices) {
            this.name = name;
            this.prices = prices;
        }
        @Override
        public void run() {
            try {
                int price = (int) (Math.random() * 4000);
                Thread.sleep(price);
                prices.add(name + ": " + price);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }
    }
}
```

　　在代码中，新建了一个线程安全的set，用于存储各个航空公司的价格信息。

　　然后通过向线程池提交获取价格的任务，最后线程睡3s，模拟用户等待的时间，最后在3s之内获取到的结果进行返回。

　　这就是使用线程池去实现的最基础的方案。

## [CountDownLatch](CountDownLatch详解.md)

　　我们可以采用CountDownLatch去对上面的代码进行一个优化。

　　上面的代码，最大的问题是无论如何都需要等待3秒，假如网络特别好，处理速度特别快，可能几百毫秒就返回了，所以就会白白等待一段时间。

　　所以需要改进一下:

```java
public class PriceDemo {
    ExecutorService threadPool = Executors.newFixedThreadPool(3);
    public static void main(String[] args) throws InterruptedException {
        PriceDemo priceDemo = new PriceDemo();
        System.out.println(priceDemo.getPrices());
    }
    private Set<String> getPrices() throws InterruptedException {
        Set<String> prices = Collections.synchronizedSet(new HashSet<>());
        CountDownLatch countDownLatch = new CountDownLatch(3);
        threadPool.submit(new Task("国行", prices, countDownLatch));
        threadPool.submit(new Task("海航", prices, countDownLatch));
        threadPool.submit(new Task("东航", prices, countDownLatch));
        countDownLatch.await(3, TimeUnit.SECONDS);
        return prices;
    }

    /**
     * 获取价格
     */
    private class Task implements Runnable {
        private String name;
        private Set<String> prices;
        private CountDownLatch countDownLatch;
        public Task(String name, Set<String> prices, CountDownLatch countDownLatch) {
            this.name = name;
            this.prices = prices;
            this.countDownLatch = countDownLatch;
        }
        @Override
        public void run() {
            try {
                int price = (int) (Math.random() * 4000);
                Thread.sleep(price);
                prices.add(name + ": " + price);
            } catch (InterruptedException e) {
                e.printStackTrace();
            } finally {
                countDownLatch.countDown();
            }
        }
    }
}

```

　　使用CoutDownLatch，来进行任务执行的统计，每完成一个任务，CoutDownLatch的数量则减一。

　　然后使用await进行等待，await方法会阻塞当前线程，只有任务执行完，或者在规定时间内没有响应才会往下走。

　　这就可以保证，总用时会永远小于等于3s.

## e'mCompletableFuture

　　CompletableFuture 提供了简单快速的方法让我们去实现上面使用CountDownLatch实现的代码逻辑。

```java
public static void main(String[] args) throws InterruptedException {
        PriceDemo priceDemo = new PriceDemo();
        System.out.println(priceDemo.getPrices());
    }

    private Set<String> getPrices() throws InterruptedException {
        Set<String> prices = Collections.synchronizedSet(new HashSet<>());
        CompletableFuture<Void> task1 = CompletableFuture.runAsync(new Task("国行", prices));
        CompletableFuture<Void> task2 = CompletableFuture.runAsync(new Task("海航", prices));
        CompletableFuture<Void> task3 = CompletableFuture.runAsync(new Task("东航", prices));
        CompletableFuture<Void> allTask = CompletableFuture.allOf(task1, task2, task3);
        try {
            allTask.get(3,TimeUnit.SECONDS);
        } catch (ExecutionException | TimeoutException e) {
            e.printStackTrace();
        }
        return prices;
    }
    /**
     * 获取价格
     */
    private class Task implements Runnable {
        private String name;
        private Set<String> prices;
        public Task(String name, Set<String> prices) {
            this.name = name;
            this.prices = prices;
        }
        @Override
        public void run() {
            try {
                int price = (int) (Math.random() * 4000);
                Thread.sleep(price);
                prices.add(name + ": " + price);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }
    }
}
```

　　我们可以从代码中看到，CompletableFuture对Task进行了包装，然后通过allOf将所有任务聚合起来，最后通过allTask.get()阻塞线程，如果任务超时会进入异常中，我们可以根据异常再去做对应的异常处理，相对于自己使用CountDownLatch实现的，功能性会多一些。
