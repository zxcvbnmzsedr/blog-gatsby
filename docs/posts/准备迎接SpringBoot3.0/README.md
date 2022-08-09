---
title: 准备迎接SpringBoot3.0
date: 2022-06-06 20:25
permalink: /posts/%E5%87%86%E5%A4%87%E8%BF%8E%E6%8E%A5SpringBoot3.0
categories:
- posts
tags: 
---
在2018年2月28号，发布了第一个`Spring Boot2.0`的版本。在最近发布了`Spring Boot2.7`的版本。

　　到目前为止，`Spring Boot 2.x `已经维护了超过4年了，总共发布了95个版本。

　　现在，整个Spring的团队和社会上的自由贡献者，在为下一代的Spring做准备。计划在2022年11月发布`Spring Boot3.0`。

　　下一个版本最重要的是基于Spring Framework 6.0的基础上进行开发，并且要求Java的版本在`Java17`或以上。这也是Spring Boot使用Jakarta EE 9 APIs( `jakarta.*`)的第一个版本（为了替代原来的Java EE 8 `javax.*`）

　　接下来6个月的时间是一个非常好的机会，将自己的项目升级到最新的`Spring Boot3.0`。这篇文章介绍了一些可以做的事情，使得未来发布的时候，使得迁移更加轻松。

> 估计国内应该是没什么公司敢这么激进的升级
>

# 升级到Java 17

　　`Spring Boot3.0 `需要`Java 17`才能够运行。 但是现在就可以将手中项目的环境升级到17了。因为目前现有的`Spring Boot2.0`的版本，能够与`Java17`做到很好的兼容。

　　你也能够在自己的项目中用`Java 17`的特性。如果有可能的话，建议现在、立刻、马上就升级`JDK`系统。

# 升级到最新的Spring Boot 2.7.X

　　如果当前使用的是老的版本的`Spring Boot 2.0` .强烈建议先升级到`Spring Boot 2.7`.

　　当`Spring Boot 3.0` released 的时候将会发布一个从2.7升级到3.0的迁移指南，而不是从更老的版本进行一个迁移。

　　升级说明一般都会在release notes中进行提供。例如，如果你想升级`Spring Boot 2.6`到2.7，你可以查看[这里](https://github.com/spring-projects/spring-boot/wiki/Spring-Boot-2.7-Release-Notes#upgrading-from-spring-boot-26)。

　　强烈不建议从Spring 2.5之前或者更早来进行一步到位的升级。通常来说小版本的升级会更加的容易（eg: 2.5->2.6-2.7）而不是直接从2.5->2.7。

# 检测对标记Deprecated代码的调用

　　在`Spring Boot`的进化中，会废弃掉一些方法或者类 与此同时会提供替代的方法或者类。我们往往会提供12个月左右的迭代期，在12个月之后过期的代码将会被删除。

　　删除政策的文件在[这里](https://github.com/spring-projects/spring-boot/wiki/Deprecations)。

　　`Spring Boot3.0`将会删除所有的过期代码，因此我们推荐检查现有的代码，来找出所有引用了标记`@Deprecated`的代码。当然，你能够开启-`Werror`选项，来将编译期间的警告变成错误，使其编译失败。

> 引用`@Deprecated`的代码，编译器会发出警告，然后转成error，这样不处理就编译不通过了
>

# 迁移application.properties和application.yml

　　`Spring Boot2.4`修改了配置文件的加载方式。大多数用户会对这个改动并没有什么感知，因为项目可以设置`spring.config.use-legacy-processing=true`来避免这个问题。

　　这个来兼容新旧配置文件加载方式的属性，也将会在Spring3.0中进行删除，所以需要检查项目是否设置了这个属性，并且修改掉加载方式。

> 这个被坑过，可以看 [Spring2.4中使用NacosConfig](../在Spring2.4中使用NacosConfig)
>

# 使用Spring MVC的Pathpatternparser

　　Spring MVC 提供了两种解析URL路径的方式。自从Spring Boot 2.6之后`PathPatternParser`是默认的解析方式。

　　一些项目通过设置`spring.mvc.pathmatch`手动切换回`AntPathMatcher`来作为路径匹配的实现类。虽然在Spring Boot 3.0用也是能用，但是如果可能的话还是建议使用`PathPatternParser`，因为它提供了更好的性能。

## 性能对比: 

　　循环100000次：

|路径匹配器|第1次耗时|第2次耗时|第3次耗时|
| ----------------| -----------| -----------| -----------|
|AntPathMatcher|171|199|188|
|PathPattern|118|134|128|

　　循环1000000次：

|路径匹配器|第1次耗时|第2次耗时|第3次耗时|
| ----------------| -----------| -----------| -----------|
|AntPathMatcher|944|852|882|
|PathPattern|633|637|626|

　　循环10000000次：

|路径匹配器|第1次耗时|第2次耗时|第3次耗时|
| ----------------| -----------| -----------| -----------|
|AntPathMatcher|5561|5469|5461|
|PathPattern|4495|4440|4571|

# 检查三方的项目是否有Jakarta EE 9

　　Jakarta EE 9 是为了渠道Java EE 8的`javax`。例如，Servlet 在Jakarata EE 8中是`javax.servlet`,在9中则是`jakarta.servlet`。

　　一般来说，想在同一个项目中混用Java EE 和 Jakarta EE 是不可能的。你需要确保在你的代码和引用的三方库中，都是使用的`jakarta.*`。

　　一个好消息是，大多数维护良好的库都有提供Jakarta EE 9版本的包。例如，Hibernate、Thymeleaf、Tomcat、Jetty等。

　　我们推荐你花一些时间去检查三方库是否兼容了Jakarta EE。通常问题会出现在引入Servlet API中。

# 检查三方库的Spring版本

　　Spring Framework 6.0 与上一代不兼容。你需要检查使用的三方的jar包是否提供了与Spring Framework 6.0的兼容的版本。

# 尝试一下Spring3.0

　　尽管不建议被用于到生产环境中，但是你也能够尝试一下看看将`Spring Boot 3.0`集成到项目中有多难。

　　切一个额外的分支出来来进行升级，这样能够提前的将问题暴露出来。

　　最好能在发布GA之前，将BUG提前暴露出来，然后反馈给我们。

　　可以在[github.com/spring-projects/spring-boot/issues](https://github.com/spring-projects/spring-boot/issues)上提出问题（提问时请说明Spring的版本）

# 商业支持

　　`Spring Boot 2.7`是`2.x`计划发布的最后一个版本。我们已经将此版本的开放源码支持延长了6个月，直至2023年11月。

　　此外，`Spring Boot 2.7`的商业支持也得到了扩展，直至2025年2月。

　　您可以在[spring.io/projects/spring-boot](spring.io/projects/spring-boot)上找到项目支持详细信息。有关商业支持的详细信息，请访问[tanzu.vmware.com/spring-runtime](tanzu.vmware.com/spring-runtime)。

　　由商业支持请求触发的任何版本都将始终以开源方式发布，这样商业客户也可以帮助开源社区。

　　

> 翻译自: [https://spring.io/blog/2022/05/24/preparing-for-spring-boot-3-0](https://spring.io/blog/2022/05/24/preparing-for-spring-boot-3-0)
>
