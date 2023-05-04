---
title: 常见的阻塞队列
date: 2022-04-21 19:40
permalink: /topic/Java%E5%B9%B6%E5%8F%91%E5%B7%A5%E5%85%B7%E5%8C%85/%E5%B9%B6%E5%8F%91%E5%B7%A5%E5%85%B7/%E9%98%BB%E5%A1%9E%E9%98%9F%E5%88%97/%E5%B8%B8%E8%A7%81%E7%9A%84%E9%98%BB%E5%A1%9E%E9%98%9F%E5%88%97
topic: 
  - topic
tags: null
categories: 
  - topic
  - Java并发工具包
  - 并发工具
  - 阻塞队列
  - 常见的阻塞队列
---
# 常见的阻塞队列

## ArrayBlockingQueue

ArrayBlockingQueue 是最典型的**有界队列**，其内部是用数组存储元素的，利用 ReentrantLock 实现线程安全。

我们在创建它的时候就需要指定它的容量，之后也不可以再扩容了，在构造函数中我们同样可以指定是否是公平的，代码如下：

```java
第一个参数是容量，第二个参数是是否公平。
ArrayBlockingQueue(int capacity, boolean fair)
```

正如 ReentrantLock 一样:

> 如果 ArrayBlockingQueue 被设置为非公平的，那么就存在插队的可能；
>
> 如果设置为公平的，那么等待了最长时间的线程会被优先处理，其他线程不允许插队，不过这样的公平策略同时会带来一定的性能损耗，因为非公平的吞吐量通常会高于公平的情况。

## LinkedBlockingQueue

正如名字所示，这是一个内部用链表实现的 BlockingQueue。如果我们不指定它的初始容量，那么它容量默认就为整型的最大值 Integer.MAX_VALUE，由于这个数非常大，我们通常不可能放入这么多的数据，所以 LinkedBlockingQueue 也被称作无界队列，代表它几乎没有界限。

## SynchronousQueue

