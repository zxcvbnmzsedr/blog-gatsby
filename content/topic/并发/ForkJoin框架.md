# Fork/Join框架

Fork/Join框架，是JDK7中加入的 一个线程类。Fork/Join是基于分治算法的并行实现。

它是一个可以让使用者简单方便的使用并行，来对数据进行处理，极大限度的利用多处理器来提高应用的性能。

大概流程如下:

将大任务拆分成一个个子任务，然后join在一起，最后输出结果。

![forkjoin流程](https://www.shiyitopo.tech/uPic/forkjoin%E6%B5%81%E7%A8%8B.png)


伪代码就是这样:

```java
Result solve(Problem problem) {
  if (problem is small) 
    directly solve problem
  else {
    split problem into independent parts
    fork new subtasks to solve each part

    join all subtasks
    compose result from subresults
  }
}
```



## 案例?

我们拿累加数字来举例。

```java
public static void main(String[] args) throws InterruptedException, ExecutionException {
        long start = 1;
        long end = 1000000000;
        sum(start, end);
 }
public static void sum(long start, long end) {
        int result = 0;
        long startTime = System.currentTimeMillis();
        for (long i = start; i <= end; i++) {
            result += i;
        }
        long endTime = System.currentTimeMillis();
        System.out.println("sum: " + result + " in " + (endTime - startTime) + " ms.");
}
```

我们可以将累加数字改写成下面的这种写法,使用forkJoin线程池进行运算。

```java
public static void main(String[] args) throws InterruptedException, ExecutionException {
        long startTime = System.currentTimeMillis();
        ForkJoinPool pool = new ForkJoinPool();
        ForkJoinTask<Integer> task = new SumTask(start, end);
        pool.submit(task);
        long result = task.get();
        long endTime = System.currentTimeMillis();
        System.out.println("Fork/join sum: " + result + " in " + (endTime - startTime) + " ms.");
    }
static final class SumTask extends RecursiveTask<Integer> {
        private static final long serialVersionUID = 1L;

        final long start; //开始计算的数
        final long end; //最后计算的数

        SumTask(long start, long end) {
            this.start = start;
            this.end = end;
        }

        @Override
        protected Integer compute() {
            //如果计算量小于1000，那么分配一个线程执行if中的代码块，并返回执行结果
            if (end - start < 10000) {
                int sum = 0;
                for (long i = start; i <= end; i++) {
                    sum += i;
                }
                return sum;
            }
            //如果计算量大于1000，那么拆分为两个任务
            SumTask task1 = new SumTask(start, (start + end) / 2);
            SumTask task2 = new SumTask((start + end) / 2 + 1, end);
            //执行任务
            task1.fork();
            task2.fork();
            //获取任务执行的结果
            return task1.join() + task2.join();
        }
    }
```

运行结果:

```java
sum: -243309312 in 624 ms.
Fork/join sum: -243309312 in 168 ms.
```


## 原理

我们来看看，forkJoin是如何去实现的。

Fork/Join框架主要包含三个模块:

+ 任务执行对象基类`ForkJoinTask`
  + 抽象类RecursiveTask: 有返回值任务
  + 抽象类RecursiveAction: 无返回值任务
  + 抽象类CountedCompleter: 无返回值任务，完成任务后可以触发回调
+ 执行Fork/Join的线程对象`ForkJoinWorkerThread`
+ 线程池`ForkJoinPool`

由于ForkJoinPool只接收ForkJoinTask任务，因此在使用时，我们只需要关注如何实现ForkJoinTask任务。

JDK基于ForkJoinTask提供了`RecursiveTask`、`RecursiveAction`、`CountedCompleter`三种类来满足业务需求，在使用时无需直接继承ForkJoinTask。

核心思想除了上文说的分治，还有一个就是`工作窃取`算法

### work-stealing 工作窃取

工作窃取说白了就是，比较闲的线程到比较忙的线程那边把任务给拿过来执行，分摊压力。

两个线程访问同一个队列的任务，会存在竞争的问题，为了减少竞争任务队列会被设计成双端队列，`被窃取任务的线程`永远从双端队列的`头部`拿任务执行，`窃取任务的线程`则永远从双端队列的`尾部`拿任务执行。

如下图所示:

queue2在执行完之后，会将queue0的task，给拉入到自己的线程下进行运行

![forkjoin-工作窃取](https://www.shiyitopo.tech/uPic/forkjoin-%E5%B7%A5%E4%BD%9C%E7%AA%83%E5%8F%96.png)

1. ForkJoinPool 的每个工作线程都维护着一个工作队列（WorkQueue），这是一个**双端队列（Deque）**，里面存放的对象是任务（**ForkJoinTask**）。

2. 每个工作线程在运行中产生新的任务（通常是因为调用了 fork()）时，会放入工作队列的队尾，并且工作线程在处理自己的工作队列时，使用的是 **LIFO** 方式，也就是说每次从队尾取出任务来执行。

3. 每个工作线程在处理自己的工作队列同时，会尝试窃取一个任务（或是来自于刚刚提交到 pool 的任务，或是来自于其他工作线程的工作队列），窃取的任务位于其他线程的工作队列的队首，也就是说工作线程在窃取其他工作线程的任务时，使用的是 FIFO 方式。

4. 在遇到 join() 时，如果需要 join 的任务尚未完成，则会先处理其他任务，并等待其完成。

5. 在既没有自己的任务，也没有可以窃取的任务时，进入休眠。



### 执行流程

![forkjoin工作流程](https://www.shiyitopo.tech/uPic/forkjoin%E5%B7%A5%E4%BD%9C%E6%B5%81%E7%A8%8B.png)

上图画的就是forkjoin框架大体的运行过程。

如果去看源码的话，肯定是一脸懵逼，里面涉及到大量的位运算。

需要从整体去把握这个框架。

### 步骤分解

1. 外部任务提交，调用ForkJoinPool的invoke、execute、submit
2. 子任务的提交，调用fork方法
3. 执行任务，ForkJoinWorkerThread.run -> ForkJoinTask.doExec
4. 获取任务执行结果，ForkJoinTask.join 和 ForkJoinTask.invoke

### 外部任务提交

这个步骤主要是为了创建工作线程，没有工作线程则会创建一个，并且把任务给放入这个工作线程中。

最终会走到externalPush的逻辑，执行流程很简单: 首先找到一个随机偶数槽位的 workQueue，然后把任务放入这个 workQueue 的任务数组中，并更新top位。如果队列的剩余任务数小于1，则尝试创建或激活一个工作线程来运行任务(防止在externalSubmit初始化时发生异常导致工作线程创建失败)。

最后对调用到createWorker，在这个流程中会创建需要执行的线程，并且会进入start状态，等到CPU分配到时间片的时候就会执行了

### 子任务提交

和外部任务提交类似，也是向这个工作线程中添加任务

子任务的提交相对比较简单，由任务的fork()方法完成。通过上面的流程图可以看到任务被分割(fork)之后调用了ForkJoinPool.WorkQueue.push()方法直接把任务放到队列中等待被执行。

```java
public final ForkJoinTask<V> fork() {
    Thread t;
    if ((t = Thread.currentThread()) instanceof ForkJoinWorkerThread)
        ((ForkJoinWorkerThread)t).workQueue.push(this);
    else
        ForkJoinPool.common.externalPush(this);
    return this;
}

    
```

说明: 如果当前线程是 Worker 线程，说明当前任务是fork分割的子任务，通过ForkJoinPool.workQueue.push()方法直接把任务放到自己的等待队列中；否则调用ForkJoinPool.externalPush()提交到一个随机的等待队列中(外部任务)。

### 执行任务

在ForkJoinPool .createWorker()方法中创建工作线程后，会启动工作线程，系统为工作线程分配到CPU执行时间片之后会执行 ForkJoinWorkerThread 的run()方法正式开始执行任务。

### 获取任务执行结果

这个比较复杂。

是因为加入的任务，不知道处于哪个队列的哪个位置，如果是top位置直接等待即可，如果不是则需要等待执行到这个任务才能获取结果

![img](https://www.shiyitopo.tech/uPic/java-thread-x-forkjoin-6.png)

