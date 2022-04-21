---
title: 记录一次NAS系统崩溃
date: 2022-01-08 15:48  
tags: [软路由]
---
由于之前没有考虑到nas的强大，在不断的装docker之后，磁盘竟然满了，后面扩容就一不小心将扩展分区给删除了，虽然成功的扩容了磁盘，但只成功运行了几天，后面一次断点重启，就直接导致无法开机（grub的问题），因为里面就一些电影文件，所以索性心一横直接重装了系统。

我重新审视了一下我自己的需求，无非是影音文件的共享，顺带装个逼，又考虑到J3160这颗垃圾U着实撑不起场面，所以就抛弃了之前用OMV5装docker这种庞大臃肿的方案，能原生的就原生去装。

OMV5的插件比OMV4少了太多，原生插件堪称基类，基本上都是docker的方案来解决，既然如此，那么用OMV6其实并没有太大的区别，反正都没啥插件，还能体验新系统，所以就折腾起OMV6了。

再次记录一下装OMV6的过程。

使用ISO傻瓜式安装过程就不在此叙述了~~~~

## 安装完之后的问题

### 中文乱码

安装完，第一件要解决的就是中文乱码问题。

装完之后使用`local`e命令输出的编码是`zh_CN.UTF-8` 不知道为啥会导致ls 查看中文目录的时候乱码。

解决方案: 使用 `dpkg-reconfigure locales` 重新配置编码方式 为 `en_US.UTF-8`

### smb协议兼容问题

我用小米电视连接smb的时候，始终无法连接上，网上查询得知小米电视采用的是`SMB1.0`的协议 ,然后OMV6的需要手动修改一下SMB支持的最低版本

在图形化界面的SMB设置那里设置 `server min protocol = CORE`

