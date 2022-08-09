---
title: 系统设计
date: 2022-05-23 14:28
permalink: /topic/%E7%B3%BB%E7%BB%9F%E8%AE%BE%E8%AE%A1
topic: 
  - topic
tags: null
categories: 
  - topic
  - 系统设计
---
![](https://image.ztianzeng.com/uPic/20220614171025.png)

　　 在面试中遇到系统设计的问题，大多数的时候都会回答不全，或者回答的答案和面试官想要的大相径庭。

　　就比如，设计一个*1000QPS*的秒杀系统啥Redis、MQ统统网上怼，系统都能扛得住数万QPS，明显看上去是背答案的。

　　关于系统设计github上面有个非常好的repo: [https://github.com/donnemartin/system-design-primer](https://github.com/donnemartin/system-design-primer)

　　上面详细的提到了如何设计一个合理的系统 ,总共分为4个步骤:

> 这4个步骤也被称之为4s分析法
>

1. 描述使用场景，约束和假设（**S**cenario）

    明确这个系统的使用场景以及预估所能承载的容量（QPS、DAU、Features）

    * 谁会使用它？
    * 他们会怎样使用它？
    * 有多少用户？
    * 系统的作用是什么？
    * 系统的输入输出分别是什么？
    * 我们希望处理多少数据？
    * 我们希望每秒钟处理多少请求？
    * 我们希望的读写比率？
2. 拆分不同的服务，并且对其进行设计（**S**ervice）

    使用所有重要的组件来描绘出一个高层级的设计。（Split 、Application 、Module）

    对每一个核心组件进行详细深入的分析。

    * 画出主要的组件和连接
    * 证明你的想法
3. 设计服务对应的存储逻辑（**S**torage）

    数据最终需要进行持久化存储，需要选择不同的存储中间件，来衡量其不同的设计。（SQL、NoSQL、File System）
4. 扩展设计（**S**cala）

    确认和处理瓶颈以及一些限制。（Sharding、Optimize、Special Case）

    * 负载均衡
    * 水平扩展
    * 缓存

　　通过上面这4个步骤，就能大体设计出来一个相对完备的系统。

　　
