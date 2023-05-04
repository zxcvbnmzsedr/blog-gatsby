---
title: 共享锁独占锁
date: 2022-04-21 19:40
permalink: /topic/Java%E5%B9%B6%E5%8F%91%E5%B7%A5%E5%85%B7%E5%8C%85/%E5%B9%B6%E5%8F%91%E5%B7%A5%E5%85%B7/%E5%90%84%E7%A7%8D%E9%94%81/%E9%94%81%E7%9A%84%E7%A7%8D%E7%B1%BB%E5%92%8C%E7%89%B9%E7%82%B9/%E5%85%B1%E4%BA%AB%E9%94%81%E7%8B%AC%E5%8D%A0%E9%94%81
topic: 
  - topic
tags: null
categories: 
  - topic
  - Java并发工具包
  - 并发工具
  - 各种锁
  - 锁的种类和特点
  - 共享锁独占锁
---
# 共享锁独占锁

最能够诠释共享锁和独占锁的，就是`读写锁`

`读写锁`的特点是，多线程读取时共享同一把锁，多线程写入时必须拿到独占的锁才能够进行写入。

`读写锁`提升了在某些读多写少的情况下的性能，试想一下，如果我们采用ReentrantLock来进行读写文件的操作，虽然能够保证了线程的安全，但是读取文件这种不会修改数据的操作也会对文件进行加锁，会造成资源的浪费。

## 读写锁的规则

1. 如果一个线程已经占用了读锁，那另一个线程申请读锁的时候，可以申请成功。
2. 如果一个线程已经占用了读锁，那么另一个线程申请写锁的时候，申请写锁的线程会等待读锁的释放，因为读写不能同时进行。
3. 如果一个线程已经占用了写锁，那么另一个无论是申请读锁还是写锁都需要等待持有写锁的线程释放锁，同样也因为读写不能同时，并且两个线程不应该同时写。

   **总结**:

+ 读读共享
+ 其他互斥

  + 写写互斥
  + 读写互斥
  + 写读互斥

## 使用方式

```java
   public class ReadWriteLockDemo {
    private ReadWriteLock readWriteLock = new ReentrantReadWriteLock(false);
    private Lock readLock = readWriteLock.readLock();
    private Lock writeLock = readWriteLock.writeLock();
    public void read() {
        readLock.lock();
        try {
            System.out.println(Thread.currentThread().getName() + "得到读锁，正在读取");
            Thread.sleep(500);
        } catch (InterruptedException e) {
            e.printStackTrace();
        } finally {
            System.out.println(Thread.currentThread().getName() + "释放读锁");
            readLock.unlock();
        }
    }
    public void write() {
        writeLock.lock();
        try {
            System.out.println(Thread.currentThread().getName() + "得到写锁，正在写入");
            Thread.sleep(500);
        } catch (InterruptedException e) {
            e.printStackTrace();
        } finally {
            System.out.println(Thread.currentThread().getName() + "释放写锁");
            writeLock.unlock();
        }
    }
    public static void main(String[] args) {
        ReadWriteLockDemo demo = new ReadWriteLockDemo();
        new Thread(demo::read).start();
        new Thread(demo::read).start();
        new Thread(demo::write).start();
        new Thread(demo::write).start();
    }
}
```

**运行结果:**

