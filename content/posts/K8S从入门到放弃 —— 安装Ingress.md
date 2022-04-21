---
title: K8S从入门到放弃 —— 安装Ingress
date: 2022-04-21 16:11  
tags: [K8S]
---
Ingress 是提供了一个路由，用于反向代理到集群内部的服务中。

这是官网的一张请求示例图。能清晰的看到Ingress所提供的功能。

![](https://www.ztianzeng.com/post-images/1622618042586.jpg)

# Ingress Controller

Ingress 提供了好多种实现方式，比如 traefic / Kong / Istio / Nginx 等

最恶心的是，Nginx 还提供了两个版本 :

一个是Nginx公司实现的 [nginx-ingress](https://github.com/nginxinc/kubernetes-ingress)

还有一个是K8S 社区实现的 [ingress-nginx](https://github.com/kubernetes/ingress-nginx/)

<table>
    <thead>
        <tr>
            <th>特性</th>
            <th>K8S 实现版本</th>
            <th>Nginx 实现版本 (NGINX)</th>
            <th>Nginx 实现版本 (NGINX Plus)</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td  align="center" colspan="4"><strong>基础</strong></td>
        </tr>
        <tr>
            <td>作者</td>
            <td>K8S 社区</td>
            <td>Nginx 公司和社区</td>
            <td>Nginx 公司和社区</td>
        </tr>
        <tr>
            <td>Nginx版本</td>
            <td>包含一些三方模块的定制的 Nginx 版本</td>
            <td>Nginx 官方版本</td>
            <td>Nginx Plus</td>
        </tr>
        <tr>
            <td>商业支持</td>
            <td>N/A</td>
            <td>N/A</td>
            <td>包含</td>
        </tr>
        <tr>
            <td align="center" colspan="4"<strong>通过Ingress资源配置负载均衡</strong></td
        </tr>
        <tr>
            <td>合并同一host的Ingress规则</td>
            <td>支持</td>
            <td>通过 <a target="_blank" href="https://github.com/nginxinc/kubernetes-ingress/blob/master/examples/mergeable-ingress-types">Mergeable Ingresses</a> 支持</td>
            <td>通过 <a target="_blank" href="https://github.com/nginxinc/kubernetes-ingress/blob/master/examples/mergeable-ingress-types">Mergeable Ingresses</a> 支持</td>
        </tr>
        <tr>
            <td>HTTP负载均衡扩展 -- 注解方式</td>
            <td>见 <a target="_blank" href="https://kubernetes.github.io/ingress-nginx/user-guide/nginx-configuration/annotations/">K8S 支持的注解</a>
            </td>
            <td>见 <a target="_blank" href="https://docs.nginx.com/nginx-ingress-controller/configuration/ingress-resources/advanced-configuration-with-annotations/">Nginx 支持的注解</a>
            </td>
            <td>见 <a target="_blank" href="https://docs.nginx.com/nginx-ingress-controller/configuration/ingress-resources/advanced-configuration-with-annotations/">Nginx 支持的注解</a>
            </td>
        </tr>
        <tr>
            <td>HTTP负载均衡扩展 -- ConfigMap 方式</td>
            <td>见 <a target="_blank" href="https://kubernetes.github.io/ingress-nginx/user-guide/nginx-configuration/configmap/">K8S 支持的 ConfigMap 主键</a>
            </td>
            <td>见 <a target="_blank" href="https://docs.nginx.com/nginx-ingress-controller/configuration/global-configuration/configmap-resource/">Nginx 支持的 ConfigMap 主键</a>
            </td>
            <td>见 <a target="_blank" href="https://docs.nginx.com/nginx-ingress-controller/configuration/global-configuration/configmap-resource/">Nginx 支持的 ConfigMap 主键</a>
            </td>
        </tr>
        <tr>
            <td>TCP/UDP</td>
            <td>通过 ConfigMap 支持</td>
            <td>通过 ConfigMap (原生 NGINX 配置) 支持</td>
            <td>通过 ConfigMap (原生 NGINX 配置) 支持</td>
        </tr>
        <tr>
            <td>Websocket</td>
            <td>支持</td>
            <td>通过注解支持</td>
            <td>通过注解支持</td>
        </tr>
        <tr>
            <td>TCP SSL Passthrough</td>
            <td>通过 ConfigMap 支持</td>
            <td>不支持</td>
            <td>不支持</td>
        </tr>
        <tr>
            <td>JWT 验证</td>
            <td>不支持</td>
            <td>不支持</td>
            <td>支持</td>
        </tr>
        <tr>
            <td>Session 持久化</td>
            <td>通过三方库支持</td>
            <td>不支持</td>
            <td>支持</td>
        </tr>
        <tr>
            <td>金丝雀测试 (通过 header, cookie, weight)</td>
            <td>通过注解支持</td>
            <td>通过定制的资源支持</td>
            <td>通过定制的资源支持</td>
        </tr>
        <tr>
            <td>配置模板 *1</td>
            <td>见 <a target="_blank" href="https://github.com/kubernetes/ingress-nginx/blob/master/rootfs/etc/nginx/template/nginx.tmpl">模板</a>
            </td>
            <td>见 <a target="_blank" href="https://github.com/nginxinc/kubernetes-ingress/blob/master/internal/configs/version1">模板</a>
            </td>
            <td>见 <a target="_blank" href="https://github.com/nginxinc/kubernetes-ingress/blob/master/internal/configs/version1">模板</a>
            </td>
        </tr>
        <tr>
            <td align="center" colspan="4"><strong>通过定制化资源配置负载均衡配置</strong></td>
        </tr>
        <tr>
            <td>HTTP负载均衡</td>
            <td>不支持</td>
            <td>见 <a target="_blank" href="https://docs.nginx.com/nginx-ingress-controller/configuration/virtualserver-and-virtualserverroute-resources/">VirtualServer 和 VirtualServerRoute</a> 资源</td>
            <td>见 <a target="_blank" href="https://docs.nginx.com/nginx-ingress-controller/configuration/virtualserver-and-virtualserverroute-resources/">VirtualServer 和 VirtualServerRoute</a> 资源</td>
        </tr>
        <tr>
            <td colspan="4"><strong>部署</strong></td>
        </tr>
        <tr>
            <td>命令行参数 *2</td>
            <td>见 <a target="_blank" href="https://kubernetes.github.io/ingress-nginx/user-guide/cli-arguments/">K8S 版 参数列表</a>
            </td>
            <td>见 <a target="_blank" href="https://docs.nginx.com/nginx-ingress-controller/configuration/global-configuration/command-line-arguments/">Nginx 版 参数列表</a>
            </td>
            <td>同左</td>
        </tr>
        <tr>
            <td>默认 Server 的 TLS 证书和秘钥</td>
            <td>必需(命令行参数) / 自动生成</td>
            <td>必需(命令行参数)</td>
            <td>必需(命令行参数)</td>
        </tr>
        <tr>
            <td>Helm Chart</td>
            <td>支持</td>
            <td>支持</td>
            <td>支持</td>
        </tr>
        <tr>
            <td align="center" colspan="4"><strong>运维</strong></td>
        </tr>
        <tr>
            <td>上报 Ingress 控制器的 IP地址到Ingress资源</td>
            <td>支持</td>
            <td>支持</td>
            <td>支持</td>
        </tr>
        <tr>
            <td>扩展的状态</td>
            <td>通过三方模块支持</td>
            <td>不支持</td>
            <td>支持</td>
        </tr>
        <tr>
            <td>Prometheus 整合</td>
            <td>支持</td>
            <td>支持</td>
            <td>支持</td>
        </tr>
        <tr>
            <td>动态配置 endpoints (无需重新加载配置)</td>
            <td>通过三方模块支持</td>
            <td>不支持</td>
            <td>支持</td>
        </tr>
    </tbody>
</table>

我自己一开始使用的是Nginx出品的那个，后面发现Stack Overflow上讨论的问题都没有K8S出品的多，就使用上了K8S的版本Ingress。

# 安装

```
# 正常情况下就能装上，但是国内由于某些特殊原因导致访问不了谷歌服务，所以需要手动修改镜像地址
curl  https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v0.46.0/deploy/static/provider/cloud/deploy.yaml -O

kubectl apply -f deploy.yaml
```
