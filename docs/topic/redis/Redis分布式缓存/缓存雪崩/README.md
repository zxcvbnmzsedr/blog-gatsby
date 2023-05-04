---
title: 缓存雪崩
date: 2022-04-28 14:17
permalink: /topic/redis/Redis%E5%88%86%E5%B8%83%E5%BC%8F%E7%BC%93%E5%AD%98/%E7%BC%93%E5%AD%98%E9%9B%AA%E5%B4%A9
topic: 
  - topic
tags: null
categories: 
  - topic
  - redis
  - Redis分布式缓存
  - 缓存雪崩
---
# 缓存雪崩

当某一个时刻出现大规模的缓存失效，那么就会导致大量的请求打在数据库上面，导致数据库压力巨大，如果在高并发的情况下，可能瞬间就导致数据库党纪。

如果这个时候，马上重启数据库，马上又会有新的流量把数据库打死。

![Xnip2021-09-16_16-10-29](https://www.shiyitopo.tech/uPic/Xnip2021-09-16_16-10-29.jpg)

造成缓存大规模失效的原因：

1. Redis宕机
2. 大量的热点Key在相同的时间过期

# 解决方案

## 三步骤

- 事前：redis高可用部署，避免全盘崩溃；
- 事中：本地缓存 + 限流降级，避免数据库被打死；
- 事后：redis持久化，快速恢复缓存数据；

+ Redis集群高可用
  + 主从+哨兵
  + Redis Cluster
+ Redis开启AOF/RDB，尽快恢复redis访问
+ 热点key随机过期时间
  + 避免在同一个时间，请求涌入数据库
+ 提高数据库的容灾能力
  + 分库分表
  + 读写分离
+ 熔断限流降级
  + Hystrix
  + 阿里sentinel
