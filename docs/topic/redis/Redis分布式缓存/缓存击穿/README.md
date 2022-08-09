---
title: 缓存击穿
date: 2022-04-28 14:17
permalink: /topic/redis/Redis%E5%88%86%E5%B8%83%E5%BC%8F%E7%BC%93%E5%AD%98/%E7%BC%93%E5%AD%98%E5%87%BB%E7%A9%BF
topic: 
  - topic
tags: null
categories: 
  - topic
  - redis
  - Redis分布式缓存
  - 缓存击穿
---
　　大量的请求同时查询一个key时，假设此时，这个key正好失效了，就会导致大量的请求都打到数据库上面去。

　　缓存击穿和缓存雪崩有点像，但是又有一点不一样，缓存雪崩是因为大面积的缓存失效，打崩了DB。

　　而缓存击穿不同的是缓存击穿是指一个Key非常热点，在不停的扛着大并发，大并发集中对这一个点进行访问，当这个Key在失效的瞬间，持续的大并发就穿破缓存，直接请求数据库。

# 解决方案

## 不过期

　　我们简单粗暴点，直接让热点数据永远不过期，定时任务定期去刷新数据就可以了。不过这样设置需要区分场景，比如某宝首页可以这么做

## 互斥锁

　　为了避免出现缓存击穿的情况，我们可以在第一个请求去查询数据库的时候对他加一个互斥锁，其余的查询请求都会被阻塞住，直到锁被释放，后面的线程进来发现已经有缓存了，就直接走缓存，从而保护数据库。但是也是由于它会阻塞其他的线程，此时系统吞吐量会下降。需要结合实际的业务去考虑是否要这么做。

```java
public class Test {
    public String get(String key) {
        //查询缓存
        String value = redis.get(key);
        if (value != null) {
            //缓存存在直接返回
            return value;
        } else {
            //缓存不存在则对方法加锁
            //假设请求量很大，缓存过期
            synchronized (Test.class) {
                //再查一遍redis
                value = redis.get(key);
                if (value != null) {
                    // 查到数据直接返回
                    return value;
                } else {
                    // 二次查询缓存也不存在，直接查DB
                    value = dao.get(key);
                    // 数据缓存
                    redis.setnx(key, value, time);
                    //返回
                    return value;
                }
            }
        }
    }
}
```
