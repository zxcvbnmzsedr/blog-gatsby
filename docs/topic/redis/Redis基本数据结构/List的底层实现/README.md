---
title: List的底层实现
date: 2022-04-28 14:17
permalink: /topic/redis/Redis%E5%9F%BA%E6%9C%AC%E6%95%B0%E6%8D%AE%E7%BB%93%E6%9E%84/List%E7%9A%84%E5%BA%95%E5%B1%82%E5%AE%9E%E7%8E%B0
topic: 
  - topic
tags: null
categories: 
  - topic
  - redis
  - Redis基本数据结构
  - List的底层实现
---
# List的底层实现

List的底层采用quickList进行编码。

QuickList是ZipList和LinkList的混合体.

它将 linkedList按段切分，每一段使用 zipList 来紧凑存储，多个 zipList 之间使用双向指针串接起来。

![结构](https://www.shiyitopo.tech/uPic/redis_quicklist_%E7%BB%93%E6%9E%84.jpg)
