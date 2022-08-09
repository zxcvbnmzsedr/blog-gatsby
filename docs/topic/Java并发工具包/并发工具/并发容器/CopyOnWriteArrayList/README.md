---
title: CopyOnWriteArrayList
date: 2022-04-21 19:40
permalink: /topic/Java%E5%B9%B6%E5%8F%91%E5%B7%A5%E5%85%B7%E5%8C%85/%E5%B9%B6%E5%8F%91%E5%B7%A5%E5%85%B7/%E5%B9%B6%E5%8F%91%E5%AE%B9%E5%99%A8/CopyOnWriteArrayList
topic: 
  - topic
tags: null
categories: 
  - topic
  - Java并发工具包
  - 并发工具
  - 并发容器
  - CopyOnWriteArrayList
---
　　在CopyOnWrite诞生之前，就有了ArrayList和LinkedList作为List的数组，也有了线程安全的Vector和Collections.synchronizedList()可以使用。

　　我们先来列举几个，Vector的实现:

```java
public synchronized boolean add(E e) {
        modCount++;
        ensureCapacityHelper(elementCount + 1);
        elementData[elementCount++] = e;
        return true;
}
public synchronized boolean removeElement(Object obj) {
        modCount++;
        int i = indexOf(obj);
        if (i >= 0) {
            removeElementAt(i);
            return true;
        }
        return false;
}
public synchronized E get(int index) {
        if (index >= elementCount)
            throw new ArrayIndexOutOfBoundsException(index);

        return elementData(index);
    }
```

　　我们可以看到，Vector内部是采用synchronized来保证线程安全的，并且锁的颗粒度比较大，直接作用在方法体上面。

　　在并发的情况下很容易发生竞争，并发效率比较低。

　　从这种做法来看，Vector和Hashtable很类似，都是粗粒的锁。

　　正因如此，JUC中提供了使用CopyOnWrite机制来实现并发容器，并推出了CopyOnWriteList作为主要的并发List。

## 特点

## 复制修改

　　从 CopyOnWriteArrayList 的名字就能看出它是满足 CopyOnWrite 的 ArrayList，CopyOnWrite 的意思是说，当容器需要被修改的时候，不直接修改当前容器，而是先将当前容器进行 Copy，复制出一个新的容器，然后修改新的容器，**完成修改之后，再将原容器的引用指向新的容器**。这样就完成了整个修改过程。

　　这样做的好处是，CopyOnWriteArrayList 利用了“不变性”原理，因为容器每次修改都是创建新副本，所以对于旧容器来说，其实是不可变的，也是线程安全的，无需进一步的同步操作。我们可以对 CopyOnWrite 容器进行并发的读，而不需要加锁，因为当前容器不会添加任何元素，也不会有修改。

　　CopyOnWriteArrayList 的所有修改操作（add，set等）都是通过创建底层数组的新副本来实现的，所以 CopyOnWrite 容器也是一种读写分离的思想体现，读和写使用不同的容器。

### 迭代期间允许修改集合内容

　　我们知道 ArrayList 在迭代期间如果修改集合的内容，会抛出 ConcurrentModificationException 异常。让我们来分析一下 ArrayList 会抛出异常的原因。

　　在 ArrayList 源码里的 ListItr 的 next 方法中有一个 checkForComodification 方法，代码如下：

```java
final void checkForComodification() {
    if (modCount != expectedModCount)
        throw new ConcurrentModificationException();
}
```

　　这里会首先检查 modCount 是否等于 expectedModCount。modCount 是保存修改次数，每次我们调用 add、remove 或 trimToSize 等方法时它会增加，expectedModCount 是迭代器的变量，当我们创建迭代器时会初始化并记录当时的 modCount。后面迭代期间如果发现 modCount 和 expectedModCount 不一致，就说明有人修改了集合的内容，就会抛出异常。

　　和 ArrayList 不同的是，CopyOnWriteArrayList 的迭代器在迭代的时候，如果数组内容被修改了，CopyOnWriteArrayList 不会报 ConcurrentModificationException 的异常，因为迭代器使用的依然是旧数组，只不过迭代的内容可能已经过时了。

