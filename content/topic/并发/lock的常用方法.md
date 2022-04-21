 # lock的常用方法

**方法概览:** 

```java
public interface Lock {

    void lock();

    void lockInterruptibly() throws InterruptedException;

    boolean tryLock();

    boolean tryLock(long time, TimeUnit unit) throws InterruptedException;

    void unlock();

    Condition newCondition();

}
```

## lock()

用于加锁，然后在try代码块中进行相关业务逻辑的处理，然后在finally中释放锁。如果不进行try cache中释放，一旦发生异常，则无法正常释放锁。

lock() 在执行的过程中是不能被中断，一旦进入死锁那便会永久等待。

```java
Lock lock = new ReentrantLock();
lock.lock();
try {
  // 进入锁的保护，处理代码
} finally{
  // 解锁
  lock.unlock();
}
```

## tryLock()

为了避免lock()会永久等待的问题，tryLock()会尝试获取锁，如果锁没有被其他线程占用则直接获取到锁，否则立刻返回false。

通常情况下使用 if 语句判断 tryLock() 的返回结果，根据是否获取到锁来执行不同的业务逻辑

```java
Lock lock = new ReentrantLock();
if(lock.tryLock()) {
     try{
         //处理任务
     }finally{
         lock.unlock();   //释放锁
     } 
}else {
    //如果不能获取锁，则做其他事情
}
```

## tryLock(long time, TimeUnit unit)

tryLock() 的重载方法是 tryLock(long time, TimeUnit unit)，这个方法和 tryLock() 很类似，区别在于 tryLock(long time, TimeUnit unit) 方法会有一个超时时间，在拿不到锁时会等待一定的时间。

如果在时间期限结束后，还获取不到锁，就会返回 false；如果一开始就获取锁或者等待期间内获取到锁，则返回 true。

这个方法解决了 lock() 方法容易发生死锁的问题，使用 tryLock(long time, TimeUnit unit) 时，在等待了一段指定的超时时间后，线程会主动放弃这把锁的获取，避免永久等待；

在等待的期间，也可以随时中断线程，这就避免了死锁的发生。

## lockInterruptibly()

和lock类似，区别的是lockInterruptibly()能够响应线程中断。

```java
Lock lock = new ReentrantLock();
try {
  locklockInterruptibly();
  try {
          System.out.println("操作资源");
  } finally {
      lock.unlock();
  }
} catch (InterruptedException e) {
    e.printStackTrace();
}
```

## unlock()

对于 ReentrantLock 而言，执行 unlock() 的时候，内部会把锁的“被持有计数器”减 1，直到减到 0 就代表当前这把锁已经完全释放了。

如果减 1 后计数器不为 0，说明这把锁之前被“重入”了，那么锁并没有真正释放，仅仅是减少了持有的次数。

## newCondition()

会生成一个，和锁对象绑定的Condition实例，用于处理线程的等待和通知。

```java
public interface Condition {
     //使当前线程加入 await() 等待队列中，并释放当锁，当其他线程调用signal()会重新请求锁。与Object.wait()类似。
    void await() throws InterruptedException;

    //调用该方法的前提是，当前线程已经成功获得与该条件对象绑定的重入锁，否则调用该方法时会抛出IllegalMonitorStateException。
    //调用该方法后，结束等待的唯一方法是其它线程调用该条件对象的signal()或signalALL()方法。等待过程中如果当前线程被中断，该方法仍然会继续等待，同时保留该线程的中断状态。 
    void awaitUninterruptibly();

    // 调用该方法的前提是，当前线程已经成功获得与该条件对象绑定的重入锁，否则调用该方法时会抛出IllegalMonitorStateException。
    //nanosTimeout指定该方法等待信号的的最大时间（单位为纳秒）。若指定时间内收到signal()或signalALL()则返回nanosTimeout减去已经等待的时间；
    //若指定时间内有其它线程中断该线程，则抛出InterruptedException并清除当前线程的打断状态；若指定时间内未收到通知，则返回0或负数。 
    long awaitNanos(long nanosTimeout) throws InterruptedException;

    //与await()基本一致，唯一不同点在于，指定时间之内没有收到signal()或signalALL()信号或者线程中断时该方法会返回false;其它情况返回true。
    boolean await(long time, TimeUnit unit) throws InterruptedException;

   //适用条件与行为与awaitNanos(long nanosTimeout)完全一样，唯一不同点在于它不是等待指定时间，而是等待由参数指定的某一时刻。
    boolean awaitUntil(Date deadline) throws InterruptedException;

    //唤醒一个在 await()等待队列中的线程。与Object.notify()相似
    void signal();

   //唤醒 await()等待队列中所有的线程。与object.notifyAll()相似
    void signalAll();
}
```
