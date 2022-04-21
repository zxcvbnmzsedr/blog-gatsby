# wait/notify/notifyAll

## 为什么wait必须在synchronized保护的代码中使用

在使用wait方法时，必须在synchronized代码块中才能够正确的执行，否则会抛出`IllegalMonitorStateException: current thread is not owner`异常.

`wait` 方法的源码注释如下：

```java
# “wait method should always be used in a loop:
 synchronized (obj) {
     while (condition does not hold)
         obj.wait();
     ... // Perform action appropriate to condition
}

# This method should only be called by a thread that is the owner of this object's monitor.”
```

翻译下，即： `wait` 方法应在 `synchronized` 保护的 `while` 代码块中使用，并始终判断执行条件是否满足，如果满足就往下继续执行，如果不满足就执行 `wait` 方法。在执行 `wait` 方法之前，必须先持有对象的 `monitor` 锁，即 `synchronized` 锁。

**为什么这样设计？这样设计又有什么好处？**

反向思考，如果不要求 `wait` 方法放在 `synchronized` 保护的同步代码中使用，而是可以随意调用，那么就有可能写出这样的代码，如下：

```java
class BlockingQueue {
    Queue<String> buffer = new LinkedList<String>();
    public void offer(String data) {
        buffer.add(data);
        // Since someone may be waiting in take
        notify();  
    }
    
    public String take() throws InterruptedException {
        while (buffer.isEmpty()) {

            wait();
        }
        return buffer.remove();
    }
}
```

在代码中有两个方法：

1. `offer` 方法负责往 `buffer` 中添加数据，添加完之后执行 `notify` 方法来唤醒之前等待的线程
2. `take` 方法负责检查整个 `buffer` 是否为空，如果为空就进入等待，如果不为空就取出一个数据。

但是这段代码并没有受 `synchronized` 保护，于是便有可能发生以下场景：

> 1. 首先，消费者线程调用 `take` 方法并判断 `buffer.isEmpty` 方法是否返回 `true`，若为 `true` 代表 `buffer` 是空的，则线程希望进入等待，但是在线程调用 `wait` 方法之前，就被调度器暂停了，所以此时还没来得及执行 `wait` 方法。
> 2. 此时生产者开始运行，执行了整个 `offer` 方法，它往 `buffer` 中添加了数据，并执行了 `notify` 方法，但 `notify` 并没有任何效果，因为消费者线程的 `wait` 方法没来得及执行，所以没有线程在等待被唤醒。
> 3. 此时，刚才被调度器暂停的消费者线程回来继续执行 `wait` 方法并进入了等待。

把代码改写成源码注释所要求的被 `synchronized` 保护的同步代码块的形式，代码如下:

```java
public void offer(String data) {
   synchronized (this) {
      buffer.add(data);
      notify();
  }
}

public String take() throws InterruptedException {
   synchronized (this) {
    while (buffer.isEmpty()) {
         wait();
       }
     return buffer.remove();
  }
}
```

这样就可以确保 `notify` 方法永远不会在 `buffer.isEmpty` 和 `wait` 方法之间被调用，提升了程序的安全性。

另外，`wait` 方法会释放 `monitor` 锁，这也要求必须首先进入到 `synchronized` 内持有这把锁。

这里还存在一个“虚假唤醒”（`spurious wakeup`）的问题，线程可能在既没有被 `notify/notifyAll`，也没有被中断或者超时的情况下被唤醒，这种唤醒是不希望看到的。虽然在实际生产中，虚假唤醒发生的概率很小，但是程序依然需要保证在发生虚假唤醒的时候的正确性，所以就需要采用 `while` 循环的结构。

```java
while (condition does not hold)
    obj.wait();
```

这样即便被虚假唤醒了，也会再次检查 `while` 里面的条件，如果不满足条件，就会继续 `wait`，也就消除了虚假唤醒的风险。



## 为什么 wait/notify/notifyAll 被定义在 Object 类中，而 sleep 定义在 Thread 类中？

1. 因为Java中每个对象都有一把叫做monitor的锁，由于每个对象都能够上锁，所以就要求在对象头中保存锁的信息，这个锁是对象级别的而不是线程级别的。wait/notify/notifyAll都属于锁级别的操作，他们的锁属于对象，所以把他们定义在Object类中最为合适，因为Object类是所有对象的父类。
2. 假设，我们把wait/notify/notifyAll给定义在Thread中，这个时候需要一个线程需要持有多个对象的锁，以便于满足业务需求，也就是把wait定义在Thread中的时候，我们无法灵活的控制一个线程持有多把锁的逻辑，一个wait就把整个线程锁住了。既然是让线程去等待某个对象的锁，就 应该是操作对象来实现，而不是操作线程



## wait/notify 和 sleep 方法的异同？

相同点：

1. 都能够让线程进入阻塞状态。
2. 都能够响应interrupt异常，在等待的过程中能够响应中断信号，并报出InterruptedException异常

不同点:

1. wait/notify是Object的方法。sleep是Thread的方法
2. 在Synchronized包裹的代码中，调用sleep不会释放monitor锁，而调用wait会释放monitor锁
3. 使用sleep需要设置时间，时间到了之后会进入runable状态继续执行，而wait调用之后，如果没有notify去唤醒则一直会阻塞下去
4. wait必须在synchronized包裹的代码中使用，而sleep则不需要