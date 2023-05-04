---
title: Squid运行调试命令及日志状态分析
date: 2022-06-27 13:57
permalink: /posts/Squid%E8%BF%90%E8%A1%8C%E8%B0%83%E8%AF%95%E5%91%BD%E4%BB%A4%E5%8F%8A%E6%97%A5%E5%BF%97%E7%8A%B6%E6%80%81%E5%88%86%E6%9E%90
categories:
- posts
tags: 
---
# Squid运行调试命令及日志状态分析

当你的 squid.conf 配置文档按照你的想法修改完以后，启动 squid 之旅就开始了。

# Squid安装调试命令:

1. 初始化你在 squid.conf 里配置的 cache 目录

    /usr/local/squid/sbin/squid -z //初始化缓存空间

    或者，手动初始化

2. 对你的squid.conf 排错，即验证 squid.conf 的 语法和配置。  
    #/usr/local/squid/sbin/squid -k parse  
    如果squid.conf 有语法或配置错误，这里会返回提示你，如果没有返回，恭喜，可以尝试启动squid。

3. 在前台启动squid，并输出启动过程。  
    #/usr/local/squid/sbin/squid -N -d1  
    如果有到 ready to server reques，恭喜，启动成功。  
    然后 ctrl + c，停止squid，并以后台运行的方式启动它。

4. 启动squid在后台运行。  
    #/usr/local/squid/sbin/squid -s  
    这时候可以 ps -A 来查看系统进程，可以看到俩个 squid 进程。

5. 停止 squid  
    #/usr/local/squid/sbin/squid -k shutdown  
    这个不用解释吧。

6. 重引导修改过的 squid.conf  
    #/usr/local/squid/sbin/squid -k reconfigure //载入新的配置文件  
    这个估计用的时候比较多，当你发现你的配置有不尽你意的时候，可以随时修改squid.conf，然后别忘记对你的 squid.conf排错，然后再执行此指令，即可让squid重新按照你的 squid.conf 来运行。

7. /usr/local/squid/sbin/squid -k rotate 轮循日志

8. 修改cache 缓存目录的权限。  
    #chown -R squid:squid /data/cache  
    我的cache缓存目录是 /data/cache,squid执行用户和用户组是 squid，squid。
9. 修改squid 日志目录的权限

    #chown -R squid:squid /usr/local/squid/var/logs  
    这一步并不是适合每一个使用squid的用户.意为让squid有权限在该目录进行写操作 。  
    例如生成 access.log cache.log store.log

# squid命中率分析

/usr/local/squid/bin/squidclient -p 80 mgr:info  
/usr/local/squid/bin/squidclient -p 80 mgr:5min  
可以看到详细的性能情况,其中PORT是你的proxy的端口，5min可以是60min

