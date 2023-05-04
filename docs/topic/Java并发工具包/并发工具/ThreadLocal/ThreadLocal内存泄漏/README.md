---
title: ThreadLocal内存泄漏
date: 2022-04-21 19:40
permalink: /topic/Java%E5%B9%B6%E5%8F%91%E5%B7%A5%E5%85%B7%E5%8C%85/%E5%B9%B6%E5%8F%91%E5%B7%A5%E5%85%B7/ThreadLocal/ThreadLocal%E5%86%85%E5%AD%98%E6%B3%84%E6%BC%8F
topic: 
  - topic
tags: null
categories: 
  - topic
  - Java并发工具包
  - 并发工具
  - ThreadLocal
  - ThreadLocal内存泄漏
---
# ThreadLocal内存泄漏

## ThreadLocal的实现原理

ThreadLocal的保存变量，是维护在Thread中的。

但是由于每个线程在访问ThreadLocal对象之后，都会在Thread中的Map中留下ThreadLocal对象与具体实例的引用，如果不删除这些引用则这些ThreadLocal则不能进行回收，会造成内存泄漏

![ThreadLocal](https://www.shiyitopo.tech/uPic/ThreadLocal.png)

![img](https://www.shiyitopo.tech/uPic/Cgq2xl5Pld-AHFhJAADLtGXmSxc833.png)

## 内存泄漏的案例

网上有一段说明ThreadLocal内存泄漏非常好的代码。

通过线程池去持有ThreadLocal对象，由于线程池的特性，线程被用完之后不会被释放。

因此，总是存在<ThreadLocal,LocalVariable>的强引用，file static修饰的变量不会被释放，所以即使TreadLocalMap的key是弱引用，但由于强引用的存在，弱引用一直会有值，不会被GC回收。

内存泄漏的大小 = `核心线程数 * LocalVariable`

```java
public class ThreadLocalDemo {
    static class LocalVariable {
        private Long[] a = new Long[1024 * 1024];
    }

    // (1)
    final static ThreadPoolExecutor poolExecutor = new ThreadPoolExecutor(5, 5, 1, TimeUnit.MINUTES,
            new LinkedBlockingQueue<>());
    // (2)
    final static ThreadLocal<LocalVariable> localVariable = new ThreadLocal<LocalVariable>();

    public static void main(String[] args) throws InterruptedException {
        // (3)
        Thread.sleep(5000 * 4);
        for (int i = 0; i < 50; ++i) {
            poolExecutor.execute(new Runnable() {
                public void run() {
                    // (4)
                    localVariable.set(new LocalVariable());
                    // (5)
                    System.out.println("use local varaible" + localVariable.get());
                    localVariable.remove();
                }
            });
        }
        // (6)
        System.out.println("pool execute over");
    }
}
```

所以, 为了避免出现内存泄露的情况, ThreadLocal提供了一个清除线程中对象的方法, 即 remove, 其实内部实现就是调用 ThreadLocalMap 的remove方法

```java
private void remove(ThreadLocal<?> key) {
    Entry[] tab = table;
    int len = tab.length;
    int i = key.threadLocalHashCode & (len-1);
    for (Entry e = tab[i];
         e != null;
         e = tab[i = nextIndex(i, len)]) {
        if (e.get() == key) {
            e.clear();
            expungeStaleEntry(i);
            return;
        }
    }
}

```

找到Key对应的Entry, 并且清除Entry的Key(ThreadLocal)置空, 随后清除过期的Entry即可避免内存泄露。
