---
title: 线程池线程复用原理
date: 2022-04-21 19:40
permalink: /topic/Java%E5%B9%B6%E5%8F%91%E5%B7%A5%E5%85%B7%E5%8C%85/%E5%B9%B6%E5%8F%91%E5%B7%A5%E5%85%B7/%E7%BA%BF%E7%A8%8B%E6%B1%A0/%E7%BA%BF%E7%A8%8B%E6%B1%A0%E7%BA%BF%E7%A8%8B%E5%A4%8D%E7%94%A8%E5%8E%9F%E7%90%86
topic: 
  - topic
tags: null
categories: 
  - topic
  - Java并发工具包
  - 并发工具
  - 线程池
  - 线程池线程复用原理
---
# 线程池线程复用原理

线程池最大的优势就在于可以复用线程，以减少创建和销毁时带来的消耗。线程池运行一堆固定数量的任务，需要的线程数远小于任务的数量，精髓就在于线程复用，让同一个线程去执行不同的任务。

![线程池创建线程的时机](https://www.shiyitopo.tech/uPic/%E7%BA%BF%E7%A8%8B%E6%B1%A0%E5%88%9B%E5%BB%BA%E7%BA%BF%E7%A8%8B%E7%9A%84%E6%97%B6%E6%9C%BA.png)

依旧是这张图，我们能从中可以看到，有三个关键的地方

1. 当前线程数小于核心线程数创建线程
2. 核心线程数已满，就往任务队列里面塞
3. 任务队列和核心线程都满了，就创建非核心线程用于分摊压力
4. 当前三个都无法塞入的时候，拒绝执行

具体执行的代码在 ThreadPoolExecutor的execute中。

## 实现方式

来看看是怎么实现的。(最核心的代码)

```java
public void execute(Runnable command) {
        if (command == null)
            throw new NullPointerException();
  			// ctl属性的高3位，提供了线程池的运行状态，包含线程池主要生命周期。
  			// 剩余位记录线程池线程个数
        int c = ctl.get();
  		  // 如果工作线程的数量小于核心线程数 （步骤1）
        if (workerCountOf(c) < corePoolSize) {
          	// 如果核心线程没有满，创建核心线程执行任务，如果返回false说明在创建核心线程的时候线程数已经满了
            if (addWorker(command, true))
                return;
            c = ctl.get();
        }
  			// 当前线程池的状态是正在运行，就把任务放入到队列中
        if (isRunning(c) && workQueue.offer(command)) {
            int recheck = ctl.get();
          	// 重新检查一番，如果这个时候线程池被关闭了，则从队列中移除这个任务，并执行拒绝策略
            if (! isRunning(recheck) && remove(command))
                reject(command);
            else if (workerCountOf(recheck) == 0)
              	// 如果检查下来运行的线程数量为0，就调用addWorker创建新的线程
                addWorker(null, false);
        }
  			// 线程池关闭，或者队列已经满了，就去判断最大线程数是否满了，步骤3
        else if (!addWorker(command, false))
          	// 最大线程数满了，执行拒绝策略
            reject(command);
    }
```

线程复用的秘密就是在这个addWorker里面。

```java
private boolean addWorker(Runnable firstTask, boolean core) {
	/**
	 * 跳过上面一大段检查队列的直接看启动
	 */
   			boolean workerStarted = false;
        boolean workerAdded = false;
        Worker w = null;
        try {
            w = new Worker(firstTask);
            final Thread t = w.thread;
          	..... 
            if (t != null) {
                // 加锁
                if (workerAdded) {
                  	// 启动，
                    t.start();
                    workerStarted = true;
                }
            }
        } finally {
            if (! workerStarted)
                addWorkerFailed(w);
        }
}
```

通过内置的Worker对象，把自己的firstTask作为任务封装进去，重写了run方法，所以在调用start方法的时候会调用的worker的run方法

```java
     public void run() {
            runWorker(this);
        }
final void runWorker(Worker w) {
        Thread wt = Thread.currentThread();
        Runnable task = w.firstTask;
        w.firstTask = null;
        w.unlock(); // allow interrupts
        boolean completedAbruptly = true;
        try {
          	// 加个死循环，不断的从队列中获取任务，并执行----这里的task才是我们要执行的业务代码
            while (task != null || (task = getTask()) != null) {
                w.lock();
                if ((runStateAtLeast(ctl.get(), STOP) ||
                     (Thread.interrupted() &&
                      runStateAtLeast(ctl.get(), STOP))) &&
                    !wt.isInterrupted())
                    wt.interrupt();
                try {
                    beforeExecute(wt, task);
                    try {
                        task.run();
                        afterExecute(task, null);
                    } catch (Throwable ex) {
                        afterExecute(task, ex);
                        throw ex;
                    }
                } finally {
                    task = null;
                    w.completedTasks++;
                    w.unlock();
                }
            }
            completedAbruptly = false;
        } finally {
            processWorkerExit(w, completedAbruptly);
        }
    }
```

## 总结

复用的本质，就是将我们的Runable给封装起来，封装成一个个task，塞入到队列中。

然后使用worker线程，不断的轮训这个任务队列，直接执行，采用了代理模式，增强了原本runable的执行逻辑。
