---
title: 记:多线程中调用feign失败
date: 2022-01-08 15:48  
tags: []
---
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
