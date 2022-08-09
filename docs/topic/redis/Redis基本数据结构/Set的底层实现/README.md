---
title: Set的底层实现
date: 2022-04-28 14:17
permalink: /topic/redis/Redis%E5%9F%BA%E6%9C%AC%E6%95%B0%E6%8D%AE%E7%BB%93%E6%9E%84/Set%E7%9A%84%E5%BA%95%E5%B1%82%E5%AE%9E%E7%8E%B0
topic: 
  - topic
tags: null
categories: 
  - topic
  - redis
  - Redis基本数据结构
  - Set的底层实现
---
　　Redis用intset或hashtable存储set。

　　如果元素都是整数类型，就用intset存储。

　　如果不是整数类型，就用hashtable（数组+链表的存来储结构）。key就是元素的值，value为null。
