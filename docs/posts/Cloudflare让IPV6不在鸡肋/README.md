---
title: Cloudflare让IPV6不在鸡肋
date: 2022-06-13 11:13
permalink: /posts/Cloudflare%E8%AE%A9IPV6%E4%B8%8D%E5%9C%A8%E9%B8%A1%E8%82%8B
categories:
- posts
tags: 
---
# 前言

　　随着国内IPV4的公网地址越来越少，以及IPV6的不断普及，我们能够很方便的获取到公网的IPV6地址。但是在外面没有IPV6的情况下，想要访问家里的IPV6服务是一件很困难的事情。

　　虽然有着共有的6in4，或者ipv4转v6的代理隧道可以用，但是实际用下来，感觉由于代理服务器的影响，没有办法达到预期的速度。

> [https://tunnelbroker.net/](https://tunnelbroker.net/) 提供了免费的IPV6隧道服务
>

　　不过，国外有一个非常好用的CDN提供商，[CloudFlare](https://www.cloudflare.com/zh-cn/)

　　它提供了一整套免费的CDN加速和代理，我们只需要通过CDN来代理请求的IPV6地址即可。

　　![](https://image.ztianzeng.com/uPic/20220613131516.png)

# 准备工作

　　要想使用这套服务，直接访问到家中的设备需要准备下面这几样东西:

1. 一个属于自己的域名
2. 一个能够编写脚本的路由器
3. 有一定动手能力,爱折腾

# 开始折腾

　　我们第一步需要确保域名接入到了cloudflare中。通过修改名称服务器，将域名交给cloudflare进行托管。

　　然后在cloudflare中新建一个了类型是AAAA的DNS，内容随便写啥。

> 因为我用的是Openwrt，所以会以OpenWrt来进行说明
>

　　先登录OpenWrt的路由器, 查看LAN口的获取到的IPV6地址，把这个IPV6地址粘贴到CloudFlare中。（关于OpenWrt如何开启IPV6，网上教程很多）

　　然后将Openwrt的端口修改成下面的任何一个（下面这些端口是CloudFlare支持的反向代理的端口，其次国内家用端口封80和443，我选择的是2095）

* 8880
* 2052
* 2082
* 2086
* 2095

　　如果不能访问，一般是由于防火墙的问题，我们可以用5G手机，直接访问[:IPV6地址:]:2095，来确定是不是防火墙的问题。

　　![](https://image.ztianzeng.com/uPic/20220630093151.png)

　　如果一切设置完成，就能访问了。

> 必须将代理状态设置成已代理，否则就会你和配置的域名之间就会走IPV6的方式访问。
>

# DDNS

　　由于我们拿到的IPV6是每次拨号都是在变化的，所以要能定时将最新的IPV6地址上报上去。

　　脚本在下面:

　　脚本需要用到jq，所以提取先安装[jq](https://stedolan.github.io/jq/download/)

```bash
#!/bin/bash

#LEDE/Openwrt may need install ca-bundle curl(opkg install ca-bundle curl)

#Add you custom record to the CloudFlare first.

#Your sub domain
SUB_DOMAIN="webdav.shiyitopo.tech"
#dash --> example.com --> Overview --> Zone ID:
#https://dash.cloudflare.com/_your_account_id_/example.com
ZONE_ID=""
#API Tokens
#https://dash.cloudflare.com/profile/api-tokens
#Manage access and permissions for your accounts, sites, and products
#example.com- Zone:Read, DNS:Edit
TOKEN_ID=""
#The path of jq binaries . Download from https://stedolan.github.io/jq/download/
#If the system has installed jq. Just typed jq.
#If you custom a special binary. Just type the path of jq
JQ_PATH="/root/jq-linux64"

if [ -n "$DNS_ZONE_ID" ]; then
    echo "The user has not configure the the ZONE ID "
    exit 1
fi

echo "Your dns zone id is: $ZONE_ID"
jsonResult=$(curl -s -X GET "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records" \
    -H "Authorization: Bearer ${TOKEN_ID}" \
    -H "Content-Type: application/json")

curlResult=$(echo $jsonResult | $JQ_PATH -r .success)

if [ "$curlResult" = true ]; then
    echo "Get dns record success."
else
    echo "Get dns record fail.$jsonResult"
    exit 1
fi

recordSize=$(echo $jsonResult | $JQ_PATH .result | $JQ_PATH length)
echo "Total found $recordSize record"

index=0
while [ $index -lt $recordSize ]; do
    tResult=$(echo $jsonResult | $JQ_PATH -r .result[$index])
    tmpDomain=$(echo $tResult | $JQ_PATH -r .name)
    type=$(echo $tResult | $JQ_PATH -r .type)

    if [ "$tmpDomain"x = "$SUB_DOMAIN"x ]; then
        if [ "AAAA"x = "$type"x ]; then
            echo "Found AAAA domain:$tmpDomain"
            identifier_v6=$(echo $tResult | $JQ_PATH -r .id)
        elif [ "A"x = "$type"x ]; then
            echo "Found A domain:$tmpDomain"
            identifier_v4=$(echo $tResult | $JQ_PATH -r .id)
        else
            echo "Please add the A or AAAA record manually first."
        fi
    fi
    index=$(expr $index + 1)
done

if [ -z "$identifier_v4" ] && [ -z "$identifier_v6" ]; then
    echo "Get '$SUB_DOMAIN' identifier failed. Please add the A or AAAA record manually first."
    exit 1
else
    echo "Get '$SUB_DOMAIN' identifier success. [A] identifier:$identifier_v4 [AAAA] identifier:$identifier_v6"
fi

if [ -z "$identifier_v4" ]; then
    echo "IPv4 address are not required."
else
    #IP=$(curl -s http://members.3322.org/dyndns/getip)
    IP=$(curl -s http://ip.3322.net/)
    regex='\b((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(\.|$)){4}\b'
    matchIP=$(echo $IP | grep -E $regex)
    if [ -n "$matchIP" ]; then
        echo "[$IP] IPv4 matches..."
        jsonResult=$(curl -s -X PUT "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records/${identifier_v4}" \
            -H "Authorization: Bearer ${TOKEN_ID}" \
            -H "Content-Type: application/json" \
            --data '{"type":"A","name":"'${SUB_DOMAIN}'","content":"'${IP}'","ttl":1,"proxied":false}')
        curlResult=$(echo $jsonResult | $JQ_PATH -r .success)

        if [ "$curlResult" = true ]; then
            echo "Update IPv4 dns record success."
        else
            echo "Update IPv4 dns record fail."
        fi
    else
        echo "[$IP]IPv4 doesn't match!"
    fi
fi

if [ -z "$identifier_v6" ]; then
    echo "IPv6 addresses are not required."
else
    #IP=$(curl -6 ip.sb)
    IP=$(ip addr show dev  ens18|sed -e's/^.*inet6 \([^ ]*\)\/.*$/\1/;t;d'|grep 2409|head -1)
    regex='^([0-9a-fA-F]{0,4}:){1,7}[0-9a-fA-F]{0,4}$'
    matchIP=$(echo $IP | grep -E $regex)
    if [ -n "$matchIP" ]; then
        echo "[$IP] IPv6 matches..."
        echo "Update IPv6 ..."
        jsonResult=$(curl -s -X PUT "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records/${identifier_v6}" \
            -H "Authorization: Bearer ${TOKEN_ID}" \
            -H "Content-Type: application/json" \
            --data '{"type":"AAAA","name":"'${SUB_DOMAIN}'","content":"'${IP}'","ttl":1,"proxied":true}')
        curlResult=$(echo $jsonResult | $JQ_PATH -r .success)

        if [ "$curlResult" = true ]; then
            echo "Update IPv6 dns record success."
        else
            echo "Update IPv6 dns record fail."
        fi
    else
        echo "[$IP] IPv6 doesn't match!"
    fi
fi
```

　　后续也能通过Nginx进行反向代理，这样就不用配置其他服务的域名了，只需要通过nginx进行统一的转发即可。
