---
title: Jenkins容器安装python3环境
date: 2022-04-21 15:48
permalink: /posts/Jenkins%E5%AE%B9%E5%99%A8%E5%AE%89%E8%A3%85python3%E7%8E%AF%E5%A2%83
categories:
- posts
tags: 
---
# Jenkins容器安装python3环境

在docker环境中安装jenkins，jenkins的构建环境是docker中的环境，默认的docker中默认只有python2而没有python3，因此需要再docker中手动装python3

# 进入jenkins容器

docker exec -it -u root 容器id /bin/bash

# 容器内部安装python3

## 下载python3安装包

```
cd /var/jenkins_home/
mkdir python3 && cd python3
wget https://www.python.org/ftp/python/3.6.8/Python-3.6.8.tgz
tar -xvf Python-3.6.8.tgz
cd Python-3.6.8
./configure --prefix=/var/jenkins_home/python3
```

如果执行后报错 configure: error: no acceptable C compiler found in $PATH 则是因为缺少gcc相关的依赖包

## 安装依赖包

自行根据docker的系统镜像选用apt-get 或者 yum 进行安装

```
yum -y install gcc automake autoconf libtool make
yum -y install make*
yum -y install zlib*
yum -y install openssl libssl-dev
yum install sudo
```

## make 编译

在python-3.6.8这个目录下重新执行安装

```
./configure --prefix=/var/jenkins_home/python3 --with-ssl
make
make install
```

## 添加软连接

```
ln -s /var/jenkins_home/python3/bin/python3.6 /usr/bin/python3
ln -s /var/jenkins_home/python3/bin/pip3 /usr/bin/pip3
```

## 检查是否安装成功

```
pip3
python3
```