![image-20220108225924680](https://www.shiyitopo.tech/uPic/image-20220108225924680.png)

## 需要安装的软件

这些软件原本我是采用docker进行安装，现在都改为原生安装

为了这颗破U，能省则省

### airconnect

目的为了能将苹果的音频投放到我的小爱音箱

从 https://github.com/philippe44/AirConnect 下载对应架构的 airupnp

我的是 airupnp-x86-64,

```shell
wget https://github.com/philippe44/AirConnect/raw/master/bin/airupnp-x86-64
mv airupnp-x86-64 /usr/bin/air
```

设置服务

```shell
vim /usr/lib/systemd/system/air.service	
## 写入
[Unit]
Description=air server
After=network.target

[Service]
Type=simple
User=root
ExecStart=/usr/bin/air  -Z
Restart=on-failure

[Install]
WantedBy=multi-user.target

## 执行
systemctl daemon-reload
systemctl start air
systemctl enable air
systemctl status air
```

### webdav

将smb转为更加通用的webdav协议

用的是https://github.com/hacdias/webdav，发现这个用go写的，最为轻量才几M

下载对应架构的webdav执行文件，放到/usr/bin目录下面

配置文件说明:

```shell
# 监听任意网卡，多网卡可指定对应ip
address: 0.0.0.0
port: 8081
auth: true
prefix: /

modify: true
rules: []

# 跨域设置
cors:
  enabled: true
  credentials: true
  allowed_headers:
    - Depth
  allowed_hosts:
    - http://localhost:8081
  allowed_methods:
    - GET
  exposed_headers:
    - Content-Length
    - Content-Range

# 用户信息，如果 auth 为 true 生效
users:
  - username: admin
    password: admin
    # 配置自己的硬盘路径
    scope: /srv/dev-disk-by-uuid-c78a92c0-7c20-4480-b997-1f88c9d0cd4d/
```

更多的就去找官网吧，我将这个文件保存为 /home/webdav/webdav.config.yml （个人习惯保存在home目录下）

将webdav 配置成服务

```shell
[Unit]
Description=WebDAV server
After=network.target

[Service]
Type=simple
User=root
ExecStart=/usr/bin/webdav --config /home/webdav/webdav.config.yml
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

```shell
systemctl daemon-reload
systemctl start webdav
systemctl enable webdav
systemctl status webdav
```

### 远程挂载webdav

因为有大佬将阿里云盘封装成webdav协议，所以我们可以通过挂载webdav的方式将阿里云盘作为我们的本地盘.

原本的挂载阿里云盘的服务使用docker部署的，着实太重，后面我就给迁移到了openwrt上面去了，就不在nas上进行挂载了，nas上只需要挂载阿里云盘的webdav服务即可，挂载教程 https://github.com/messense/aliyundrive-webdav

~~nas上挂载webdav的方法是采用davfs2~~

```shell
## 安装davfs2
 apt-get install davfs2 -y
 ## 挂载，自行修改webdav的ip 和 挂载路径
 mount  -t davfs -o noexec http://192.168.31.3:8080 /srv/dev-disk-by-uuid-c78a92c0-7c20-4480-b997-1f88c9d0cd4d/aliyun/
```

~~如果想要开机自动挂载 WebDAV，并且自动输入用户名和密码，需要将`/etc/davfs2/davfs2.conf` 中的 `use_lock` 解除注释，并将值修改为 `0`，接下来在 ` /etc/davfs2/secrets` 末尾添加 `WebDAV地址 用户名 密码`，最后在 `/etc/fstab` 末尾添加 `WebDAV地址 /mnt/webdav davfs rw,user,_netdev 0 0`。~~

使用过程中发现，davfs2挂载的时候会出现无法播放以及网络资源占用的莫名情况，故改为rclone挂载。

安装rclone:

```shell
curl https://rclone.org/install.sh | sudo bash
rclone
## 根据命令行给出的提示进行配置操作
```

修改`/etc/fuse.conf`,加上`user_allow_other` 表示允许非root用户可以登录

挂载文件的命令:

```shell
rclone mount ali:/ /srv/dev-disk-by-uuid-c78a92c0-7c20-4480-b997-1f88c9d0cd4d/aliyun --cache-dir /tmp --allow-other --vfs-cache-mode full --allow-non-empty  
```

注册成服务

```
command="mount ali:/ /srv/dev-disk-by-uuid-c78a92c0-7c20-4480-b997-1f88c9d0cd4d/aliyun --cache-dir /tmp --allow-other --vfs-cache-mode full --allow-non-empty"
cat > /etc/systemd/system/rclone.service <<EOF
[Unit]
Description=Rclone
After=network-online.target

[Service]
Type=simple
ExecStart=$(command -v rclone) ${command}
Restart=on-abort
User=root

[Install]
WantedBy=default.target
EOF
```

### 内网穿透

我发现国内某头部厂商基于`ngork`提供了一个不限速的内网穿透工具，为了它能存活的久一点，我就不透露它的名字了。

因为是基于`ngork`，使用`nohup`无法使其在后台运行，使用`screen`能够后台运行但是无法开机启动，因此我们需要安装`supervisord`来控制进程的启动

安装: supervisor

```shell
apt-cache show supervisor
apt install supervisor
supervisord -v
```

设置启动服务

```shell
vi /etc/supervisor/conf.d/ngrok.conf

# 项目名称，对应前面supervisorctl命令里的服务名称
[program:ngrok] 
# 目录
directory = /usr/local/bin/
# 执行的命令
command = /usr/local/bin/ngrok http -log stdout --authtoken yourtoken 192.168.0.200:4000
# 在 supervisord 启动的时候也自动启动
autostart = true
# 启动 5 秒后没有异常退出，就当作已经正常启动了
startsecs = 5
# 程序异常退出后自动重启
autorestart = true
# 启动失败自动重试次数，默认是 3
startretries = 3
# 执行命令的用户
user = root
# 把 stderr 重定向到 stdout，默认 false
redirect_stderr = true
# stdout 日志文件大小，默认 50MB
stdout_logfile_maxbytes = 50MB
# stdout 日志文件备份数
stdout_logfile_backups = 20
# stdout 日志文件
stdout_logfile = /var/log/supervisor/ngrok.log
```

运行:

```shell
# 加载 ngrok 服务
supervisorctl start ngrok
```

### zidr 管理文件

这也是一个神器

nginx配置，直接使用omv的php 的socket进行通讯:

```nginx
server {
      listen 80;
      server_name zidr;
      index zdir/index.php index.html index.htm index.php;
      root /data/wwwroot/default;
      access_log /var/log/zdir.log combined;
      #rewrite
      rewrite ^/static/(.+) /zdir/static/$1 break;
     
      #error_page 404 /404.html;
      #error_page 502 /502.html;

      location ~ [^/]\.php(/|$) {
        fastcgi_split_path_info ^(.+\.php)(/.+)$;
        fastcgi_pass unix:/run/php/php7.4-fpm-openmediavault-webgui.sock;
        fastcgi_index index.php;
        fastcgi_read_timeout 60s;
        include fastcgi.conf;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
      }

      location ~ .*\.(gif|jpg|jpeg|png|bmp|swf|flv|mp4|ico)$ {
        expires 30d;
        access_log off;
      }
      location ~ .*\.(js|css)?$ {
        expires 7d;
        access_log off;
      }
      location ~ /\.ht {
        deny all;
      }
    }
```

创建路径:

```shell
mkdir -p  /data/wwwroot/default && cd /data/wwwroot/default
git clone https://github.com/helloxz/zdir.git
## 将目录软连接到这里
ln -s /srv/dev dev
```
