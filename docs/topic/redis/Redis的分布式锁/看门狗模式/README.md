---
title: 看门狗模式
date: 2022-04-28 14:17
permalink: /topic/redis/Redis%E7%9A%84%E5%88%86%E5%B8%83%E5%BC%8F%E9%94%81/%E7%9C%8B%E9%97%A8%E7%8B%97%E6%A8%A1%E5%BC%8F
topic: 
  - topic
tags: null
categories: 
  - topic
  - redis
  - Redis的分布式锁
  - 看门狗模式
---
# 看门狗模式

![img](https://www.shiyitopo.tech/uPic/e0ecde8897f3a08baed00866f0c6525dd539ecaa.png@942w_593h_progressive.webp)

看门狗的工作模式如上图所示。

本质就是当某个线程获取到锁之后，在业务结束之前，需要定时对目标所的过期时间持续延期，以此来确保解锁的时候业务状态是正确的。