![img](https://www.shiyitopo.tech/uPic/Cgq2xl4lhhSAZIuZAABMMZW2RVk163.png)

如图所示，SynchronousQueue 最大的不同之处在于，它的容量为 0，所以没有一个地方来暂存元素，导致每次取数据都要先阻塞，直到有数据被放入；同理，每次放数据的时候也会阻塞，直到有消费者来取。

需要注意的是，SynchronousQueue 的容量不是 1 而是 0，因为 SynchronousQueue 不需要去持有元素，它所做的就是直接传递（direct handoff）。由于每当需要传递的时候，SynchronousQueue 会把元素直接从生产者传给消费者，在此期间并不需要做存储，所以如果运用得当，它的效率是很高的。

另外，由于它的容量为 0，所以相比于一般的阻塞队列，SynchronousQueue 的很多方法的实现是很有意思的，我们来举几个例子：

SynchronousQueue 的 peek 方法永远返回 null，代码如下：

```java
public E peek() {
    return null;
}
```

因为 peek 方法的含义是取出头结点，但是 SynchronousQueue 的容量是 0，所以连头结点都没有，peek 方法也就没有意义，所以始终返回 null。同理，element 始终会抛出 NoSuchElementException 异常。

而 SynchronousQueue 的 size 方法始终返回 0，因为它内部并没有容量，代码如下：

```java
public int size() {
    return 0;
}
```

直接 return 0，同理，isEmpty 方法始终返回 true：

```java
public boolean isEmpty() {
    return true;
}
```

因为它始终都是空的。

## PriorityBlockingQueue

Priority: 优先级的意思

前面我们所说的 ArrayBlockingQueue 和 LinkedBlockingQueue 都是采用先进先出的顺序进行排序，可是如果有的时候我们需要自定义排序怎么办呢？这时就需要使用 PriorityBlockingQueue。

PriorityBlockingQueue 是一个支持优先级的无界阻塞队列，可以通过自定义类实现 compareTo() 方法来指定元素排序规则，或者初始化时通过构造器参数 Comparator 来指定排序规则。同时，插入队列的对象必须是可比较大小的，也就是 Comparable 的，否则会抛出 ClassCastException 异常。

它的 take 方法在队列为空的时候会阻塞，但是正因为它是无界队列，而且会自动扩容，所以它的队列永远不会满，所以它的 put 方法永远不会阻塞，添加操作始终都会成功，也正因为如此，它的成员变量里只有一个 Condition：

```java
private final Condition notEmpty;
```

这和之前的 ArrayBlockingQueue 拥有两个 Condition（分别是 notEmpty 和 notFull）形成了鲜明的对比，我们的 PriorityBlockingQueue 不需要 notFull，因为它永远都不会满，真是“有空间就可以任性”。

## DelayQueue

DelayQueue 这个队列比较特殊，具有“延迟”的功能。我们可以设定让队列中的任务延迟多久之后执行，比如 10 秒钟之后执行，这在例如“30 分钟后未付款自动取消订单”等需要延迟执行的场景中被大量使用。

它是无界队列，放入的元素必须实现 Delayed 接口，而 Delayed 接口又继承了 Comparable 接口，所以自然就拥有了比较和排序的能力，代码如下：

```java
public interface Delayed extends Comparable<Delayed> {
    long getDelay(TimeUnit unit);
}
```

可以看出这个 Delayed 接口继承自 Comparable，里面有一个需要实现的方法，就是 getDelay。这里的 getDelay 方法返回的是“还剩下多长的延迟时间才会被执行”，如果返回 0 或者负数则代表任务已过期。

元素会根据延迟时间的长短被放到队列的不同位置，越靠近队列头代表越早过期。

DelayQueue 内部使用了 PriorityQueue 的能力来进行排序，而不是自己从头编写，我们在工作中可以学习这种思想，对已有的功能进行复用，不但可以减少开发量，同时避免了“重复造轮子”，更重要的是，对学到的知识进行合理的运用，让知识变得更灵活，做到触类旁通。

## 如何选择

### 线程池对于阻塞队列的选择

|线程池|实现队列|特性|
| :--------------------------------------------------: | :-----------------: | ----------------------------------------------------------------------------------|
|FixedThreadPool|LinkedBlockingQueue|没有额外线程，只存在核心线程，而且核心线程没有超时机制，而且任务队列没有长度的限制|
|SingleThreadExecutor|LinkedBlockingQueue|内部只有一个核心线程，它确保所有的任务都在同一个线程中按顺序执行。|
|CachedThreadPool|SynchronousQueue|只有非核心线程，并且其最大线程数为Integer.MAX_VALUE|
|ScheduledThreadPool<br>SingleThreadScheduledExecutor|DelayedWorkQueue|按照延迟的时间长短对任务进行排序，内部采用的是“堆”的数据结构|

下面我们来看线程池的选择要诀。上面表格左侧是线程池，右侧为它们对应的阻塞队列，你可以看到 5 种线程池只对应了 3 种阻塞队列，下面我们对它们进行逐一的介绍。

- **FixedThreadPool（SingleThreadExecutor 同理）选取的是 LinkedBlockingQueue**

因为 LinkedBlockingQueue 不同于 ArrayBlockingQueue，ArrayBlockingQueue 的容量是有限的，而 LinkedBlockingQueue 是链表长度默认是可以无限延长的。

由于 FixedThreadPool 的线程数是固定的，在任务激增的时候，它无法增加更多的线程来帮忙处理 Task，所以需要像 LinkedBlockingQueue 这样没有容量上限的 Queue 来存储那些还没处理的 Task。

如果所有的 corePoolSize 线程都正在忙，那么新任务将会进入阻塞队列等待，由于队列是没有容量上限的，队列永远不会被填满，这样就保证了对于线程池 FixedThreadPool 和 SingleThreadExecutor 而言，不会拒绝新任务的提交，也不会丢失数据。

- **CachedThreadPool 选取的是 SynchronousQueue**

对于 CachedThreadPool 而言，为了避免新提交的任务被拒绝，它选择了无限制的 maximumPoolSize（在专栏中，maxPoolSize 等同于 maximumPoolSize），所以既然它的线程的最大数量是无限的，也就意味着它的线程数不会受到限制，那么它就不需要一个额外的空间来存储那些 Task，因为每个任务都可以通过新建线程来处理。

SynchronousQueue 会直接把任务交给线程，而不需要另外保存它们，效率更高，所以 CachedThreadPool 使用的 Queue 是 SynchronousQueue。

- **ScheduledThreadPool（SingleThreadScheduledExecutor同理）选取的是延迟队列**

对于 ScheduledThreadPool 而言，它使用的是 DelayedWorkQueue。延迟队列的特点是：不是先进先出，而是会按照延迟时间的长短来排序，下一个即将执行的任务会排到队列的最前面。

我们来举个例子：例如我们往这个队列中，放一个延迟 10 分钟执行的任务，然后再放一个延迟 10 秒钟执行的任务。通常而言，如果不是延迟队列，那么按照先进先出的排列规则，也就是延迟 10 分钟执行的那个任务是第一个放置的，会放在最前面。但是由于我们此时使用的是阻塞队列，阻塞队列在排放各个任务的位置的时候，会根据延迟时间的长短来排放。所以，我们第二个放置的延迟 10 秒钟执行的那个任务，反而会排在延迟 10 分钟的任务的前面，因为它的执行时间更早。

我们选择使用延迟队列的原因是，ScheduledThreadPool 处理的是基于时间而执行的 Task，而延迟队列有能力把 Task 按照执行时间的先后进行排序，这正是我们所需要的功能。

- **ArrayBlockingQueue**

除了线程池选择的 3 种阻塞队列外，还有一种常用的阻塞队列叫作 ArrayBlockingQueue，它也经常被用于我们手动创建的线程池中。

这种阻塞队列内部是用数组实现的，在新建对象的时候要求传入容量值，且后期不能扩容，所以 ArrayBlockingQueue的最大特点就是容量是有限且固定的。这样一来，使用 ArrayBlockingQueue 且设置了合理大小的最大线程数的线程池，在任务队列放满了以后，如果线程数也已经达到了最大值，那么线程池根据规则就会拒绝新提交的任务，而不会无限增加任务或者线程数导致内存不足，可以非常有效地防止资源耗尽的情况发生。

### 归纳

我们可以从以下 5 个角度考虑，来选择合适的阻塞队列：

- 功能

  第 1 个需要考虑的就是功能层面，比如是否需要阻塞队列帮我们排序，如优先级排序、延迟执行等。如果有这个需要，我们就必须选择类似于 PriorityBlockingQueue 之类的有排序能力的阻塞队列。
- 容量

  第 2 个需要考虑的是容量，或者说是否有存储的要求，还是只需要“直接传递”。在考虑这一点的时候，我们知道前面介绍的那几种阻塞队列，有的是容量固定的，如 ArrayBlockingQueue；有的默认是容量无限的，如 LinkedBlockingQueue；而有的里面没有任何容量，如 SynchronousQueue；而对于 DelayQueue 而言，它的容量固定就是 Integer.MAX_VALUE。

  所以不同阻塞队列的容量是千差万别的，我们需要根据任务数量来推算出合适的容量，从而去选取合适的 BlockingQueue。
- 能否扩容

  第 3 个需要考虑的是能否扩容。因为有时我们并不能在初始的时候很好的准确估计队列的大小，因为业务可能有高峰期、低谷期。

  如果一开始就固定一个容量，可能无法应对所有的情况，也是不合适的，有可能需要动态扩容。如果我们需要动态扩容的话，那么就不能选择 ArrayBlockingQueue ，因为它的容量在创建时就确定了，无法扩容。相反，PriorityBlockingQueue 即使在指定了初始容量之后，后续如果有需要，也可以自动扩容。

  所以我们可以根据是否需要扩容来选取合适的队列。
- 内存结构

  第 4 个需要考虑的点就是内存结构。在上一课时我们分析过 ArrayBlockingQueue 的源码，看到了它的内部结构是“数组”的形式。

  和它不同的是，LinkedBlockingQueue 的内部是用链表实现的，所以这里就需要我们考虑到，ArrayBlockingQueue 没有链表所需要的“节点”，空间利用率更高。所以如果我们对性能有要求可以从内存的结构角度去考虑这个问题。
- 性能

  第 5 点就是从性能的角度去考虑。比如 LinkedBlockingQueue 由于拥有两把锁，它的操作粒度更细，在并发程度高的时候，相对于只有一把锁的 ArrayBlockingQueue 性能会更好。

  另外，SynchronousQueue 性能往往优于其他实现，因为它只需要“直接传递”，而不需要存储的过程。如果我们的场景需要直接传递的话，可以优先考虑 SynchronousQueue。
