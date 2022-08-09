---
title: K8S更换证书
date: 2022-06-06 10:43
permalink: /posts/K8S%E6%9B%B4%E6%8D%A2%E8%AF%81%E4%B9%A6
categories:
- posts
tags: 
---
kubeadm默认安装的证书有效期只有一年，过期只有整个集群都没有办法正常运行。一直在报错:

> Get "https://[10.96.0.1]:443/apis/crd.projectcalico.org/v1/clusterinformations/default": x509: certificate has expired or is not yet valid: current time 2022-06-05T22:31:49-04:00 is after 2022-06-02T11:30:48Z]
>

　　需要对证书进行更换

# 检查过期时间

```shell
kubeadm certs check-expiration
```

　　![](https://image.ztianzeng.com/uPic/20220606104802.png)

# 证书备份

　　备份是一个好习惯

```shell
cp -rp /etc/kubernetes /etc/kubernetes.bak
```

# 重新生成证书

```shell
kubeadm certs renew all
```

　　![](https://image.ztianzeng.com/uPic/20220606104753.png)

# 重启kubelet

```shell
systemctl restart kubelet
```

# 验证更换是否成功

```shell
kubeadm certs check-expiration
```

　　![](https://image.ztianzeng.com/uPic/20220606104802.png)

　　
