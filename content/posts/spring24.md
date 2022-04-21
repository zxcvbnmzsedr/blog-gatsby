---
title: spring24
date: 2022-03-28 15:48  
tags: [Spring]
---
# 全新的配置文件处理

我感觉最大的改变是提供了新的配置文件的加载方式，为了去适应k8s容器化部署中的configMap。

如果不想使用新的加载方式，依然提供了旧版的加载方式

引入依赖

```xml
<dependency>
  <groupId>org.springframework.cloud</groupId>
  <artifactId>spring-cloud-starter-bootstrap</artifactId>
  <version>3.0.3</version>
</dependency>
```

在配置文件中加上 spring.config.use-legacy-processing=true 

## 新版加载方式spring.config.import属性

spring.config.import属性可被视作这个版本最为牛逼的属性。

可以从不同的位置加载数据

1. 加载classpath数据

```properties
spring.config.import=optional:file:./dev.properties
```

1. 加载文件系统的数据

```properties
spring.config.import=file:/etc/config/myconfig[.yaml]
```

3. 加载Kubernetes的configMap(先将Kubernetes的数据挂载到卷轴上，然后在进行引用)
   [如何配置看这里](https://kubernetes.io/docs/concepts/configuration/secret/#using-secrets-as-files-from-a-pod)

```properties
spring.config.import=optional:configtree:/etc/config/
```

4. 自定义加载数据，你可以通过自己喜欢的方式去从任意位置加载配置文件
   [😃具体使用方式看这里](/post/zai-spring24-zhong-shi-yong-nacosconfig/)

# 新的版本描述方案

为了更加照顾英语非母语的开发者，spring采用了新的命名方案。

之前那套用英文命名的真的让人摸不着头脑，英语也就算了，还整些个不常用的生词。

单词的拼写很困难，版本号全靠复制。

而且版本号上面也难以看出版本向下兼容性，很难做出判断而做出风险预估。

为了解决这些问题

Spring采用了日历化版本，并且使用的规则/公式是YYYY.MINOR.MICRO[-MODIFIER]，

### 对各部分解释如下：

+ YYYY：年份全称。eg：2020
+ MINOR：辅助版本号（一般升级些非主线功能），在当前年内从0递增
+ MICRO：补丁版本号（一般修复些bug），在当前年内从0递增
+ MODIFIER：非必填。后缀，它用于修饰一些关键节点，用这些字母表示
+ M数字：里程碑版本，如2020.0.0-M1、2020.0.0-M2
+ RC数字：发布候选版本，如2020.0.0-RC1、2020.0.0-RC2
+ SNAPSHOT：快照版本（后无数字），如2020.0.0-SNAPSHOT
+ 啥都木有：正式版本（可放心使用，相当于之前的xxx-RELEASE），如2020.0.0

---

# R2DBC

AR2dbcEntityTemplate可用于通过实体简化 Reactive R2DBC 的使用

# Java 15 支持

Spring Boot 2.4 现在完全支持（并针对）Java 15。支持的最低版本仍然是 Java 8。

# 自定义属性名称支持

如果想注入的名称和java关键字想冲突可以使用@Name属性进行注入

```java
@ConfigurationProperties(prefix = "sample")
@ConstructorBinding
public class SampleConfigurationProperties {

  private final String importValue;

  public SampleConfigurationProperties(@Name("import") String importValue) {
    this.importValue = importValue;
  }

}
````

# 依赖升级

+ Spring AMQP 2.3
+ Spring Batch 4.
+ Spring Data 2020.0
+ Spring Framework 5.3
+ Spring Integration 5.4
+ Spring HATEOAS 1.2
+ Spring Kafka 2
+ Spring Retry 1.3
+ Spring Security 5.4
+ Spring Session 2020.0

还更新了许多第三方依赖项：

+ Artemis 2.13
+ AssertJ 3.18
+ Cassandra Driver 4.7
+ Elasticsearch 7.9
+ Flyway 7
+ Jersey 2.31
+ JUnit 5.7
+ Liquibase 3.10
+ Lettuce 6.0
+ Micrometer 1.6
+ Mockito 3.4
+ MongoDB 4.1
+ Oracle Database 19.7
+ Reactor 2020.0
+ RSocket 1.1
+ Undertow 2.2