![](https://www.shiyitopo.tech/uPic/2021-11-29-13-04-32-image.png)

## 加锁原理分析

![](https://www.shiyitopo.tech/uPic/762a042b.png)

**写锁的加锁代码**:

```java
protected final boolean tryAcquire(int acquires) {
  /**
   * 1. 如果读锁或者写锁的数量不为0，并且拥有锁的线程是其他的线程，
   * 2. 如果锁的数量饱和，则返回失败
   * 3. 如果这个线程有资格获得锁,重入或者队列允许，则更新状态并设置拥有者
   */
  Thread current = Thread.currentThread()q;
  // 获取当前锁的个数
  int c = getState();
  // 获取写锁的个数
  int w = exclusiveCount(c);
  if (c != 0) {// 如果线程已经持有了锁(c != 0)
    // (Note: if c != 0 and w == 0 then shared count != 0)
    // 如果写线程数（w）为0（换言之存在读锁） 或者持有锁的线程不是当前线程就返回失败
    if (w == 0 || current != getExclusiveOwnerThread())  
      return false;
    if (w + exclusiveCount(acquires) > MAX_COUNT)
      // 如果写入锁的数量大于最大数（65535，2的16次方-1）就抛出一个Error。
      throw new Error("Maximum lock count exceeded");
    // Reentrant acquire
    setState(c + acquires);
    return true;
  }
  // 如果当且写线程数为0，并且当前线程需要阻塞那么就返回失败；
  // 或者如果通过CAS增加写线程数失败也返回失败。
  if (writerShouldBlock() ||
      !compareAndSetState(c, c + acquires))
    return false;
  setExclusiveOwnerThread(current);
  return true;
}
```

**读锁的加锁代码:**

```java
	protected final int tryAcquireShared(int unused) {
    				/**
    				 * 1. 如果其他线程获取了写锁，则失败
    				 * 2. 如果当前线程获取了写锁或者写锁未被获取，则当前线程（线程安全，依靠CAS保证）增加读状态，成功获取读锁。
    				 * 3. 读锁的每次释放（线程安全的，可能有多个读线程同时释放读锁）均减少读状态，减少的值是“1<<16”。
    				 */
            Thread current = Thread.currentThread();
            int c = getState();
            if (exclusiveCount(c) != 0 &&
                getExclusiveOwnerThread() != current)
           	    // 如果其他线程已经获取了写锁，则当前线程获取读锁失败，进入等待状态
                return -1;
            int r = sharedCount(c);
            if (!readerShouldBlock() &&
                r < MAX_COUNT &&
                compareAndSetState(c, c + SHARED_UNIT)) {
                if (r == 0) {
                    firstReader = current;
                    firstReaderHoldCount = 1;
                } else if (firstReader == current) {
                    firstReaderHoldCount++;
                } else {
                    HoldCounter rh = cachedHoldCounter;
                    if (rh == null ||
                        rh.tid != LockSupport.getThreadId(current))
                        cachedHoldCounter = rh = readHolds.get();
                    else if (rh.count == 0)
                        readHolds.set(rh);
                    rh.count++;
                }
                return 1;
            }
            return fullTryAcquireShared(current);
        }
```

**从源码上看:**

对于写锁的加锁，需要确保没有别的线程持有写锁、或者持有读锁。

对于读锁的加锁，需要确保没有别的线程持有读锁即可。

下面来讲讲，在真实业务中的线程插队逻辑。

## 插队逻辑

假设线程 2 和线程 4 正在同时读取，线程 3 想要写入，但是由于线程 2 和线程 4 已经持有读锁了，所以线程 3 就进入等待队列进行等待。此时，线程 5 突然跑过来想要插队获取读锁：

![读锁插队](https://www.shiyitopo.tech/uPic/%E8%AF%BB%E9%94%81%E6%8F%92%E9%98%9F.png)

面对这种情况有两种应对策略：

### 第一种策略：允许插队

由于现在有线程在读，而线程 5 又不会特别增加它们读的负担，因为线程们可以共用这把锁，所以第一种策略就是让线程 5 直接加入到线程 2 和线程 4 一起去读取。

这种策略看上去增加了效率，但是有一个严重的问题，那就是如果想要读取的线程不停地增加，比如线程 6，那么线程 6 也可以插队，这就会导致读锁长时间内不会被释放，导致线程 3 长时间内拿不到写锁，也就是那个需要拿到写锁的线程会陷入“饥饿”状态，它将在长时间内得不到执行。

![读锁插队成功](https://www.shiyitopo.tech/uPic/%E8%AF%BB%E9%94%81%E6%8F%92%E9%98%9F%E6%88%90%E5%8A%9F.png)

### 第二种策略：不允许插队

这种策略认为由于线程 3 已经提前等待了，所以虽然线程 5 如果直接插队成功，可以提高效率，但是我们依然让线程 5 去排队等待：

![读锁不允许插队](https://www.shiyitopo.tech/uPic/%E8%AF%BB%E9%94%81%E4%B8%8D%E5%85%81%E8%AE%B8%E6%8F%92%E9%98%9F.png)按照这种策略线程 5 会被放入等待队列中，并且排在线程 3 的后面，让线程 3 优先于线程 5 执行，这样可以避免“饥饿”状态。

这对于程序的健壮性是很有好处的，直到线程 3 运行完毕，线程 5 才有机会运行，这样谁都不会等待太久的时间。

![读锁不允许插队-结果2](https://www.shiyitopo.tech/uPic/%E8%AF%BB%E9%94%81%E4%B8%8D%E5%85%81%E8%AE%B8%E6%8F%92%E9%98%9F-%E7%BB%93%E6%9E%9C2.png)

所以我们可以看出，即便是非公平锁，只要等待队列的头结点是尝试获取写锁的线程，那么读锁依然是不能插队的，目的是避免“饥饿”。

## 锁的升降级

锁降级指的是写锁降级成为读锁。

锁降级是指把持住当前拥有的写锁的同时，再获取到读锁，随后释放写锁的过程。

来看看官方文档是怎么写的:

```java
 class CachedData {
   Object data;
   boolean cacheValid;
   final ReentrantReadWriteLock rwl = new ReentrantReadWriteLock();
   void processCachedData() {
     rwl.readLock().lock();
     if (!cacheValid) {
       // Must release read lock before acquiring write lock
       rwl.readLock().unlock();
       rwl.writeLock().lock();
       try {
         // Recheck state because another thread might have
         // acquired write lock and changed state before we did.
         if (!cacheValid) {
           data = ...
           cacheValid = true;
         }
         // Downgrade by acquiring read lock before releasing write lock
         rwl.readLock().lock();
       } finally {
         rwl.writeLock().unlock(); // Unlock write, still hold read
       }
     }
     try {
       use(data);
     } finally {
       rwl.readLock().unlock();
     }
   }
 }
```

### 降级的过程

代码中申明了一个cacheValid的变量用于检查缓存是否有效。

获取读锁，如果cache不可用，则释放读锁去获取写锁。

再次检查cache，修改data，并且将cache设置成true，然后在**释放写锁前获取读锁**

此时，cache中数据可用，处理cache中数据，最后释放读锁。

### 为什么需要锁的降级

其目的是保证数据可见性:

如果当前的线程*C*在修改完cache中的数据后，还需要对数据进行一些处理，但是此时没有获取读锁而是直接释放了写锁，那么假设此时另一个线程*T*获取了写锁并修改了数据，那么*C*线程无法感知到数据已被修改,则数据出现错误。

如果遵循锁降级的步骤，线程*C*在释放写锁之前获取读锁，那么线程*T*在获取写锁时将被阻塞，直到线程*C*完成数据处理过程，释放读锁。

### 为什么不支持锁的升级？

如果我们运行下面这段代码，在不释放读锁的情况下直接尝试获取写锁，也就是锁的升级，会让线程直接阻塞，程序是无法运行的。

```java
public static void upgrade() {
    rwl.readLock().lock();
    System.out.println("获取到了读锁");
    rwl.writeLock().lock();
    System.out.println("成功升级");
}
```

我们知道读写锁的特点是如果线程都申请读锁，是可以多个线程同时持有的，可是如果是写锁，只能有一个线程持有，并且不可能存在读锁和写锁同时持有的情况。

正是因为不可能有读锁和写锁同时持有的情况，所以升级写锁的过程中，需要等到所有的读锁都释放，此时才能进行升级。

### 总结

对于 ReentrantReadWriteLock 而言。

- 插队策略
  - 公平策略下，只要队列里有线程已经在排队，就不允许插队。
  - 非公平策略下：
    - 如果允许读锁插队，那么由于读锁可以同时被多个线程持有，所以可能造成源源不断的后面的线程一直插队成功，导致读锁一直不能完全释放，从而导致写锁一直等待，为了防止“饥饿”，在等待队列的头结点是尝试获取写锁的线程的时候，不允许读锁插队。
    - 写锁可以随时插队，因为写锁并不容易插队成功，写锁只有在当前没有任何其他线程持有读锁和写锁的时候，才能插队成功，同时写锁一旦插队失败就会进入等待队列，所以很难造成“饥饿”的情况，允许写锁插队是为了提高效率。
- 升降级策略：只能从写锁降级为读锁，不能从读锁升级为写锁。