　　CopyOnWriteArrayList 的迭代器一旦被建立之后，如果往之前的 CopyOnWriteArrayList 对象中去新增元素，在迭代器中既不会显示出元素的变更情况，同时也不会报错，这一点和 ArrayList 是有很大区别的。

## 缺点

### 内存占用大

　　因为 CopyOnWrite 的写时复制机制，所以在进行写操作的时候，内存里会同时驻扎两个对象的内存，这一点会占用额外的内存空间。

### 元素较多或者复杂的情况下，复制的开销大

　　复制过程不仅会占用双倍内存，还需要消耗 CPU 等资源，会降低整体性能。在原数组内容较多的情况下，可能导致yong gc 或者 full gc。

### 数据一致性无法保证

　　由于 CopyOnWrite 容器的修改是先修改副本，所以这次修改对于其他线程来说，并不是实时能看到的，只有在修改完之后才能体现出来。如果你希望写入的的数据马上能被其他线程看到，CopyOnWrite 容器是不适用的。

### 只适合读多写少的场景

　　因为谁也没法保证CopyOnWriteArrayList 到底要放置多少数据，万一数据稍微有点多，每次add/set都要重新复制数组，这个代价实在太高昂了。在高性能的互联网应用中，这种操作分分钟引起故障。

## 源码分析

### 数据结构

```java
		/** 保护竞争操作的可重入锁 **/    
    final transient ReentrantLock lock = new ReentrantLock();
   /** 底层存放数据的数组，用volatile保证可见性 ,并且不能被序列化 **/
    private transient volatile Object[] array;

    /**
     * 获取数组对象
     */
    final Object[] getArray() {
        return array;
    }
    final void setArray(Object[] a) {
        array = a;
    }
    /** 在构造函数中初始化数组 **/
    public CopyOnWriteArrayList() {
        setArray(new Object[0]);
    }
```

### add方法

```java
public boolean add(E e) {
        // 加锁
        final ReentrantLock lock = this.lock;
        lock.lock();
        try {
           // 得到原数组的长度
            Object[] elements = getArray();
            int len = elements.length;
            // 拷贝新的一个出来
            Object[] newElements = Arrays.copyOf(elements, len + 1);
          	// 新元素添加到新数组中
            newElements[len] = e;
          	// 将新的数组设置回去
            setArray(newElements);
            return true;
        } finally {
            lock.unlock();
        }
    }
```

　　在添加的时候首先上锁，并复制一个新数组，增加操作在新数组上完成，然后将 array 指向到新数组，最后解锁。

　　CopyOnWrite 的思想：写操作是在原来容器的拷贝上进行的，并且在读取数据的时候不会锁住 list。

　　而且可以看到，如果对容器拷贝操作的过程中有新的读线程进来，那么读到的还是旧的数据，因为在那个时候对象的引用还没有被更改。

### get操作

```java
public E get(int index) {
    return get(getArray(), index);
}
final Object[] getArray() {
    return array;
}
private E get(Object[] a, int index) {
    return (E) a[index];
}
```

　　get操作没有加锁，这样就能够保证了读取的速度，但遗憾的是，没有办法保证读取的一致性，因为只有容器在解锁的时候，get的才能是新的值

### 迭代器**COWIterator**类

　　迭代器中有两个重要的类，一个是当前数组的快照，另一个是迭代器的游标。

　　在构建迭代器的时候，会将当前的数组赋值给snapshot，之后所有的操作都是基于这个snapshot，在迭代的过程中，即使有修改，那对于当前正在迭代的程序是不可兼见的。

　　就是由于这个特性，迭代过程中元素是不可删的，因为删了也没有用。

```java
    /** Snapshot of the array */
    private final Object[] snapshot;
    /** Index of element to be returned by subsequent call to next.  */
    private int cursor;

    private COWIterator(Object[] elements, int initialCursor) {
        cursor = initialCursor;
        snapshot = elements;
    }
    public E next() {
            if (! hasNext())
                throw new NoSuchElementException();
            return (E) snapshot[cursor++];
        }
		public void remove() {
            throw new UnsupportedOperationException();
    }
```
