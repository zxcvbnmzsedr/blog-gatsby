---
title: 每个程序员都应该知道的延迟数字
date: 2022-05-24 19:41
permalink: /topic/%E7%B3%BB%E7%BB%9F%E8%AE%BE%E8%AE%A1/%E6%AF%8F%E4%B8%AA%E7%A8%8B%E5%BA%8F%E5%91%98%E9%83%BD%E5%BA%94%E8%AF%A5%E7%9F%A5%E9%81%93%E7%9A%84%E5%BB%B6%E8%BF%9F%E6%95%B0%E5%AD%97
topic: 
  - topic
tags: null
categories: 
  - topic
  - 系统设计
  - 每个程序员都应该知道的延迟数字
---
# 每个程序员都应该知道的延迟数字

在一些情况下对系统设计的时候，需要做出对系统性能的保守估计。

Jeff Dean （谷歌的巨佬，分布式系统的奠基人）在[分布式系统的PPT](https://link.zhihu.com/?target=https%3A//www.cs.cornell.edu/projects/ladis2009/talks/dean-keynote-ladis2009.pdf)中列出了"Latency Numbers Every Programmer Should Know"(每个程序员都应该了解的数字)，对计算机中的各类的操作的耗时做了大致的估计。

|操作|延迟|
| -----------------------------------| --------------------------|
|执行一个指令|1 ns|
|L1 缓存查询|0.5 ns|
|分支预测错误（Branch mispredict）|3 ns|
|L2 缓存查询|4 ns|
|互斥锁/解锁|17 ns|
|在 1Gbps 的网络上发送 2KB|44 ns|
|主存访问|100 ns|
|Zippy 压缩 1KB|2,000 ns|
|从内存顺序读取 1 MB|3,000 ns|
|SSD 随机读|16,000 ns|
|从 SSD 顺序读取 1 MB|49,000 ns|
|同一个数据中心往返|500,000 ns|
|从磁盘顺序读取 1 MB|825,000 ns|
|磁盘寻址|2,000,000 ns (2 ms)|
|从美国发送到欧洲的数据包|150,000,000 ns（150 ms）|

基于上述数字的指标：

* 从磁盘以 30 MB/s 的速度顺序读取
* 以 100 MB/s 从 1 Gbps 的以太网顺序读取
* 从 SSD 以 1 GB/s 的速度读取
* 以 4 GB/s 的速度从主存读取
* 每秒能绕地球 6-7 圈
* 数据中心内每秒有 2,000 次往返

Jeff Dean给出这些数字的重点是在于了解这些操作之间的数量级和比例，而不是具体的数字。

因为计算机会随着科技的发展，变得越来越快。

伯克利大学有个[动态网页](https://colin-scott.github.io/personal_website/research/interactive_latency.html)，可以查看每年各个操作耗时的变化

![](https://image.ztianzeng.com/uPic/20220524195143.png)
