---
title: Redis数据淘汰策略
date: 2022-04-28 14:17
permalink: /topic/redis/Redis%E9%9B%86%E7%BE%A4/Redis%E6%95%B0%E6%8D%AE%E6%B7%98%E6%B1%B0%E7%AD%96%E7%95%A5
topic: 
  - topic
tags: null
categories: 
  - topic
  - redis
  - Redis集群
  - Redis数据淘汰策略
---
Redis将数据存储在内存中，但是内存有限，当存储的数据超过内存容量时，需要对缓存的数据进行剔除。

　　淘汰算法一般有以下几种

+ FIFO: 淘汰最早数据
+ LRU: 剔除最近最少使用
+ LFU: 剔除最近使用频率最低的数据

## Redis的内存淘汰策略，有以下几种

+ **noeviction:** (默认策略) 返回错误。当内存达到限制，客户端尝试执行的命令（大部分的写入指令，但DEL和几个例外）
+ **allkeys-lru:** 尝试回收最少使用的键（LRU）（适用所有缓存数据，不管是否设置过期时间）
+ **volatile-lru:** 尝试回收最少使用的键（LRU），（仅限于在过期集合的键）。
+ **allkeys-random:** 随机回收数据（适用所有缓存数据，不管是否设置过期时间）
+ **volatile-random:** 随机回收数据（仅限于在过期集合的键）。
+ **volatile-ttl:** 回收在过期集合的键，并且优先回收存活时间（TTL）较短的键。

## 数据库中有 3000w 的数据，而 Redis 中只有 100w 数据，如何保证 Redis 中存放的都是热点数据

　　这个题你说它的考点是什么？

　　考的就是淘汰策略呀，同志们，只是方式比较隐晦而已。

　　我们先指定淘汰策略为 allkeys-lru 或者 volatile-lru，然后再计算一下 100w 数据大概占用多少内存，根据算出来的内存，限定 Redis 占用的内存。
