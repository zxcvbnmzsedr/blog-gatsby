---
title: Gatsby4.0升级
date: 2022-05-20 14:25
permalink: /posts/Gatsby4.0%E5%8D%87%E7%BA%A7
categories:
- posts
tags: 
---
# Gatsby4.0升级

Gastby发布了4.0的版本，引入了巨大的性能改进。

最大的特点是最多减少40%的构建时间和两个新的渲染选项:延迟静态生成和服务端渲染。

# 处理旧的依赖

在升级到V4版本之前，最好将所有的插件都升级到V3版本，这样可以竟可能避免出现问题。

> 可以通过`npm outdated` 或者 `yarn upgrade-interactive`来自动升级到v3的版本

升级好之后，运行`yarn buld`看看有没有什么问题，出现啥问题修复啥问题。

# 安装最新的Gatsby版本

直接通过命令安装最快乐。

```java
 yarn add gatsby@latest
```

运行玩之后，使用`yarn build` 如果没有出现大问题的话，则升级成功

# 更新插件

在升级完成之后，启动时会出现很多warning比如下面这样:

```shell
warn Plugin gatsby-plugin-react-helmet is not compatible with your gatsby version 4.14.1 - It requires gatsby@^3.0.0-next.0
warn Plugin gatsby-plugin-sitemap is not compatible with your gatsby version 4.14.1 - It requires gatsby@^3.0.0-next.0
```

需要根据warning挨个升级依赖。

如果社区版的插件没有升级到最新，就没有办法了，只有等待社区更新。不过大部分情况下都不影响使用。

## 遇到的问题

目前我的博客只遇到了一个问题，id冲突。

在调用`createNode`的时候，之前的版本会将后创建id相同的话不会覆盖，新版本则会覆盖。

另外一个问题是，如果删除了`yarn.lock`会导致无法启动成功，因为对npm的依赖机制不是很了解，所以暂时先将`yarn.lock`进行上传跳过这个问题。

它会抛出一个`@parcel/source-map not found`的异常，是`@parcel/utils`中引用的，大概是版本可能有所偏差。
