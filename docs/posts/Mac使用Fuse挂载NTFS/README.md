---
title: Mac使用Fuse挂载NTFS
date: 2022-04-21 15:48
permalink: /posts/Mac%E4%BD%BF%E7%94%A8Fuse%E6%8C%82%E8%BD%BDNTFS
categories:
- posts
tags: 
---
## 步骤

1. 安装Fuse和nefs-3g
   ```shell
   brew install --cask macfuse
   brew install gromgit/fuse/ntfs-3g
   ```
2. 获取相关参数

```shell
id  ## 获取当前mac登录用户的id和gid，替换下面的参数
df -h ## 获取外挂盘的盘符，可以根据磁盘大小来推测，我的盘符是/dev/disk2s1
```

3. 挂载

```shell
cd ~
mkdir disk
sudo ntfs-3g -o uid={uid},gid={gid},dmask=022,fmask=133 -o auto_xattr /dev/disk2s1 ~/disk 
```
