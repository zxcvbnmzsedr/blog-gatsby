---
title: Emby直链阿里云盘播放
date: 2022-07-05 12:48
permalink: /posts/Emby%E7%9B%B4%E9%93%BE%E9%98%BF%E9%87%8C%E4%BA%91%E7%9B%98%E6%92%AD%E6%94%BE
categories:
- posts
tags: 
---
之前用CloudFlare抢救了一下移动大内网的机器，解决了在外网查看的问题。

　　但是，由于国内宽带的上下行严重不对等，以致于无法在外头正常的播放家中的动辄十几个G的蓝光原盘，需要解决一下外网访问慢的问题。

　　目前我的做法是，通过emby视频源劫持到目录程序的对应文件的直链，从而实现不走家中NAS的流量，而体验和正常的emby别无二致。

　　这种方式唯一的弊端就是无法通过服务器端进行解码，当然1900的性能也支撑不了服务端解码。

# 环境

1. 用Alist连接阿里云盘，转成webdav协议
2. 使用Rclone 将webdav挂载到本地磁盘中
3. 会一丢丢docker

　　alist 连接阿里云盘比较简单，直接参考官网的教程即可，[https://alist-doc.nn.ci/](https://alist-doc.nn.ci/)

　　rclone 挂载，可以看之前我折腾的[《记录一次NAS系统崩溃》](/posts/记录一次NAS系统崩溃)

# 实现

　　用nginx 反向代理emby，将访问本地磁盘的路径，借助alist提供的API，转换成阿里云盘的直链。

　　具体的代码在: [https://github.com/zxcvbnmzsedr/docker_env/blob/master/emby/README.md](https://github.com/zxcvbnmzsedr/docker_env/blob/master/emby/README.md)

　　需要修改一下 nginx/conf.d/emby.js,将密码啥的给替换成自己的，然后用docker-compose up -d 启动即可。

　　

　　
