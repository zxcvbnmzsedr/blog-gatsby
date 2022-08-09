---
title: 创建线程池的参数
date: 2022-04-21 19:40
permalink: /topic/Java%E5%B9%B6%E5%8F%91%E5%B7%A5%E5%85%B7%E5%8C%85/%E5%B9%B6%E5%8F%91%E5%B7%A5%E5%85%B7/%E7%BA%BF%E7%A8%8B%E6%B1%A0/%E5%88%9B%E5%BB%BA%E7%BA%BF%E7%A8%8B%E6%B1%A0%E7%9A%84%E5%8F%82%E6%95%B0
topic: 
  - topic
tags: null
categories: 
  - topic
  - Java并发工具包
  - 并发工具
  - 线程池
  - 创建线程池的参数
---
　　在Java中创建线程都是通过一个ThreadPoolExecutor对象来进行创建的。

　　ThreadPoolExecutor类最多有5个构造函数，用于创建不同特性的线程池

## 参数列表

|参数名|含义|
| :-------------: | :------------------------: |
|corePoolSize|核心线程数|
|maximumPoolSize|最大线程数|
|keepAliveTime|空闲线程存活时长|
|unit|空闲线程存活时间单位|
|workQueue|用于存放任务的队列|
|threadFactory|线程工厂，用于来创建新线程|
|handler|处理被拒绝的任务|

## 创建时机

　　![线程池创建线程的时机](https://www.shiyitopo.tech/uPic/%E7%BA%BF%E7%A8%8B%E6%B1%A0%E5%88%9B%E5%BB%BA%E7%BA%BF%E7%A8%8B%E7%9A%84%E6%97%B6%E6%9C%BA.png)

　　在最大线程创建出来之后，回去判断线程的存活时间，如果存活时间大于所设定的值，则会将这些创建出来的回收

## 线程工厂ThreadFactory

　　hreadFactory 实际上是一个线程工厂，它的作用是生产线程以便执行任务。我们可以选择使用默认的线程工厂，创建的线程都会在同一个线程组，并拥有一样的优先级，且都不是守护线程，我们也可以选择自己定制线程工厂，以方便给线程自定义命名，不同的线程池内的线程通常会根据具体业务来定制不同的线程名。

　　默认的线程工厂:

```java
private static class DefaultThreadFactory implements ThreadFactory {
        private static final AtomicInteger poolNumber = new AtomicInteger(1);
        private final ThreadGroup group;
        private final AtomicInteger threadNumber = new AtomicInteger(1);
        private final String namePrefix;

        DefaultThreadFactory() {
            SecurityManager s = System.getSecurityManager();
            group = (s != null) ? s.getThreadGroup() :
                                  Thread.currentThread().getThreadGroup();
            namePrefix = "pool-" +
                          poolNumber.getAndIncrement() +
                         "-thread-";
        }

        public Thread newThread(Runnable r) {
            Thread t = new Thread(group, r,
                                  namePrefix + threadNumber.getAndIncrement(),
                                  0);
            if (t.isDaemon())
                t.setDaemon(false);
            if (t.getPriority() != Thread.NORM_PRIORITY)
                t.setPriority(Thread.NORM_PRIORITY);
            return t;
        }
    }
```

## 工作队列WorkQueue

　　用于存放任务的队列列表。

　　线程的不同的特性，就是通过这个存放任务的列表来实现的。

|线程池|实现队列|特性|
| :--------------------------------------------------: | :-----------------: | ----------------------------------------------------------------------------------|
|FixedThreadPool|LinkedBlockingQueue|没有额外线程，只存在核心线程，而且核心线程没有超时机制，而且任务队列没有长度的限制|
|SingleThreadExecutor|LinkedBlockingQueue|内部只有一个核心线程，它确保所有的任务都在同一个线程中按顺序执行。|
|CachedThreadPool|SynchronousQueue|只有非核心线程，并且其最大线程数为Integer.MAX_VALUE|
|ScheduledThreadPool<br>SingleThreadScheduledExecutor|DelayedWorkQueue|按照延迟的时间长短对任务进行排序，内部采用的是“堆”的数据结构|

　　看下面ThreadPool的结构，workQueue就是用来存放添加的任务，然后交由给不同的线程去执行。

　　![ThreadPool结构](https://www.shiyitopo.tech/uPic/ThreadPool%E7%BB%93%E6%9E%84.png)

## 拒绝策略Handler

　　用于处理核心线程满、队列满、最大线程满了之后，现在添加不进去之后的策略。

　　![img](https://www.shiyitopo.tech/uPic/CgotOV3g0WWAVWVlAAEsBI6lEEA162.png)

### DiscardPolicy

　　当新任务提交之后会被直接丢弃，也不会有任何的通知，相对而言存在一定的风险，因为在提交的时候并不知道线程会被丢弃，会存在数据丢失的风险

```java
       /**
         * Does nothing, which has the effect of discarding task r.
         *
         * @param r the runnable task requested to be executed
         * @param e the executor attempting to execute this task
         */
        public void rejectedExecution(Runnable r, ThreadPoolExecutor e) {
        }
```

### DiscardOldestPolicy

　　丢弃任务队列中的头结点，通常是存活时间最长的任务，这种策略与DiscardPolicy不同之处在于它丢弃的不是最新提交的，而是队列中存活时间最长的，这样就可以腾出空间给新提交的任务，但同理它也存在一定的数据丢失风险。

```java
        /**
         * Obtains and ignores the next task that the executor
         * would otherwise execute, if one is immediately available,
         * and then retries execution of task r, unless the executor
         * is shut down, in which case task r is instead discarded.
         *
         * @param r the runnable task requested to be executed
         * @param e the executor attempting to execute this task
         */
        public void rejectedExecution(Runnable r, ThreadPoolExecutor e) {
            if (!e.isShutdown()) {
                e.getQueue().poll();
                e.execute(r);
            }
        }
```

### CallerRunsPolicy

　　当触发拒绝策略时，只要线程池没有关闭，就由提交任务的当前线程处理。

```java
        /**
         * Executes task r in the caller's thread, unless the executor
         * has been shut down, in which case the task is discarded.
         *
         * @param r the runnable task requested to be executed
         * @param e the executor attempting to execute this task
         */
        public void rejectedExecution(Runnable r, ThreadPoolExecutor e) {
            if (!e.isShutdown()) {
                r.run();
            }
        }
```

### AbortPolicy

　　当任务提交到这里，会抛出RejectedExecutionException异常

```java
        /**
         * Always throws RejectedExecutionException.
         *
         * @param r the runnable task requested to be executed
         * @param e the executor attempting to execute this task
         * @throws RejectedExecutionException always
         */
        public void rejectedExecution(Runnable r, ThreadPoolExecutor e) {
            throw new RejectedExecutionException("Task " + r.toString() +
                                                 " rejected from " +
                                                 e.toString());
        }
```
