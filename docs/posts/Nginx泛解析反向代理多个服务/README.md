---
title: Nginx泛解析反向代理多个服务
date: 2022-06-16 11:33
permalink: /posts/Nginx%E6%B3%9B%E8%A7%A3%E6%9E%90%E5%8F%8D%E5%90%91%E4%BB%A3%E7%90%86%E5%A4%9A%E4%B8%AA%E6%9C%8D%E5%8A%A1
categories:
- posts
tags: 
---
还是因为我的软路由，上面挂载了多个服务，如果要挨个配置各个服务的反向代理，不还得疯掉。

　　所以需要一个通用的方式进行处理。

1. 首先通过Nginx获取到所有泛解析的二级子域名
2. 提取出子域名之后，匹配好定义的upstream
3. 进行转发

　　脚本如下：

```nginx

http {
    client_max_body_size 204800M;
    upstream note {
        server 192.168.31.10:6806;
    }
    upstream omv {
        server 192.168.31.10:80;
    }
    upstream qbt {
		server 192.168.31.10:8082;
    }
    upstream webdav {
        server 192.168.31.10:8080;
    }
    upstream openwrt {
        server 192.168.31.3:80;
    }

server {
	listen 2095;
	listen [::]:2095;
	server_name map.shiyitopo.tech;
	root /home/nginx/map_html;
	location / {
		try_files $uri $uri/ @router;
		index  index.html index.htm;
	}
	location @router {
		rewrite ^.*$ /index.html last;
	}
}
server {
	listen [::]:2095;
	listen 2095;
	server_name ~^(?<subdomain>.+).shiyitopo.tech$;
	location / {
		proxy_pass http://$subdomain;
		proxy_http_version 1.1;
		proxy_set_header Host $subdomain;
		proxy_set_header   X-Forwarded-Host   $http_host;
		proxy_set_header   X-Forwarded-For    $remote_addr;

	}
}  
}
```

　　监听泛解析的域名，提取出二级域名之后，就用proxy_pass反向代理过去就行。

　　这样就不需要有新的服务就建立一个server了，只需要定义好upstream的后端地址就可以了。
