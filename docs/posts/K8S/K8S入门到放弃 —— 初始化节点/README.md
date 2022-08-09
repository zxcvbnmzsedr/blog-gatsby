---
title: K8S入门到放弃 —— 初始化节点
date: 2022-04-21 15:48
permalink: /posts/K8S/K8S%E5%85%A5%E9%97%A8%E5%88%B0%E6%94%BE%E5%BC%83%20%E2%80%94%E2%80%94%20%E5%88%9D%E5%A7%8B%E5%8C%96%E8%8A%82%E7%82%B9
categories:
- posts
tags: 
---
---

　　title: 'K8S入门到放弃 —— 初始化节点'
date: 2021-06-02 13:40:09
tags: [K8S]
published: true
hideInList: false
feature:
isTop: false

---

　　执行下面操作之前先执行[前置环境](/post/k8s-ru-men-dao-fang-qi-qian-zhi-huan-jing-zhun-bei/)

# 初始化master节点

```
hostnamectl set-hostname master1
# 只在第一个 master 节点执行
# 替换 apiserver.demo 为 您想要的 dnsName
export APISERVER_NAME=apiserver.demo
# Kubernetes 容器组所在的网段，该网段安装完成后，由 kubernetes 创建，事先并不存在于您的物理网络中
export POD_SUBNET=10.100.0.1/16
echo "127.0.0.1    ${APISERVER_NAME}" >> /etc/hosts

cat <<EOF > ./kubeadm-config.yaml
apiVersion: kubeadm.k8s.io/v1beta2
kind: ClusterConfiguration
kubernetesVersion: v1.16.2
imageRepository: registry.aliyuncs.com/google_containers
controlPlaneEndpoint: "${APISERVER_NAME}:6443"
networking:
  serviceSubnet: "10.96.0.0/16"
  podSubnet: "${POD_SUBNET}"
  dnsDomain: "cluster.local"
EOF

# kubeadm init
kubeadm init --config=kubeadm-config.yaml --upload-certs

# 配置 kubectl
rm -rf /root/.kube/
mkdir /root/.kube/
cp -i /etc/kubernetes/admin.conf /root/.kube/config
```

## 初始化完成后安装网络插件

　　只有安装网络插件之后，pod直接才能够正常进行通讯

### 安装calico插件

```
# 要是服务器上网络不好，从本地下载下来传上去也行
curl https://docs.projectcalico.org/manifests/calico.yaml -O
# calico默认子网是192.168.0.0，需要替换成自己设置的子网，这步非常重要！！！
sed -i "s#192\.168\.0\.0/16#${POD_SUBNET}#" calico.yaml 
kubectl apply -f calico.yaml 
```

# 加入第二master个节点做高可用

```
# 执行master安装完成后打印出来的代码
# 替换 x.x.x.x 为 ApiServer LoadBalancer 的 IP 地址
export APISERVER_IP=x.x.x.x
# 替换 apiserver.demo 为 前面已经使用的 dnsName
export APISERVER_NAME=apiserver.demo
echo "${APISERVER_IP}    ${APISERVER_NAME}" >> /etc/hosts

  kubeadm join apiserver.k8s:6443 --token 4z3r2v.2p43g28ons3b475v \
    --discovery-token-ca-cert-hash sha256:959569cbaaf0cf3fad744f8bd8b798ea9e11eb1e568c15825355879cf4cdc5d6 \
    --control-plane --certificate-key 41a741533a038a936759aff43b5680f0e8c41375614a873ea49fde8944614dd6

```

　　如果显示过期了，则重新生成token进行请求

```
# 生成证书
kubeadm init phase upload-certs --upload-certs
# 生成加入命令
kubeadm token create --print-join-command

# 最后拼接出来就大概是这样
kubeadm join apiserver.demo:6443 --token mpfjma.4vjjg8flqihor4vt     --discovery-token-ca-cert-hash sha256:6f7a8e40a810323672de5eee6f4d19aa2dbdb38411845a1bf5dd63485c43d303
--control-plane --certificate-key  $证书
```

# 初始化worker节点

```
hostnamectl set-hostname node1
# 如果dns能解析到APISERVER_NAME的域名，则不需要写入到hosts中
export MASTER_IP=x.x.x.x
# 替换 apiserver.demo 为初始化 master 节点时所使用的 APISERVER_NAME
export APISERVER_NAME=apiserver.demo
echo "${MASTER_IP}    ${APISERVER_NAME}" >> /etc/hosts

# 替换为前面 kubeadm token create --print-join-command 的输出结果,如果过期了就再执行一下
kubeadm join apiserver.demo:6443 --token mpfjma.4vjjg8flqihor4vt     --discovery-token-ca-cert-hash sha256:6f7a8e40a810323672de5eee6f4d19aa2dbdb38411845a1bf5dd63485c43d303
```

　　正常情况下，这个时候能够可以在master节点上通过下面这个命令

```
kubectl get nodes
```

　　获取到对应的节点信息以及状态
