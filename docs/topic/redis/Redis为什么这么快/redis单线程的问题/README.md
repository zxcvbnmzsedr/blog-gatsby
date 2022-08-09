---
title: redis单线程的问题
date: 2022-04-28 14:17
permalink: /topic/redis/Redis%E4%B8%BA%E4%BB%80%E4%B9%88%E8%BF%99%E4%B9%88%E5%BF%AB/redis%E5%8D%95%E7%BA%BF%E7%A8%8B%E7%9A%84%E9%97%AE%E9%A2%98
topic: 
  - topic
tags: null
categories: 
  - topic
  - redis
  - Redis为什么这么快
  - redis单线程的问题
---
　　正常情况下使用del指令可以很快的删除数据，
而当被删除的 key 是一个非常大的对象时，
例如时包含了成千上万个元素的 hash 集合时，
那么 del 指令就会造成 Redis 主线程卡顿。

　　在高并发下面，redis的表现就是其他客户端请求无响应。
