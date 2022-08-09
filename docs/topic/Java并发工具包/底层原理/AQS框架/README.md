---
title: AQS框架
date: 2022-04-21 19:40
permalink: /topic/Java%E5%B9%B6%E5%8F%91%E5%B7%A5%E5%85%B7%E5%8C%85/%E5%BA%95%E5%B1%82%E5%8E%9F%E7%90%86/AQS%E6%A1%86%E6%9E%B6
topic: 
  - topic
tags: null
categories: 
  - topic
  - Java并发工具包
  - 底层原理
  - AQS框架
---
AQS框架，全名叫做**A**bstract**Q**ueued**S**ynchronizer。是目前JUC中，各个Lock锁的核心实现。

　　AQS提供了一系列的方式方法，用于我们去实现自己的"锁"结构。

　　接下来，我们会从**ReentrantLock**开始，剖析AQS框架的整体结构。

## 模拟场景

　　有三个用户A、B、C，排队去银行取款，银行只有一个窗口。

　　用户A办理业务的时间比较长，需要办理20分钟，在A办理窗口的时候，B、C只能在等待。

　　代码如下：

```java
public static final ReentrantLock lock = new ReentrantLock();
    public static void main(String[] args) throws InterruptedException, NoSuchFieldException {
       Thread A = new Thread(() -> {
           lock.lock();
           try {
               System.out.println("用户A开始办理业务");
               try { TimeUnit.MINUTES.sleep(20); } catch (InterruptedException e) {e.printStackTrace();}
               System.out.println("用户A办理业务完成");   
           }finally {
               lock.unlock();
           }
       },"用户A");
       Thread B = new Thread(() -> {
           lock.lock();
           try {
               System.out.println("用户B开始办理业务");
           }finally {
               lock.unlock();
           }
       },"用户B");
       Thread C = new Thread(() -> {
           lock.lock();
           try {
               System.out.println("用户C开始办理业务");
           }finally {
               lock.unlock();
           }
       },"用户C");
       A.start();
       // 让线程A先启动
       Thread.sleep(100);
       B.start();
       C.start();
    }
```

　　我们使用lock来模拟银行单个柜台的操作，在办理业务之前必须先拿到柜台的锁。

　　如下图所示，B、C正在座位上排队，A正在办理业务

