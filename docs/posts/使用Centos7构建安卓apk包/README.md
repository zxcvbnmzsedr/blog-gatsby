---
title: 使用Centos7构建安卓apk包
date: 2022-04-21 15:48
permalink: /posts/%E4%BD%BF%E7%94%A8Centos7%E6%9E%84%E5%BB%BA%E5%AE%89%E5%8D%93apk%E5%8C%85
categories:
- posts
tags: 
---
# 使用Centos7构建安卓apk包

## 基础环境

```sh
yum install -y java-1.8.0-openjdk-devel.x86_64 wget unzip

# nodejs
curl --silent --location https://rpm.nodesource.com/setup_10.x | sudo bash -
yum install -y nodejs
curl --silent --location https://dl.yarnpkg.com/rpm/yarn.repo | sudo tee /etc/yum.repos.d/yarn.repo
sudo rpm --import https://dl.yarnpkg.com/rpm/pubkey.gpg
yum install -y yarn

# 文件数限制
cat >> /etc/sysctl.conf << EOF
fs.inotify.max_user_watches=524288
EOF
sysctl -p

```

## 安卓环境

```sh
cd /home
mkdir andoird
mkdir gradle

# 安装gradle
cd gradle
export gradle_version=6.7.1
wget https://downloads.gradle-dn.com/distributions/gradle-$gradle_version-bin.zip
unzip gradle-$gradle_version-bin.zip && rm -rf  gradle-$gradle_version-bin.zip
## 环境变量
cat >> /etc/profile.d/andoird.sh << EOF
export GRADLE_USER_HOME=/home/gradle/gradle-$gradle_version
export PATH=$PATH:$GRADLE_USER_HOME/bin
EOF
source /etc/profile
cd /home

# 安装安卓相关的类库
cd android
# 安装commandlinetools-linux
wget https://dl.google.com/android/repository/commandlinetools-linux-7583922_latest.zip
unzip commandlinetools-linux-7583922_latest.zip && rm -rf commandlinetools-linux-7583922_latest.zip
## 安装环境
sh cmdline-tools/bin/sdkmanager "platform-tools" "platforms;android-24" --sdk_root=/home/android/
cd /home
```
