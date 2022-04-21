---
title: Openwrt搭建免流服务器
date: 2022-03-28 15:48  
tags: [软路由]
---
之前在阿里云上通过V2Ray搭建了免流服务器，奈何固定带宽速度太慢，而流量计费高达0.8元/G的成本又和绝大多数的互联网套餐价格相差无几。

因此就琢磨着，是不是可以在家中，通过公网IP来自建免流服务器。

# 要求

1. Openwrt 必须能够获取到公网地址(IPV4或者PV6)
2. 卡里面需要有定向的免费流量套餐
3. DDNS内网穿透
4. 如果是联通卡的话，得是80端口

# 原理

因为运营商的代理服务器和运营商的计费检测系统是分离的，通过欺骗的方式，把真实的流量代理成免费的流量
![](https://www.ztianzeng.com/post-images/1624328188614.jpg)

# 步骤

## 安装V2RAY

+ v2ray-core ipk安装包
  https://github.com/kuoruan/openwrt-v2ray/releases
+ luci界面和中文支持
  https://github.com/kuoruan/luci-app-v2ray/releases

![](https://www.ztianzeng.com/post-images/1624327400258.jpg)

## 编写配置文件

```
{
	"log": {
		"loglevel": "warning"
	},
	"inbound": {
		"protocol": "vmess",
		"port": 80,
		"settings": {
			"clients": [{
				"id": "ad806487-2d26-4636-98b6-ab85cc8521f7",
				"alterId": 64,
				"security": "chacha20-poly1305"
			}]
		},
		"streamSettings": {
			"network": "tcp",
			"httpSettings": {
				"path": "/"
			},
			"tcpSettings": {
				"header": {
					"type": "http",
					"response": {
						"version": "1.1",
						"status": "200",
						"reason": "OK",
						"headers": {
							"Content-Type": ["application/octet-stream", "application/x-msdownload", "text/html", "application/x-shockwave-flash"],
							"Transfer-Encoding": ["chunked"],
							"Connection": ["keep-alive"],
							"Pragma": "no-cache"
						}
					}
				}
			}
		}
	},
	"inboundDetour": [],
	"outbound": {
		"protocol": "freedom",
		"settings": {}
	}
}

```

## 防火墙开放端口

# 手机设置

手机上安装V2RAY客户端

家里动态域名
协议就是websocks (WS)
加密方式任意.
端口83
id填写配置文件.

伪装协议为http
伪装host为免流host

# 最后

慎用，哈哈
![](https://www.ztianzeng.com/post-images/1624327569228.jpeg)