* 取得squid运行状态信息： squidclient -p 80 mgr:info
* 取得squid内存使用情况： squidclient -p 80 mgr:mem
* 取得squid已经缓存的列表： squidclient -p 80 mgrbjects. use it carefully,it may crash
* 取得squid的磁盘使用情况： squidclient -p 80 mgr:diskd
* 强制更新某个url：squidclient -p 80 -m PURGE [http://www.xxx.com/xxx.php](http://www.yejr.com/static.php)

查命中率：  
/usr/local/squid/bin/squidclient -h 111.222.111.111 -p80 mgr:info

/usr/local/squid/bin/squidclient -h具体的IP -p80 mgr:info

‍

如果看到很多的TCP_MEM_HIT ，这表明该文件是从内存缓存读取的，squid已经起作用了！你再用浏览器打开该文件，应该是快如闪电了。。呵呵，大功告成了！还有其他类型的HIT，如TCP_HIT等等，这些是从磁盘读取的，我觉得加速的意义不大，只不过缓解了apache的压力而已。

相应于HTTP请求，下列标签可能出现在access.log文件的第四个域。

**TCP_HIT**

Squid发现请求资源的貌似新鲜的拷贝，并将其立即发送到客户端。

**TCP_MISS**

Squid没有请求资源的cache拷贝。

**TCP_REFERSH_HIT**

Squid发现请求资源的貌似陈旧的拷贝，并发送确认请求到原始服务器。原始服务器返回304（未修改）响应，指示squid的拷贝仍旧是新鲜的。

**TCP_REF_FAIL_HIT**

Squid发现请求资源的貌似陈旧的拷贝，并发送确认请求到原始服务器。然而，原始服务器响应失败，或者返回的响应Squid不能理解。在此情形下，squid发送现有cache拷贝（很可能是陈旧的）到客户端。

**TCP_REFRESH_MISS**

Squid发现请求资源的貌似陈旧的拷贝，并发送确认请求到原始服务器。原始服务器响应新的内容，指示这个cache拷贝确实是陈旧的。

**TCP_CLIENT_REFRESH_MISS**

Squid发现了请求资源的拷贝，但客户端的请求包含了Cache-Control: no-cache指令。Squid转发客户端的请求到原始服务器，强迫cache确认。

**TCP_IMS_HIT**

客户端发送确认请求，Squid发现更近来的、貌似新鲜的请求资源的拷贝。Squid发送更新的内容到客户端，而不联系原始服务器。  
**  
TCP_SWAPFAIL_MISS**

Squid发现请求资源的有效拷贝，但从磁盘装载它失败。这时squid发送请求到原始服务器，就如同这是个cache丢失一样。

**TCP_NEGATIVE_HIT**

在对原始服务器的请求导致HTTP错误时，Squid也会cache这个响应。在短时间内对这些资源的重复请求，导致了否命中。 negative_ttl指令控制这些错误被cache的时间数量。请注意这些错误只在内存cache，不会写往磁盘。下列HTTP状态码可能导致否定 cache（也遵循于其他约束）： 204, 305, 400, 403, 404, 405, 414, 500, 501, 502, 503, 504。

**TCP_MEM_HIT**

Squid在内存cache里发现请求资源的有效拷贝，并将其立即发送到客户端。注意这点并非精确的呈现了所有从内存服务的响应。例如，某些cache在内存里，但要求确认的响应，会以TCP_REFRESH_HIT, TCP_REFRESH_MISS等形式记录。

**TCP_DENIED**

因为http_access或http_reply_access规则，客户端的请求被拒绝了。注意被http_access拒绝的请求在第9域的值是NONE/-，然而被http_reply_access拒绝的请求，在相应地方有一个有效值。

**TCP_OFFLINE_HIT**

当offline_mode激活时，Squid对任何cache响应返回cache命中，而不用考虑它的新鲜程度。

**TCP_REDIRECT**

重定向程序告诉Squid产生一个HTTP重定向到新的URI（见11.1节）。正常的，Squid不会记录这些重定向。假如要这样做，必须在编译squid前，手工定义LOG_TCP_REDIRECTS预处理指令。

**NONE**

无分类的结果用于特定错误，例如无效主机名。

相应于ICP查询，下列标签可能出现在access.log文件的第四域。

**UDP_HIT**

Squid在cache里发现请求资源的貌似新鲜的拷贝。

**UDP_MISS**

Squid没有在cache里发现请求资源的貌似新鲜的拷贝。假如同一目标通过HTTP请求，就可能是个cache丢失。请对比UDP_MISS_NOFETCH。

**UDP_MISS_NOFETCH**

跟UDP_MISS类似，不同的是这里也指示了Squid不愿去处理相应的HTTP请求。假如使用了-Y命令行选项，Squid在启动并编译其内存索引时，会返回这个标签而不是UDP_MISS。

**UDP_DENIED**

因为icp_access规则，ICP查询被拒绝。假如超过95%的到某客户端的ICP响应是UDP_DENIED，并且客户端数据库激活了（见附录A），Squid在1小时内，停止发送任何ICP响应到该客户端。若这点发生，你也可在cache.log里见到一个警告。

**UDP_INVALID**

Squid接受到无效查询（例如截断的消息、无效协议版本、URI里的空格等）。Squid发送UDP_INVALID响应到客户端
