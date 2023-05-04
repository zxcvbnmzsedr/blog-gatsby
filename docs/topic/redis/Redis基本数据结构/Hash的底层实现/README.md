---
title: Hash的底层实现
date: 2022-04-28 14:17
permalink: /topic/redis/Redis%E5%9F%BA%E6%9C%AC%E6%95%B0%E6%8D%AE%E7%BB%93%E6%9E%84/Hash%E7%9A%84%E5%BA%95%E5%B1%82%E5%AE%9E%E7%8E%B0
topic: 
  - topic
tags: null
categories: 
  - topic
  - redis
  - Redis基本数据结构
  - Hash的底层实现
---
# Hash的底层实现

Hash的底层编码格式是HashTable和ZipList。

Hash底层存储结构HashTable和ZipLit会互相转化。

控制他们转化的参数:

1. hash-max-ziplist-entries,默认512,使用压缩列表保存时哈希集合中的最大元素个数。
2. hash-max-ziplist-value,默认64,使用压缩列表保存时哈希集合中单个元素的最大长度。

```shell
redis> config get hash*
        hash-max-ziplist-entries
        512
        hash-max-ziplist-value
        64
```

当哈希对象同时符合下面两个条件时，将使用 ziplist 编码：

1. 哈希对象保存的所有键值对中，键和值的字符串长度都小于 64 个字节；
2. 哈希对象保存的键值对数量小于 512 个。

ZipList可以转换到HashTable，一旦从ZipList转为了HashTable，Hash类型就会一直用HashTable进行保存而不会再转回ZipList了。

```c
void hashTypeConvert(robj *o, int enc) {
     // 原始编码是ZipList才进行转换
    if (o->encoding == OBJ_ENCODING_ZIPLIST) {
        hashTypeConvertZiplist(o, enc);
    } else if (o->encoding == OBJ_ENCODING_HT) {
        // 无法降级到ZipList
        serverPanic("Not implemented");
    } else {
        serverPanic("Unknown hash encoding");
    }
}
```

# ZipList编码的哈希对象

1. 普通的双向链表会有两个指针，在存储数据很小的情况下， 我们存储的实际数据的大小可能还没有指针占用的内存大，得不偿失 。
   ziplist是一个特殊的双向链表没有维护双向指针:prev next；而是存储上一个 entry的长度和 当前entry的长度，通过长度推算下一个元素在什么地方。
   牺牲读取的性能，获得高效的存储空间，因为(简短字符串的情况)存储指针比存储entry长度更费内存。这是典型的“时间换空间”。
2. 链表在内存中一般是不连续的，遍历相对比较慢，而ziplist可以很好的解决这个问题，普通数组的遍历是根据数组里存储的数据类型找到下一个元素的，但是ziplist的每个节点的长度是可以不一样的，而我们面对不同长度的节点又不可能直接sizeof(entry)，所以ziplist只好将一些必要的偏移量信息记录在了每一个节点里，使之能跳到上一个节点或下一个节点。
3. 头节点里有头节点里同时还有一个参数 len，和string类型提到的 SDS 类似，这里是用来记录链表长度的。因此 获取链表长度时不用再遍历整个链表,直接拿到len值就可以了，这个时间复杂度是 O(1)

ZipList的总体布局如下:  
因为压缩列表的操作中涉及到的位运算很多，如果不统一的话会出现混乱。后续的所有位运算都是在小端存储的基础上进行的

![redis_ziplist_结构](https://www.shiyitopo.tech/uPic/redis_ziplist_%E7%BB%93%E6%9E%84.png)

```shell
typedef struct zlentry {
    /**
     * 前一个节点大小
     */
    unsigned int prevrawlensize;
    /**
     * 前一个节点长度
     */
    unsigned int prevrawlen;
    /**
     * 当前节点大小
     */
    unsigned int lensize;
    /**
     * 当前节点长度
     */
    unsigned int len;
    /**
     * 当前节点头部信息长度
     */
    unsigned int headersize;   
    /**
     * 当前节点数据编码  ZIP_STR_* or ZIP_INT_*
     */
    unsigned char encoding;  
    /**
     * 指向节点的指针 
     */    
    unsigned char *p;
} zlentry;
```

# hashtable对象

hashtable 被称为字典（dictionary），它是一个数组+链表的结构.

哈希条目

```shell
typedef struct dictEntry {
    void *key;
    union {
        void *val;
        uint64_t u64;
        int64_t s64;
        double d;
    } v;
    struct dictEntry *next;
} dictEntry;
```

字典对象

```shell
typedef struct dict {
    dictType *type;
    void *privdata;
    dictht ht[2];
    long rehashidx; /* rehashing not in progress if rehashidx == -1 */
    unsigned long iterators; /* number of iterators currently running */
} dict;
```