　　![image-20211214133706380](https://www.shiyitopo.tech/uPic/image-20211214133706380.png)

## 源码分析

　　我们调用lock的方法，才能够获取到办理业务的锁。

```java
 public void lock() {
        sync.lock();
}
```

　　lock方法的实现，非常简单，就是调用sync对象进行加锁。

　　sync对象是继承自AbstractQueuedSynchronizer而实现的锁。

　　内部定义了一个lock的抽象方法（我们接下来都以默认的**非公平锁**来进行说明）。

　　lock的抽象方法交由给NonfairSync的lock实现。

```java
abstract static class Sync extends AbstractQueuedSynchronizer {
	abstract void lock();
}
static final class NonfairSync extends Sync {
  private static final long serialVersionUID = 7316153563782823691L;

  final void lock() {
    if (compareAndSetState(0, 1))
      setExclusiveOwnerThread(Thread.currentThread());
    else
      acquire(1);
  }

  protected final boolean tryAcquire(int acquires) {
    return nonfairTryAcquire(acquires);
  }
}

```

　　额外说明:在AQS框架中，有个state字段，这是给实现类用的，谁使用谁实现。

　　在ReentrantLock的Sync中，state字段: 0代表着被占用;1代表着锁已经被占用。

　　接下来，会结合具体场景，来剖析整个流程。

## 获取锁流程

### 用户A加锁

　　在第一次调用lock方法的时候，会通过CAS的方式去判断state的值。state在第一次调用时，肯定是0，所以这个时候可以通过setExclusiveOwnerThread(Thread.currentThread())方法，设置当前获取这个锁的线程为**用户A**

```java
final void lock() {
    if (compareAndSetState(0, 1))
      setExclusiveOwnerThread(Thread.currentThread());
    else
      acquire(1);
  }
```

　　如下图所示:

　　![用户A进来](https://www.shiyitopo.tech/uPic/%E7%94%A8%E6%88%B7A%E8%BF%9B%E6%9D%A5.png)

### 用户B加锁

　　用户B加锁的这种情况，就会走到整个AQS的核心。

　　在用户B加锁的时候，会发现"柜台"已经被A占用了，只能到一旁的小板凳去等待，会调用acquire(1)方法，获取一张"小板凳"；

```java
public final void acquire(int arg) {
    if (!tryAcquire(arg) && acquireQueued(addWaiter(Node.EXCLUSIVE), arg))
        selfInterrupt();
}
```

　　可以看到在这个if方法中，会尝试获取锁，并且加入到队列中。

　　tryAcquire方法:

　　**AQS**采用模板方法的模式，将tryAcquire交由给子类进行实现,最后调用到nonfairTryAcquire。

```java
public abstract class AbstractQueuedSynchronizer{
  protected boolean tryAcquire(int arg) {
          throw new UnsupportedOperationException();
  }
}
abstract static class Sync extends AbstractQueuedSynchronizer {
  final boolean nonfairTryAcquire(int acquires) {
    // 获取当前线程。
    final Thread current = Thread.currentThread();
    // 获取当前的执行状态，因为用户A还没有释放锁，所以这个state是1
    int c = getState();
    // 跳过第一个if逻辑
    if (c == 0) {
      if (compareAndSetState(0, acquires)) {
        setExclusiveOwnerThread(current);
        return true;
      }
    }
    // 这里进来的线程是用户B，当前持有锁的线程是用户A，所以这个if也进行跳过，直接return false
    else if (current == getExclusiveOwnerThread()) {
      int nextc = c + acquires;
      if (nextc < 0) // overflow
        throw new Error("Maximum lock count exceeded");
      setState(nextc);
      return true;
    }
    return false;
  }
}

```

　　在tryAcquire方法返回false之后，将会进入第二个逻辑: **acquireQueued(addWaiter(Node.EXCLUSIVE), arg)**

　　首先进入的是addWaiter，用户B的进入队列的逻辑:

```java
addWaiter(Node.EXCLUSIVE);
private Node addWaiter(Node mode) {
  // 创建出node对象，node中存储了当前线程 和 Node的类型（目前是独占模式）
  Node node = new Node(Thread.currentThread(), mode);
  // 尾巴结点，目前没有东西
  Node pred = tail;
  // 所以跳过第一个if判断
  if (pred != null) {
    node.prev = pred;
    if (compareAndSetTail(pred, node)) {
      pred.next = node;
      return node;
    }
  }
  // 将节点插入队列
  enq(node);
  return node;
}
// 将节点插入到队列中
private Node enq(final Node node) {
  for (;;) {
    // 第一次循环——尾结点，目前是null
    // 第二次循环——尾结点，目前是new Node
    Node t = tail;
    // 第一次循环——进入初始化
    if (t == null) { // Must initialize
      // 第一次循环——设置头尾结点为一个新的节点，注意：此时头结点不是 用户B，将进入下一个循环
      if (compareAndSetHead(new Node()))
        tail = head;
    } else {
      // 用户B真正的入队逻辑
      // 第二次循环——用户B的前驱节点是
      node.prev = t;
      // 第二次循环——将用户B设置成尾结点
      if (compareAndSetTail(t, node)) {
        // 第二次循环——头结点的后继节点是 用户B
        t.next = node;
        return t;
      }
    }
  }
}
最后进入队列的用户B会呈现出这样的状态
  new Node() ----next---> 用户B
  new Node() <---prev---— 用户B
```

　　![image-20211214151453981](https://www.shiyitopo.tech/uPic/image-20211214151453981.png)

　　再来看: acquireQueued方法,这个方法实现了 用户B 的阻塞

```java
// node现在是addWaiter返回的 用户B
final boolean acquireQueued(final Node node, int arg) {
    boolean failed = true;
    try {
        boolean interrupted = false;
        for (;;) {
            // 获取 用户B 的 前驱节点，目前是个空节点
            final Node p = node.predecessor();
						// p == head 是成立的, 但是 由于 用户A依然占有线程，tryAcquire 返回的是false
            // 所以跳过这if判断
            if (p == head && tryAcquire(arg)) {
                setHead(node);
                p.next = null; // help GC
                failed = false;
                return interrupted;
            }
            // shouldParkAfterFailedAcquire是只，在抢占失败之后阻塞线程，会将头结点的waitStatus从0设置成-1，并返回true
            // parkAndCheckInterrupt将会真正的阻塞线程在这，会调用LockSupport.park(this)进入阻塞态。
            if (shouldParkAfterFailedAcquire(p, node) &&
                parkAndCheckInterrupt())
                interrupted = true;
        }
    } finally {
        if (failed)
            cancelAcquire(node);
    }
}
```

　　如下图所示，头结点的waitStatus变成了-1

　　![image-20211214162714865](https://www.shiyitopo.tech/uPic/image-20211214162714865.png)

### 用户C加锁

　　其逻辑和用户B相类似，直接看排队的代码

```java
private Node addWaiter(Node mode) {
  // 创建出node对象，node中存储了当前线程 和 Node的类型（目前是独占模式）
  Node node = new Node(Thread.currentThread(), mode);
  // 尾结点，因为B已经进来了，这个节点是用户B
  Node pred = tail;
  // 因为pred不为空
  if (pred != null) {
    // 用户C 的前驱节点设置成 用户B
    // 尾结点指向 用户C
    // 用户B的 后驱设置成 用户C
    node.prev = pred;
    if (compareAndSetTail(pred, node)) {
      pred.next = node;
      return node;
    }
  }
  // 不会走到这
  enq(node);
  return node;
}
```

　　![image-20211214163207041](https://www.shiyitopo.tech/uPic/image-20211214163207041.png)

　　在 B、C入队之后，整个获取锁的流程就结束了，接下来就等待A执行完业务流程释放锁即可。

## 释放锁流程

　　同样的，在解锁时也是调用AQS的release方法

```java
public void unlock() {
	sync.release(1);
}
AQS:
...
public final boolean release(int arg) {
  if (tryRelease(arg)) {
    Node h = head;
    if (h != null && h.waitStatus != 0)
      unparkSuccessor(h);
    return true;
  }
  return false;
}
...
  
```

　　然后通过tryRelease()模板方法，调用回Sync中的tryRelease

```java
// 尝试释放锁
protected final boolean tryRelease(int releases) {
 		// 当前状态 - 1 = 0
    int c = getState() - releases;
  	// 如果当前线程不是持有锁的线程，不能释放锁
    if (Thread.currentThread() != getExclusiveOwnerThread())
        throw new IllegalMonitorStateException();
    boolean free = false;
  	// 如果状态为0 说明可以释放锁
    if (c == 0) {
        free = true;
      	// 将设置线程持有锁的线程为null
        setExclusiveOwnerThread(null);
    }
    // 将状态设置为0
    setState(c);
    return free;
}
```

　　在这一步执行完之后，状态是这样的:

　　![image-20211214163224576](https://www.shiyitopo.tech/uPic/image-20211214163224576.png)

　　在tryRelease执行成功之后，会执行下面这段代码:

```
 Node h = head;
if (h != null && h.waitStatus != 0)
   unparkSuccessor(h);
 return true;
```

　　获取头结点，如果头结点不为空且waitStatus为-1时，就调用unparkSuccessor(h)

```java
private void unparkSuccessor(Node node) {
       // 获取waitStatus，我们知道，这个时候waitStatus为头结点的-1
        int ws = node.waitStatus;
  			// 将node的状态从-1设置成0
        if (ws < 0)
            compareAndSetWaitStatus(node, ws, 0);
  			// 获取头结点的后驱节点，即 用户B
        Node s = node.next;
  			// 后面的节点状态是取消的状态，就从最后向前寻找可执行的节点
        if (s == null || s.waitStatus > 0) {
            s = null;
            for (Node t = tail; t != null && t != node; t = t.prev)
                if (t.waitStatus <= 0)
                    s = t;
        }
        if (s != null)
          	// 唤醒线程
            LockSupport.unpark(s.thread);
    }
```

　　在unparkSuccessor执行成功之后，会唤醒 用户B的线程, 现在线程被阻塞在 parkAndCheckInterrupt 这一行。

　　因为这个是自旋的方法，所以唤醒之后，会再次进入判断

```java
final boolean acquireQueued(final Node node, int arg) {
    boolean failed = true;
    try {
        boolean interrupted = false;
        for (;;) {
            // 唤醒之后，会进入到这里
          	// 用户B 的 前驱节点依然是 哨兵节点
            final Node p = node.predecessor();
						// p == head 是成立的
            // 由于 用户A 已经释放锁，tryAcquire 也成立
            if (p == head && tryAcquire(arg)) {
                // 设置头节点为 用户B
                setHead(node);
              	// 将 哨兵 节点的 next 设置为空，也就是
                p.next = null; // help GC
                failed = false;
                return interrupted;
            }
            if (shouldParkAfterFailedAcquire(p, node) && parkAndCheckInterrupt())
                interrupted = true;
        }
    } finally {
        if (failed)
            cancelAcquire(node);
    }
}
// 设置头节点为 用户B , 然后将线程清空，前置节点清空
 private void setHead(Node node) {
        head = node;
        node.thread = null;
        node.prev = null;
    }
```

　　![image-20211214165737590](https://www.shiyitopo.tech/uPic/image-20211214165737590.png)

　　这个时候，我们的整个AQS的状态已经和最初B进来的时候一致。也就意味着，原本的用户C 占用了 用户B 的位置，排队向前占了一格。

　　然后，不断循环处理。就成就了加锁和解锁的逻辑。

　　至此，整个AQS就基本算是结束了。

## 总结

　　这个时候，我们再倒过来看AQS中抽象的概念。

　　![img](https://www.shiyitopo.tech/uPic/7132e4cef44c26f62835b197b239147b18062.png)

+ `CLH`队列，虚拟双向队列，Craig,Landin,and Hagersten。仅存在结点之间的关联关系。

  AQS是将每条请求共享资源的线程封装成一个CLH锁队列的一个结点(Node)来实现锁的分配。

  其中Sync queue，即同步队列，是双向链表，包括head结点和tail结点，head结点主要用作后续的调度。‘
+ `结点状态`

  // CANCELLED，值为1，表示当前的线程被取消

  // SIGNAL，值为-1，表示当前节点的后继节点包含的线程需要运行，也就是unpark

  // CONDITION，值为-2，表示当前节点在等待condition，也就是在condition队列中

  // PROPAGATE，值为-3，表示当前场景下后续的acquireShared能够得以执行

  // 值为0，表示当前节点在sync队列中，等待着获取锁

　　AQS就是靠着这个数据结构来对线程来进行处理的。

　　AQS还有其他各种各样的api，这里就不展开赘述了，可以看去看https://tech.meituan.com/2019/12/05/aqs-theory-and-apply.html

　　![img](https://www.shiyitopo.tech/uPic/82077ccf14127a87b77cefd1ccf562d3253591.png)
