---
title: 在上Alpine Linux安装Adguard Home
date: 2021-12-19 15:48  
tags: [软路由]
---
---

title: '在上Alpine Linux安装Adguard Home'  
date: 2021-12-19 14:52:15  
tags: [软路由]  
published: true  
hideInList: false  
feature:  
isTop: false

---

由于没有Systemd, Adguard Home的官网的安装方法在Alpine Linux上无法工作。
然而，需要用OpenRC运行它非常简单。

1. 通过 `curl -s -S -L https://raw.githubusercontent.com/AdguardTeam/AdGuardHome/master/scripts/install.sh | sh -s -- -v` 进行安装
2. 编写命令  `vim /etc/init.d/AdguardHome`

   ```sh
   #!/sbin/openrc-run
   #
   # openrc service-script for AdGuardHome
   #
   # place in /etc/init.d/
   # start on boot: "rc-update add adguardhome"
   # control service: "service adguardhome <start|stop|restart|status|checkconfig>"
   #

   description="AdGuard Home: Network-level blocker"

   pidfile="/run/$RC_SVCNAME.pid"
   command="/opt/AdGuardHome/AdGuardHome"
   command_args="-s run"
   command_background=true

   extra_commands="checkconfig"

   depend() {
     need net
     provide dns
     after firewall
   }

   checkconfig() {
     "$command" --check-config || return 1
   }

   stop() {
     if [ "${RC_CMD}" = "restart" ] ; then
       checkconfig || return 1
     fi

     ebegin "Stopping $RC_SVCNAME"
     start-stop-daemon --stop --exec "$command" \
       --pidfile "$pidfile" --quiet
     eend $?
   }
   ```
3. 启动服务，并开启自启动

   `chmod +x /etc/init.d/AdguardHome`
   `rc-update add AdguardHome`
   `rc-service  AdguardHome start`
