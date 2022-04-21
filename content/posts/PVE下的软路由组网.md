---
title: PVE下的软路由组网
date: 2022-04-21 16:12  
tags: [软路由]
---
从最开始折腾iKuai+OpenWrt到单Openwrt，到最后使用PVE搭建路由环境，前后将近快一年的时间。

经历过频繁的断网，断流，死机，已经摸索出一套相对稳定的方案。

## 软路由

我对软路由的需求有三个:

1. 分流设备，全局翻墙
2. DNS去广告
3. 局域网存储用于播放内网视频

基于这些需求，我选择了J3160作为软路由的硬件配置。

硬件:

+ J3160 + 4G内存 + 32G固态 + 500G机械
+ 小米A3600做的AP

网络拓扑图如下:

![软路由](https://www.shiyitopo.tech/uPic/%E8%BD%AF%E8%B7%AF%E7%94%B1.png)

## PVE系统

为了在折腾其他比如NAS，DNS的时候，依然能够保证网络的畅通，所以选用了PVE来当做底层系统，这样即使路由挂了，依然能够通过网页访问PVE中的各种系统。

### 接口

我买的提供了4个网口，Lan 3口接入光猫，Lan1口接入路由。

![image-20211221165148379](https://www.shiyitopo.tech/uPic/image-20211221165148379.png)

## PVE中安装的系统

### Lede

lede作为主路由，承担了拨号、科学上网的职责。

固件是自己编译的:  https://github.com/zxcvbnmzsedr/Actions-OpenWrt-Template

为了运行的稳定，只保留了相对基础的功能，以及 `OpenClash`、`Zerotier`、`Ipv6`

### AdguardHome

直接通过PVE的LXC容器的alpine系统安装，最简化配置。

分离DNS是由于OpenClash和DNS的依赖性太强了，而且AdguardHome和OpenClash共存方案都不够优雅，就直接分离了。

注意事项参考: https://www.ztianzeng.com/post/zai-shang-alpine-linux-an-zhuang-adguard-home/

### openmediavault

采用OMV作为NAS的原因是它的资源远比群晖的低，且开源。

## 硬路由

硬路由就是普通的家用路由。

作用就两个:

1. 作为小型交换机，扩展LAN口
2. 提供wifi信号

唯一需要注意的是，在设置路由的时候，将路由模式设置成桥接模式，这样对于硬路由而言它不再提供上网服务，只是作为流量的中间站，流量全会交给软路由进行处理。

![image-20211221171438933](https://www.shiyitopo.tech/uPic/image-20211221171438933.png)

PS: 光猫需要改桥接，以获得最佳性能。
