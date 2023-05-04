---
title: Feign配置SSL证书进行抓包
date: 2022-07-12 10:22
permalink: /posts/Feign%E9%85%8D%E7%BD%AESSL%E8%AF%81%E4%B9%A6%E8%BF%9B%E8%A1%8C%E6%8A%93%E5%8C%85
categories:
- posts
tags: 
---
# Feign配置SSL证书进行抓包

直接用传统的Feign封装外部的请求，如果是Https请求的话，开启抓包会导致MtiM解密异常。

Java由于虚拟机的机制，没有办法使用系统的证书去进行解密，因此需要通过指定证书地址，进行手动配置。（类似于Android和IOS的信任证书）

‍

下面这段代码是构造SSL证书的方法：

```java
private SSLSocketFactory buildSslSocketFactory() {
        try {
            CertificateFactory cf = CertificateFactory.getInstance("X.509");
            InputStream is = AutoFeignConfig.class.getResourceAsStream("/ssl/Surge.crt");
            InputStream caInput = new BufferedInputStream(is);
            Certificate ca;
            try {
                ca = cf.generateCertificate(caInput);
            } finally {
                caInput.close();
            }
            String keyStoreType = KeyStore.getDefaultType();
            KeyStore keyStore = KeyStore.getInstance(keyStoreType);
            keyStore.load(null, null);
            keyStore.setCertificateEntry("ca", ca);
            String tmfAlgorithm = TrustManagerFactory.getDefaultAlgorithm();
            TrustManagerFactory tmf = TrustManagerFactory.getInstance(tmfAlgorithm);
            tmf.init(keyStore);
            SSLContext context = SSLContext.getInstance("TLS");
            context.init(null, tmf.getTrustManagers(), null);
            return context.getSocketFactory();
        } catch (NoSuchAlgorithmException | KeyManagementException | CertificateException | IOException |
                 KeyStoreException e) {
            e.printStackTrace();
        }
        return null;
    }
```

在声明FeignClient的时候，只需要构造一下替换掉默认的SSL配置即可。

```java
 @Bean
 public OauthApi oauthApi() {
     return Feign.builder()
             .client(new Client.Default(buildSslSocketFactory(),null))
             .requestInterceptor(signInterceptor())
             .target(OauthApi.class, shoplineProperties.url());
 }
```

‍
