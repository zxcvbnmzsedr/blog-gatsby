---
title: ConcurrentHashMap详解
date: 2022-04-21 19:40
permalink: /topic/Java%E5%B9%B6%E5%8F%91%E5%B7%A5%E5%85%B7%E5%8C%85/%E5%B9%B6%E5%8F%91%E5%B7%A5%E5%85%B7/%E5%B9%B6%E5%8F%91%E5%AE%B9%E5%99%A8/ConcurrentHashMap%E8%AF%A6%E8%A7%A3
topic: 
  - topic
tags: null
categories: 
  - topic
  - Java并发工具包
  - 并发工具
  - 并发容器
  - ConcurrentHashMap详解
---
ConcurrentHashMap是JUC包中提供的一个高性能并且线程安全的map集合。

　　相对于Hashtable这种, 对操作进行synchronized加锁的，ConcurrentHashMap却是用分段锁或者cas来操作的极大地提高了效率。

　　ConcurrentHashMap在JDK 1.7和1.8中的实现并不相同，所以我们分开来说。

## ConcurrentHashMap_JDK7

　　在JDK1.5~1.7版本，Java使用了分段锁机制实现ConcurrentHashMap。

　　分段锁，简单来说就是将Hash表划分成多段——Segment数组，每段单独进行上锁，每个段这个时候就相当于一个线程安全的HashTable。

　　在进行put的时候，根据Hash算法定位到某个Segment元素上，然后对此Segment进行加锁即可，避免了整个Hash表加锁。

### 数据结构

　　在不指定的时候，ConcurrentHashMap会将默认初始化一个长度为16的segment数组。

　　ConcurrentHashMap本质上是一个Segment 数组，Segment通过继承 ReentrantLock 来进行加锁，所以每次需要加锁的操作锁住的是一个 segment，这样只要保证每个 Segment 是线程安全的，也就实现了全局的线程安全。

