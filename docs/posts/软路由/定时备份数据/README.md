---
title: 定时备份数据
date: 2022-04-21 15:48
permalink: /posts/%E8%BD%AF%E8%B7%AF%E7%94%B1/%E5%AE%9A%E6%97%B6%E5%A4%87%E4%BB%BD%E6%95%B0%E6%8D%AE
categories:
- posts
tags: 
---
　　为了防止硬盘的损坏，因此需要定时将数据同步到阿里云盘中。。。。

　　通过 rclone 命令将定时任务挂载到阿里云盘中。

　　在配置 rclone 的时候，如果是 webdav 一定要选择 webdav，而不能选择 http，如果选择了 http 协议在挂载和读取的过程中没有任何问题，但是在上传文件的时候会爆出权限异常，`http remotes are read only`

　　rclone 同步的命令是:

```shell
# transfers 指定同时上传数量
rclone sync /home ali:/omv/back/home --transfers=8 -P
```

　　将 rclone 配置成服务:

```shell
vim /etc/systemd/system/backup.service

[Unit]
Description=backup
After=network.target

[Service]
Type=oneshot
User=root
ExecStart=/usr/bin/rclone sync /home ali:/omv/back/home --transfers=8 -P
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

　　将 rclone 配置成定时任务:

```shell
vim /etc/systemd/system/backup.timer

[Unit]
Description=backUp Timer

[Timer]
OnUnitActiveSec=1h
Unit=backup.service

[Install]
WantedBy=multi-user.target
```

　　之后只需要开启定时任务即可:

```shell
systemctl daemon-reload
systemctl enable backup.timer
systemctl start backup.timer
```

　　如果不放心，手动启动一遍看有没有错:

```shell
systemctl start backup
# 查看状态
systemctl status backup
# 连续打印日志
journalctl -u backup -n 20 -f
```
