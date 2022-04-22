---
title: Semaphore信号量
date: 2022-04-21 19:40  
tags: [并发工具,线程协作]
---
## 介绍

Semaphore，通常我们叫它信号量，用于控制同时访问特定资源的线程数量，用于协调各个线程，以确保合理利用资源。

如下图所示，Semaphore在图中充当一个保镖的角色，在同一时刻只允许放行3个线程进来，其他的线程就在外面排队。

![Semaphore](https://www.shiyitopo.tech/uPic/Semaphore.png)

Semaphore会维护一个计数器，用于标记许可证的计数，线程去访问共享资源之前，需要先获取许可证，这时Semaphore持有的信号量需要-1，只要持有的数量为0 ，这时新的线程想要继续访问受保护的资源时，只有等待，等到其他持有许可证的线程释放了手中的许可证。

利用这种特性，可以很容易做出限流的功能

## 限流实现

请求访问到我们的应用上面，而这个应用又依赖这个慢服务

![慢服务](https://www.shiyitopo.tech/uPic/%E6%85%A2%E6%9C%8D%E5%8A%A1.png)

这个时候，就为了保证那个慢服务不被打垮，就需要对进来的请求进行一个限流的操作。

```java
public class TestSemaphore2 {
    final static Semaphore semaphore = new Semaphore(3);
    public static void main(String[] args) {
        ExecutorService pool = Executors.newFixedThreadPool(30);
        for (int i = 0; i < 1000; i++) {
            pool.submit(new Task());
        }
    }
    static class Task implements Runnable {
        @Override
        public void run() {
            try {
                semaphore.acquire();
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
            System.out.println(Thread.currentThread().getName() + "拿到了许可证");
            try {
                // 模拟业务耗时操作
                Thread.sleep(2000);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
            System.out.println("慢服务执行完毕，" + Thread.currentThread().getName() + "释放了许可证");
            semaphore.release();
        }
    }
}
```

这段代码中新建了一个数量为3的信号量，也就意味着同时只有3个线程可以访问我们的慢服务，其他线程则处于等待状态。

在线程最开始，通过acquire方法申请许可证（信号量持有的许可证会-1）,然后进行业务耗时操作，执行完成之后通过release()方法释放许可证。

许可证为0的情况下，调用accquire会阻塞。

最后打印出来的结果:

```java
pool-1-thread-2拿到了许可证
pool-1-thread-3拿到了许可证
pool-1-thread-4拿到了许可证
慢服务执行完毕，pool-1-thread-2释放了许可证
慢服务执行完毕，pool-1-thread-3释放了许可证
慢服务执行完毕，pool-1-thread-4释放了许可证
pool-1-thread-1拿到了许可证
pool-1-thread-6拿到了许可证
pool-1-thread-7拿到了许可证
慢服务执行完毕，pool-1-thread-6释放了许可证
慢服务执行完毕，pool-1-thread-7释放了许可证
慢服务执行完毕，pool-1-thread-1释放了许可证
....
```

通过运行结果可以看出，最多只有3个线程可以访问我们的慢服务

## 思考: FixedThreadPool可以替代Semaphore么?

如果我们把上面的例子，声明线程池的时候数量直接限死为3，是不是也能达到Semaphore的效果。

来尝试一下:

```java
public class TestSemaphore2 {
    public static void main(String[] args) {
        ExecutorService pool = Executors.newFixedThreadPool(3);
        for (int i = 0; i < 1000; i++) {
            pool.submit(new Task());
        }
    }
    static class Task implements Runnable {
        @Override
        public void run() {
            System.out.println(Thread.currentThread().getName() + "拿到了许可证");
            try {
                // 模拟业务耗时操作
                Thread.sleep(2000);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
            System.out.println("慢服务执行完毕，" + Thread.currentThread().getName() + "释放了许可证");
        }
    }
}
```

执行结果:

```java
pool-1-thread-1拿到了许可证
pool-1-thread-3拿到了许可证
pool-1-thread-2拿到了许可证
慢服务执行完毕，pool-1-thread-3释放了许可证
慢服务执行完毕，pool-1-thread-2释放了许可证
慢服务执行完毕，pool-1-thread-1释放了许可证
pool-1-thread-3拿到了许可证
pool-1-thread-1拿到了许可证
pool-1-thread-2拿到了许可证
慢服务执行完毕，pool-1-thread-1释放了许可证
pool-1-thread-1拿到了许可证
慢服务执行完毕，pool-1-thread-2释放了许可证
pool-1-thread-2拿到了许可证
慢服务执行完毕，pool-1-thread-3释放了许可证
pool-1-thread-3拿到了许可证
...
```

从执行结果看出来，好像和使用Semaphore的结果一样的。

其原因是，线程池最大就限制了3个线程，那么自然最多只有三个线程同时去访问。

那意味着，是不是固定数量的FixedThreadPool能够被Semaphore替代了呢？

答案是否定的。

因为在实际的业务场景中，Semaphore是搭配着某些限制条件来进行使用的。

就比如，每天秒杀系统，在秒杀的那个时刻我们只希望有少量的单子可以成功下单，但是在绝大部分的时候，我们就不应该限制，那么用线程池去控制灵活度就不高了。

此外，Semaphore作为一个类单独来使用，可以具备跨线程、跨线程池的特定，所以即便是在不同的线程、线程池中都发起请求，我们也能够限制访问的数量。

用FixedThreadPool去限制，那就做不到这么灵活控制，功能会大大的削弱。
