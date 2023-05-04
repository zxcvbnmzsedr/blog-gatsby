---
title: ZSet的底层实现
date: 2022-04-28 14:17
permalink: /topic/redis/Redis%E5%9F%BA%E6%9C%AC%E6%95%B0%E6%8D%AE%E7%BB%93%E6%9E%84/ZSet%E7%9A%84%E5%BA%95%E5%B1%82%E5%AE%9E%E7%8E%B0
topic: 
  - topic
tags: null
categories: 
  - topic
  - redis
  - Redis基本数据结构
  - ZSet的底层实现
---
# ZSet的底层实现

当有序集合中包含的元素数量超过服务器属性

zset_max_ziplist_entries 的值（默认值为 128 ），

或者 有序集合中新添加元素的 member 的长度大于服务器属性

zset_max_ziplist_value 的值（默认值为 64 ）时，

redis会使用 跳跃表 作为有序集合的底层实现。

否则会使用ziplist作为有序集合的底层实现

# 跳表是什么?

跳表 = 链表 + 多级索引.

skiplist是一种以空间换取时间的结构。 时间复杂度O(logN),空间复杂度O(n);

由于链表，无法进行二分查找，因此借鉴数据库索引的思想，提取出链表中关键节点（索引），先在关键节点上查找，再进入下层链表查找。

提取多层关键节点，就形成了跳跃表.

## 优缺点

只有在 数据量较大的情况下 才能体现出来优势。
而且应该是 读多写少的情况下 才能使用，所以它的适用范围应该还是比较有限的

维护成本相对要高, 新增或者删除时需要把所有索引都更新一遍；

最后在新增和删除的过程中的更新，时间复杂度也是O(log n)

![跳表](../img/redis_jump.jpg)