　　![ConcurrentHashMap](https://www.shiyitopo.tech/uPic/ConcurrentHashMap.png)

### 初始化

### 初始化

```java
/**
     * 初始化创建一个指定了初始容量、负载因子、并行等级的map
     * 
     * @param initialCapacity 初始容量，这个值指的是整个ConcurrentHashMap的初始容量,实际操作的时候需要平均分给每个 
     * Segment。
     * @param loadFactor 负载因子，用于判断扩容的临界值
     * @param concurrencyLevel 默认16，并发数、Segment数组大小、并行级别。
     * 默认16就意味着最多只有16个线程同时写
     */
    @SuppressWarnings("unchecked")
    public ConcurrentHashMap(int initialCapacity,
                             float loadFactor, int concurrencyLevel) {
        if (!(loadFactor > 0) || initialCapacity < 0 || concurrencyLevel <= 0)
            throw new IllegalArgumentException();
        if (concurrencyLevel > MAX_SEGMENTS)
            concurrencyLevel = MAX_SEGMENTS;
        // Find power-of-two sizes best matching arguments
        int sshift = 0;
        int ssize = 1;
        // 计算并行级别 ssize，因为要保持并行级别是 2 的 n 次方
        while (ssize < concurrencyLevel) {
            ++sshift;
            ssize <<= 1;
        }
       // concurrencyLevel 为 16，sshift 为 4
       // 那么计算出 segmentShift 为 28，segmentMask 为 15，后面会用到这两个值
        this.segmentShift = 32 - sshift;
        this.segmentMask = ssize - 1;
        if (initialCapacity > MAXIMUM_CAPACITY)
            initialCapacity = MAXIMUM_CAPACITY;
      // initialCapacity 是设置整个 map 初始的大小，
      // 这里根据 initialCapacity 计算 Segment 数组中每个位置可以分到的大小
      // 如 initialCapacity 为 64，那么每个 Segment 或称之为"槽"可以分到 4 个
        int c = initialCapacity / ssize;
        if (c * ssize < initialCapacity)
            ++c;
         // 默认 MIN_SEGMENT_TABLE_CAPACITY 是 2，这个值也是有讲究的，因为这样的话，对于具体的槽上，
        // 插入一个元素不至于扩容，插入第二个的时候才会扩容
        int cap = MIN_SEGMENT_TABLE_CAPACITY;
        while (cap < c)
            cap <<= 1;
        // create segments and segments[0]
        // 创建 Segment 数组，
      // 并创建数组的第一个元素 segment[0]
        Segment<K,V> s0 =
            new Segment<K,V>(loadFactor, (int)(cap * loadFactor),
                             (HashEntry<K,V>[])new HashEntry[cap]);
        Segment<K,V>[] ss = (Segment<K,V>[])new Segment[ssize];
        // 往数组写入segment[0]
        UNSAFE.putOrderedObject(ss, SBASE, s0); // ordered write of segments[0]
        this.segments = ss;
    }
```

　　初始化完成，我们得到了一个 Segment 数组。

　　我们就当是用 new ConcurrentHashMap() 无参构造函数进行初始化的，那么初始化完成后:

- Segment 数组长度为 16，不可以扩容
- Segment[i] 的默认大小为 2，负载因子是 0.75，得出初始阈值为 1.5，也就是以后插入第一个元素不会触发扩容，插入第二个会进行第一次扩容
- 这里初始化了 segment[0]，其他位置还是 null，至于为什么要初始化 segment[0]，后面的代码会介绍
- 当前 segmentShift 的值为 32 - 4 = 28，segmentMask 为 16 - 1 = 15，姑且把它们简单翻译为移位数和掩码，这两个值马上就会用到

### put过程分析

　　ConcurrentHashMap是通过key的hash寻找两次进行插入，第一次是找出Segment，第二次是找出具体的Hash

```java
 public V put(K key, V value) {
        Segment<K,V> s;
        if (value == null)
            throw new NullPointerException();
   			// 计算key的Hash值
        int hash = hash(key.hashCode());
        //  根据 hash 值找到 Segment 数组中的位置 j
        //    hash 是 32 位，无符号右移 segmentShift(28) 位，剩下高 4 位，
        //    然后和 segmentMask(15) 做一次与操作，也就是说 j 是 hash 值的高 4 位，也就是槽的数组下标
        int j = (hash >>> segmentShift) & segmentMask;
   			// 初始化的时候初始化了 segment[0]，但是其他位置还是 null，
       // ensureSegment(j) 对 segment[j] 进行初始化
        if ((s = (Segment<K,V>)UNSAFE.getObject          // nonvolatile; recheck
             (segments, (j << SSHIFT) + SBASE)) == null) //  in ensureSegment
            s = ensureSegment(j);
         // 找到槽s了，通过槽s暴露出的方法进行put操作
        return s.put(key, hash, value, false);
    }
```

　　Segment暴露出来的put方法:

```java
final V put(K key, int hash, V value, boolean onlyIfAbsent) {
            // 分段锁来了~，这一步只对这一段进行了一个加锁，以确保线程安全
            HashEntry<K,V> node = tryLock() ? null :
                scanAndLockForPut(key, hash, value);
            V oldValue;
            try {
                // segment内部的数组,存放元素的地方
                HashEntry<K,V>[] tab = table;
              	// 第二次，利用hash值取得在内部数组中的位置
                int index = (tab.length - 1) & hash;
                // first 是数组该位置处的链表的表头
                HashEntry<K,V> first = entryAt(tab, index);
              	// 接下来就是一大段循环链表的操作，用于插入具体元素
                for (HashEntry<K,V> e = first;;) {
                  	// 当链表中的元素不为空的时候
                    if (e != null) {
                        K k;
                      	// 加入，put的元素正好存在链表中，则把老的给替换掉
                        if ((k = e.key) == key ||
                            (e.hash == hash && key.equals(k))) {
                            oldValue = e.value;
                            if (!onlyIfAbsent) {
                                e.value = value;
                                ++modCount;
                            }
                            break;
                        }
                      	// 寻找下一个
                        e = e.next;
                    }
                    else {
                        // 到这个判断逻辑中，则说明了链表到了末尾 
                       // node 到底是不是 null，这个要看获取锁的过程，不过和这里都没有关系。
                       // 采用头插法进行插入。
                       // 如果不为 null，那就直接将它设置为链表表头；如果是null，初始化并设置为链表表头。																		 // 这也是区别于HashMap的地方，HashMap1.7中也是采用头插法但由于没有锁，扩容时会导致循环链表的出现
                        if (node != null)
                            node.setNext(first);
                        else
                            node = new HashEntry<K,V>(hash, key, value, first);
                        int c = count + 1;
                        // 如果超过了该 segment 的阈值，这个 segment 需要扩容
                        if (c > threshold && tab.length < MAXIMUM_CAPACITY)
                            rehash(node);
                        else
                            // 没有达到阈值，将 node 放到数组 tab 的 index 位置，
                          // 其实就是将新的节点设置成原链表的表头
                            setEntryAt(tab, index, node);
                        ++modCount;
                        count = c;
                        oldValue = null;
                        break;
                    }
                }
            } finally {
               // 解锁
                unlock();
            }
            return oldValue;
        }
```

### 初始化槽: ensureSegment

　　ConcurrentHashMap 初始化的时候会初始化第一个槽 segment[0]，对于其他槽来说，在插入第一个值的时候进行初始化。

　　这里需要考虑并发，因为很可能会有多个线程同时进来初始化同一个槽 segment[k]，不过只要有一个成功了就可以。

```java
private Segment<K,V> ensureSegment(int k) {
    final Segment<K,V>[] ss = this.segments;
    long u = (k << SSHIFT) + SBASE; // raw offset
    Segment<K,V> seg;
    if ((seg = (Segment<K,V>)UNSAFE.getObjectVolatile(ss, u)) == null) {
        // 这里看到为什么之前要初始化 segment[0] 了，
        // 使用当前 segment[0] 处的数组长度和负载因子来初始化 segment[k]
        // 为什么要用“当前”，因为 segment[0] 可能早就扩容过了
        Segment<K,V> proto = ss[0];
        int cap = proto.table.length;
        float lf = proto.loadFactor;
        int threshold = (int)(cap * lf);

        // 初始化 segment[k] 内部的数组
        HashEntry<K,V>[] tab = (HashEntry<K,V>[])new HashEntry[cap];
        if ((seg = (Segment<K,V>)UNSAFE.getObjectVolatile(ss, u))
            == null) { // 再次检查一遍该槽是否被其他线程初始化了。

            Segment<K,V> s = new Segment<K,V>(lf, threshold, tab);
            // 使用 while 循环，内部用 CAS，当前线程成功设值或其他线程成功设值后，退出
            while ((seg = (Segment<K,V>)UNSAFE.getObjectVolatile(ss, u))
                   == null) {
                if (UNSAFE.compareAndSwapObject(ss, u, null, seg = s))
                    break;
            }
        }
    }
    return seg;
}   
```

　　总的来说，ensureSegment(int k) 比较简单，对于并发操作使用 CAS 进行控制。

### 获取写入锁-scanandlockforput

　　前面我们看到，在往某个 segment 中 put 的时候，首先会调用 node = tryLock() ? null : scanAndLockForPut(key, hash, value)，也就是说先进行一次 tryLock() 快速获取该 segment 的独占锁，如果失败，那么进入到 scanAndLockForPut 这个方法来获取锁。

　　下面我们来具体分析这个方法中是怎么控制加锁的。

```java
private HashEntry<K,V> scanAndLockForPut(K key, int hash, V value) {
    HashEntry<K,V> first = entryForHash(this, hash);
    HashEntry<K,V> e = first;
    HashEntry<K,V> node = null;
    int retries = -1; // negative while locating node
    // 循环获取锁
    while (!tryLock()) {
        HashEntry<K,V> f; // to recheck first below
        if (retries < 0) {
            if (e == null) {
                if (node == null) // speculatively create node
                    // 进到这里说明数组该位置的链表是空的，没有任何元素
                    // 当然，进到这里的另一个原因是 tryLock() 失败，所以该槽存在并发，不一定是该位置
                    node = new HashEntry<K,V>(hash, key, value, null);
                retries = 0;
            }
            else if (key.equals(e.key))
                retries = 0;
            else
                // 顺着链表往下走
                e = e.next;
        }
        // 重试次数如果超过 MAX_SCAN_RETRIES(单核1多核64)，那么不抢了，进入到阻塞队列等待锁
        //    lock() 是阻塞方法，直到获取锁后返回
        else if (++retries > MAX_SCAN_RETRIES) {
            lock();
            break;
        }
        else if ((retries & 1) == 0 &&
                 // 这个时候是有大问题了，那就是有新的元素进到了链表，成为了新的表头
                 //     所以这边的策略是，相当于重新走一遍这个 scanAndLockForPut 方法
                 (f = entryForHash(this, hash)) != first) {
            e = first = f; // re-traverse if entry changed
            retries = -1;
        }
    }
    return node;
}
```

　　这个方法有两个出口，一个是 tryLock() 成功了，循环终止，另一个就是重试次数超过了 MAX_SCAN_RETRIES，进到 lock() 方法，此方法会阻塞等待，直到成功拿到独占锁。

　　这个方法就是看似复杂，但是其实就是做了一件事，那就是获取该 segment 的独占锁，如果需要的话顺便实例化了一下 node。

### 扩容-rehash

　　重复一下，segment 数组不能扩容，扩容是 segment 数组某个位置内部的数组 HashEntry<K,V>[] 进行扩容，扩容后，容量为原来的 2 倍。

　　首先，我们要回顾一下触发扩容的地方，put 的时候，如果判断该值的插入会导致该 segment 的元素个数超过阈值，那么先进行扩容，再插值，读者这个时候可以回去 put 方法看一眼。

　　该方法不需要考虑并发，因为到这里的时候，是持有该 segment 的独占锁的。

```java
// 方法参数上的 node 是这次扩容后，需要添加到新的数组中的数据。
private void rehash(HashEntry<K,V> node) {
    HashEntry<K,V>[] oldTable = table;
    int oldCapacity = oldTable.length;
    // 2 倍
    int newCapacity = oldCapacity << 1;
    threshold = (int)(newCapacity * loadFactor);
    // 创建新数组
    HashEntry<K,V>[] newTable =
        (HashEntry<K,V>[]) new HashEntry[newCapacity];
    // 新的掩码，如从 16 扩容到 32，那么 sizeMask 为 31，对应二进制 ‘000...00011111’
    int sizeMask = newCapacity - 1;
    // 遍历原数组，老套路，将原数组位置 i 处的链表拆分到 新数组位置 i 和 i+oldCap 两个位置
    for (int i = 0; i < oldCapacity ; i++) {
        // e 是链表的第一个元素
        HashEntry<K,V> e = oldTable[i];
        if (e != null) {
            HashEntry<K,V> next = e.next;
            // 计算应该放置在新数组中的位置，
            // 假设原数组长度为 16，e 在 oldTable[3] 处，那么 idx 只可能是 3 或者是 3 + 16 = 19
            int idx = e.hash & sizeMask;
            if (next == null)   // 该位置处只有一个元素，那比较好办
                newTable[idx] = e;
            else { // Reuse consecutive sequence at same slot
                // e 是链表表头
                HashEntry<K,V> lastRun = e;
                // idx 是当前链表的头结点 e 的新位置
                int lastIdx = idx;
                // 下面这个 for 循环会找到一个 lastRun 节点，这个节点之后的所有元素是将要放到一起的
                for (HashEntry<K,V> last = next;
                     last != null;
                     last = last.next) {
                    int k = last.hash & sizeMask;
                    if (k != lastIdx) {
                        lastIdx = k;
                        lastRun = last;
                    }
                }
                // 将 lastRun 及其之后的所有节点组成的这个链表放到 lastIdx 这个位置
                newTable[lastIdx] = lastRun;
                // 下面的操作是处理 lastRun 之前的节点，
                //    这些节点可能分配在另一个链表中，也可能分配到上面的那个链表中
                for (HashEntry<K,V> p = e; p != lastRun; p = p.next) {
                    V v = p.value;
                    int h = p.hash;
                    int k = h & sizeMask;
                    HashEntry<K,V> n = newTable[k];
                    newTable[k] = new HashEntry<K,V>(h, p.key, v, n);
                }
            }
        }
    }
    // 将新来的 node 放到新数组中刚刚的 两个链表之一 的 头部
    int nodeIndex = node.hash & sizeMask; // add the new node
    node.setNext(newTable[nodeIndex]);
    newTable[nodeIndex] = node;
    table = newTable;
}
```

### get 过程分析

　　相对于 put 来说，get 就很简单了。

- 计算 hash 值，找到 segment 数组中的具体位置，或我们前面用的“槽”
- 槽中也是一个数组，根据 hash 找到数组中具体的位置
- 到这里是链表了，顺着链表进行查找即可

```java
public V get(Object key) {
    Segment<K,V> s; // manually integrate access methods to reduce overhead
    HashEntry<K,V>[] tab;
    // 1. hash 值
    int h = hash(key);
    long u = (((h >>> segmentShift) & segmentMask) << SSHIFT) + SBASE;
    // 2. 根据 hash 找到对应的 segment
    if ((s = (Segment<K,V>)UNSAFE.getObjectVolatile(segments, u)) != null &&
        (tab = s.table) != null) {
        // 3. 找到segment 内部数组相应位置的链表，遍历
        for (HashEntry<K,V> e = (HashEntry<K,V>) UNSAFE.getObjectVolatile
                 (tab, ((long)(((tab.length - 1) & h)) << TSHIFT) + TBASE);
             e != null; e = e.next) {
            K k;
            if ((k = e.key) == key || (e.hash == h && key.equals(k)))
                return e.value;
        }
    }
    return null;
}    
```

### 并发问题分析

　　现在我们已经说完了 put 过程和 get 过程，我们可以看到 get 过程中是没有加锁的，那自然我们就需要去考虑并发问题。

　　添加节点的操作 put 和删除节点的操作 remove 都是要加 segment 上的独占锁的，所以它们之间自然不会有问题，我们需要考虑的问题就是 get 的时候在同一个 segment 中发生了 put 或 remove 操作。

- put 操作的线程安全性。
  - 初始化槽，这个我们之前就说过了，使用了 CAS 来初始化 Segment 中的数组。
  - 添加节点到链表的操作是插入到表头的，所以，如果这个时候 get 操作在链表遍历的过程已经到了中间，是不会影响的。当然，另一个并发问题就是 get 操作在 put 之后，需要保证刚刚插入表头的节点被读取，这个依赖于 setEntryAt 方法中使用的 UNSAFE.putOrderedObject。
  - 扩容。扩容是新创建了数组，然后进行迁移数据，最后面将 newTable 设置给属性 table。所以，如果 get 操作此时也在进行，那么也没关系，如果 get 先行，那么就是在旧的 table 上做查询操作；而 put 先行，那么 put 操作的可见性保证就是 table 使用了 volatile 关键字。
- remove 操作的线程安全性。
  - remove 操作我们没有分析源码，所以这里说的读者感兴趣的话还是需要到源码中去求实一下的。
  - get 操作需要遍历链表，但是 remove 操作会"破坏"链表。
  - 如果 remove 破坏的节点 get 操作已经过去了，那么这里不存在任何问题。
  - 如果 remove 先破坏了一个节点，分两种情况考虑。 1、如果此节点是头结点，那么需要将头结点的 next 设置为数组该位置的元素，table 虽然使用了 volatile 修饰，但是 volatile 并不能提供数组内部操作的可见性保证，所以源码中使用了 UNSAFE 来操作数组，请看方法 setEntryAt。2、如果要删除的节点不是头结点，它会将要删除节点的后继节点接到前驱节点中，这里的并发保证就是 next 属性是 volatile 的。

## ConcurrentHashMap_JDK8

　　在 Java 8 中，几乎完全重写了 ConcurrentHashMap，代码量从原来 Java 7 中的 1000 多行，变成了现在的 6000 多行，所以也大大提高了源码的阅读难度。而为了方便我们理解，我们还是先从整体的结构示意图出发，看一看总体的设计思路，然后再去深入细节。

　　![1.8数据结构](https://www.shiyitopo.tech/uPic/1.8%E6%95%B0%E6%8D%AE%E7%BB%93%E6%9E%84.png)

　　图中的节点有三种类型:

1. 空着的位置代表还没有元素来填充
2. 相同hash值使用链表向后进行延伸，此举和hashmap相同
3. 在链表长度超过8，会将链表转换成为红黑树

　　我们先来看看最基础的内部存储结构 Node，这就是一个一个的节点，如这段代码所示：

```java
static class Node<K,V> implements Map.Entry<K,V> {
    final int hash;
    final K key;
    volatile V val;
    volatile Node<K,V> next;
    // ...
}
```

　　可以看出，每个 Node 里面是 key-value 的形式，并且把 value 用 volatile 修饰，以便保证可见性，同时内部还有一个指向下一个节点的 next 指针，方便产生链表结构。

　　下面我们看两个最重要、最核心的方法。

### put 方法源码分析

　　put 方法的核心是 putVal 方法，为了方便阅读，我把重要步骤的解读用注释的形式补充在下面的源码中。我们逐步分析这个最重要的方法，这个方法相对有些长，我们一步一步把它看清楚。

```java
final V putVal(K key, V value, boolean onlyIfAbsent) {
    if (key == null || value == null) {
        throw new NullPointerException();
    }
    //计算 hash 值
    int hash = spread(key.hashCode());
    int binCount = 0;
    for (Node<K, V>[] tab = table; ; ) {
        Node<K, V> f;
        int n, i, fh;
        //如果数组是空的，就进行初始化
        if (tab == null || (n = tab.length) == 0) {
            tab = initTable();
        }
        // 找该 hash 值对应的数组下标
        else if ((f = tabAt(tab, i = (n - 1) & hash)) == null) {
            //如果该位置是空的，就用 CAS 的方式放入新值
            if (casTabAt(tab, i, null,
                    new Node<K, V>(hash, key, value, null))) {
                break;
            }
        }
        //hash值等于 MOVED 代表在扩容
        else if ((fh = f.hash) == MOVED) {
            tab = helpTransfer(tab, f);
        }
        //槽点上是有值的情况
        else {
            V oldVal = null;
            //用 synchronized 锁住当前槽点，保证并发安全
            synchronized (f) {
                if (tabAt(tab, i) == f) {
                    //如果是链表的形式
                    if (fh >= 0) {
                        binCount = 1;
                        //遍历链表
                        for (Node<K, V> e = f; ; ++binCount) {
                            K ek;
                            //如果发现该 key 已存在，就判断是否需要进行覆盖，然后返回
                            if (e.hash == hash &&
                                    ((ek = e.key) == key ||
                                            (ek != null && key.equals(ek)))) {
                                oldVal = e.val;
                                if (!onlyIfAbsent) {
                                    e.val = value;
                                }
                                break;
                            }
                            Node<K, V> pred = e;
                            //到了链表的尾部也没有发现该 key，说明之前不存在，就把新值添加到链表的最后
                            if ((e = e.next) == null) {
                                pred.next = new Node<K, V>(hash, key, value, null);
                                break;
                            }
                        }
                    }
                    //如果是红黑树的形式
                    else if (f instanceof TreeBin) {
                        Node<K, V> p;
                        binCount = 2;
                        //调用 putTreeVal 方法往红黑树里增加数据
                        if ((p = ((TreeBin<K, V>) f).putTreeVal(hash, key,value)) != null) {
                            oldVal = p.val;
                            if (!onlyIfAbsent) {
                                p.val = value;
                            }
                        }
                    }
                }
            }
            if (binCount != 0) {
                //检查是否满足条件并把链表转换为红黑树的形式，默认的 TREEIFY_THRESHOLD 阈值是 8
                if (binCount >= TREEIFY_THRESHOLD) {
                    treeifyBin(tab, i);
                }
                //putVal 的返回是添加前的旧值，所以返回 oldVal
                if (oldVal != null) {
                    return oldVal;
                }
                break;
            }
        }
    }
    addCount(1L, binCount);
    return null;
}
```

　　通过以上的源码分析，我们对于 putVal 方法有了详细的认识，可以看出，方法中会逐步根据当前槽点是未初始化、空、扩容、链表、红黑树等不同情况做出不同的处理。

### get 方法源码分析

　　get 方法比较简单，我们同样用源码注释的方式来分析一下：

```java
public V get(Object key) {
    Node<K,V>[] tab; Node<K,V> e, p; int n, eh; K ek;
    //计算 hash 值
    int h = spread(key.hashCode());
    //如果整个数组是空的，或者当前槽点的数据是空的，说明 key 对应的 value 不存在，直接返回 null
    if ((tab = table) != null && (n = tab.length) > 0 &&
            (e = tabAt(tab, (n - 1) & h)) != null) {
        //判断头结点是否就是我们需要的节点，如果是则直接返回
        if ((eh = e.hash) == h) {
            if ((ek = e.key) == key || (ek != null && key.equals(ek)))
                return e.val;
        }
        //如果头结点 hash 值小于 0，说明是红黑树或者正在扩容，就用对应的 find 方法来查找
        else if (eh < 0)
            return (p = e.find(h, key)) != null ? p.val : null;
        //遍历链表来查找
        while ((e = e.next) != null) {
            if (e.hash == h && ((ek = e.key) == key || (ek != null && key.equals(ek))))
                return e.val;
        }
    }
    return null;
}
```

　　总结一下 get 的过程：

1. 计算 Hash 值，并由此值找到对应的槽点；
2. 如果数组是空的或者该位置为 null，那么直接返回 null 就可以了；
3. 如果该位置处的节点刚好就是我们需要的，直接返回该节点的值；
4. 如果该位置节点是红黑树或者正在扩容，就用 find 方法继续查找；
5. 否则那就是链表，就进行遍历链表查找。

## 对比Java7 和Java8 的异同和优缺点

### 并发度

　　Java 7 中，每个 Segment 独立加锁，最大并发个数就是 Segment 的个数，默认是 16。

　　但是到了 Java 8 中，锁粒度更细，理想情况下 table 数组元素的个数（也就是数组长度）就是其支持并发的最大个数，并发度比之前有提高。

### 保证并发安全的原理

　　Java 7 采用 Segment 分段锁来保证安全，而 Segment 是继承自 ReentrantLock。

　　Java 8 中放弃了 Segment 的设计，采用 Node + CAS + synchronized 保证线程安全。

### 遇到 Hash 碰撞

　　Java 7 在 Hash 冲突时，会使用拉链法，也就是链表的形式。

　　Java 8 先使用拉链法，在链表长度超过一定阈值时，将链表转换为红黑树，来提高查找效率。

### 查询时间复杂度

　　Java 7 遍历链表的时间复杂度是 O(n)，n 为链表长度。

　　Java 8 如果变成遍历红黑树，那么时间复杂度降低为 O(log(n))，n 为树的节点个数。

　　参考链接：https://www.pdai.tech/md/java/thread/java-thread-x-juc-collection-ConcurrentHashMap.html
