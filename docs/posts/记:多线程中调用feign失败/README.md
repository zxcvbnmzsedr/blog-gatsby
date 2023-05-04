---
title: 记:多线程中调用feign失败
date: 2022-04-21 15:48
permalink: /posts/%E8%AE%B0:%E5%A4%9A%E7%BA%BF%E7%A8%8B%E4%B8%AD%E8%B0%83%E7%94%A8feign%E5%A4%B1%E8%B4%A5
categories:
- posts
tags: 
---
# 记:多线程中调用feign失败

在代码运行的时候，在第一次调用feign抛出异常

```
Could not find class [org.springframework.boot.autoconfigure.condition.OnPropertyCondition]
```

一查发现github上有个issus:  
[https://github.com/spring-cloud/spring-cloud-openfeign/issues/475](https://github.com/spring-cloud/spring-cloud-openfeign/issues/475)

目前暂无解决方案

目前只有启动时监听配置文件，让其能够主动先将feign初始化好，以免后续在调用的时候进行初始化

大佬的pr:  
[https://github.com/spring-cloud/spring-cloud-openfeign/pull/512](https://github.com/spring-cloud/spring-cloud-openfeign/pull/512)

但是，openfeign的作者认为这个并没有解决本质的问题，还是考虑在ForkjoinPool中以异步的方式初始化feignclient

不过，这个PR是目前，对代码侵入性最小的解决方案。
