---
title: Linux WinOMV5 安装WebDAV服务
date: 2021-06-01 95:48  
tags: [软路由]
---
此安装方法通用于所有*unix系统、Windows系统。

在OMV5（openmediavault）中安装WebDAV服务器端的方法不同于旧版本。在OMV5之前的版本，可以直接在管理界面的“插件”中安装并启用WebDAV服务，但是新版本去除了此插件，需要手工进行安装。目前相关资料较为匮乏，网上的WebDAV镜像质量也参差不齐。

通过对比目前较为受欢迎的WebDAV服务器端软件，https://github.com/hacdias/webdav 较为稳定（唯一遗憾的是，此仓库作者提供的Docker镜像竟然在Docker Hub中排名非常靠后，以至于完全搜不到）。

此开源项目是使用GoLang开发的，因此兼容性非常强悍，仅作者预编译针对不同操作系统和CPU架构的二进制文件就有34种，可以说涵盖了几乎所有运行环境。

作者默认使用此软件的都是专业选手，因此没有手把手的文档可以参考。这对于非程序员甚至非GoLang程序员不太友好。

作者给出的配置参考已经非常详细，但需要注意的是，你需要全部复制并做出对应修改，程序中并没有做默认值合并。注释中的will be merged仅仅针对当前配置文件下文的用户默认值。

二进制安装
访问https://github.com/hacdias/webdav/releases/，对应下载作者预编译的二进制版本。

参考Systemd Example，注册为*unix服务，实现开机自动启动。此步骤有疑问的话，搜索对应操作系统+systemd关键词。

需要特别注意的是：

二进制文件所在的执行目录需要和Systemd配置文件中的ExecStart目录保持一致。
作者说明了支持JSON, YAML and TOML配置文件格式，因此你需要加上相应后缀，否则配置文件不生效。例如JSON添加.json、YAML添加.yml。
OMV5(Debian)中二进制文件安装例子：

```
wget https://github.com/hacdias/webdav/releases/download/v4.1.0/linux-amd64-webdav.tar.gz
tar -zxvf linux linux-amd64-webdav.tar.gz
vim /etc/systemd/system/webdav.service
webdav.service（注意确保路径/opt/webdav.config.yml下的配置文件已存在）:

[Unit]
Description=WebDAV server
After=network.target

[Service]
Type=simple
User=root
ExecStart=/usr/bin/webdav --config /opt/webdav.config.yml
Restart=on-failure

[Install]
WantedBy=multi-user.target
设置开机启动并启动服务：

systemctl enable webdav
systemctl start webdav
Docker安装
使用SSH连接后，执行命令：

docker run --restart always --name=webdav -itd \
-v /export:/data \
-v /opt/webdav.config.yml:/opt/webdav.config.yml \
-p 8081:80 \
hacdias/webdav:v4.1.0 --config /opt/webdav.config.yml

命令内容一目了然了，相应配置文件参考

# Server related settings
address: 0.0.0.0
port: 80
auth: true
tls: false
prefix: /

# Default user settings (will be merged)
scope: .
modify: true
rules: []

cors:
  enabled: false
  credentials: false

users:
  - username: admin
    password: "{bcrypt}$2a$12$xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
    scope: /data
```

scope即为根目录本地映射地址。password可以用明文，也可以加密，Bcrypt密码在线生成地址： https://bcrypt-generator.com/。

配置文件同样需要注意后缀问题。

关于内网穿透
为NAS搭建内网穿透有很多种方案。

针对SSL证书部署，可以采用：

直接在配置文件中设置tls为true并配置相应的SSL证书地址。
配置文件中保持tls为false，在FRP或其它内网穿透工具中配置HTTPS并加载相应证书。
配置文件中保持tls为false，在FRP或其它内网穿透工具中仅穿透TCP协议（可配置加密和压缩），在公网服务器（FRP或其它内网穿透工具所在的服务器）中配置Nginx反向代理搞定证书问题。
强烈推荐第三个方案，简单也安全。

关于Nginx反向代理的关键配置信息，此webdav服务端作者hacdias已经在README.md中注明。

请大家不要咨询在OMV中如何安装Docker或如何在Portainer中安装webdav之类的问题。此类问题太过于基础（例如后者，可以先进SSH直接执行命令，然后回到Portainer中看Container配置发生了什么变化）。

推荐大家使用Mountain Duck这样的工具挂载带有SSL证书的WebDAV地址，可以实现和OneDrive或Dropbox一样的智能同步功能（始终在此设备上保留、释放空间）。

from: https://www.joyk.com/dig/detail/1628887225532246
