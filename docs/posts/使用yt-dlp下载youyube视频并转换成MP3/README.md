---
title: 使用yt-dlp下载youyube视频并转换成MP3
date: 2022-04-21 15:48
permalink: /posts/%E4%BD%BF%E7%94%A8yt-dlp%E4%B8%8B%E8%BD%BDyouyube%E8%A7%86%E9%A2%91%E5%B9%B6%E8%BD%AC%E6%8D%A2%E6%88%90MP3
categories:
- posts
tags: 
---
yt-dlp是从youtube-dl中fork出来的一个分支，担负着继续维护的重任。
yt-dlp继承了youtube-dl所有的命令，并且还修复了youtube-dl下载速度过慢的bug。

　　本文介绍了如何使用yt-dlp，将youtube的视频转化为mp3.

　　项目github页面: https://github.com/yt-dlp/yt-dlp

## 基本环境

　　在mac下，只需要brew命令，即可完成安装

```shell
# 安装基本命令
brew install yt-dlp
# 安装转码器
brew install ffmpeg
# 安装多线程下载工具
brew install aria2
```

## 下载命令

```shell
yt-dlp --ignore-errors  --output "%(title)s.%(ext)s" --audio-quality 160K --extract-audio  --audio-format mp3 --proxy 127.0.0.1:6152  --cookies cookies.txt --external-downloader aria2c --external-downloader-args "-x 4" --playlist-start 94 --yes-playlist ''
```

　　命令说明：

+ --ignore-errors 如果发生错误，请继续下载。例如，跳过已删除的播放列表中的视频或跳过您所在国家/地区不可用的视频。
+ --proxy 使用代理进行下载
+ --cookies cookies.txt 保存cookie到文件，在有些私人网站上下载非常游泳
+ --external-downloader aria2c 指定下载器为aria2c
+ --external-downloader-args "-x 4" 指定aria2c 使用4个线程进行下载
+ --format bestaudio 下载可用的最佳音频质量格式
+ --extract-audio 从视频中提取音频
+ --audio-format mp3 指定音频格式-在这种情况下为mp3
+ --audio-quality 160K 指定在这种情况下转换为mp3时ffmpeg / avconv使用的音频质量。
+ --output "%(title)s.%(ext)s" 代表 输出文件名模板
+ --playlist-start 94 从播放列表的第94个开始下载，默认为1
+ --yes-playlist 即使URL指向视频和播放列表，也要下载整个播放列表。
+ '' 是要下载的YouTube播放列表的URL。
