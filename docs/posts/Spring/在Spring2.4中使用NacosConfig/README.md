---
title: 在Spring2.4中使用NacosConfig
date: 2022-04-21 15:48
permalink: /posts/Spring/%E5%9C%A8Spring2.4%E4%B8%AD%E4%BD%BF%E7%94%A8NacosConfig
categories:
- posts
tags: 
---
　　因为spring cloud alibaba没有进行升级，导致在spring2.4下，无法通过最新的方式引用配置文件。

　　心中甚是不爽，因此基于最新的配置规则，给nacos打了个布丁。

# 修改原始配置文件

　　将原本的工程的application.yml改成这样，重点是optional:nacos 后面的一定要是nacos

　　别的就基本遵循nacos原本的配置就好了，该是啥样就啥样

```yml
spring:
  cloud:
    nacos:
      server-addr: www.nacos.com:80
      config:
        shared-configs:
          - data-id: ...
        file-extension: yaml
        namespace: ${spring.profiles.active}
  config:
    import: optional:nacos:${spring.cloud.nacos.server-addr}
```

# 新增spring.factories

```properties
文件位置在这里
resources/
   META-INF/
      spring.factories
# 自己在前面添加包名
org.springframework.boot.context.config.ConfigDataLocationResolver=\
NacosConfigDataLocationResolver

org.springframework.boot.context.config.ConfigDataLoader=\
NacosServerConfigDataLoader
```

# 创建对应的配置文件位置解析和配置文件夹在

## NacosConfigDataLocationResolver.java

```java
import com.alibaba.cloud.nacos.NacosConfigManager;
import com.alibaba.cloud.nacos.NacosConfigProperties;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.context.config.*;
import org.springframework.boot.context.properties.bind.BindHandler;
import org.springframework.boot.context.properties.bind.Bindable;
import org.springframework.boot.context.properties.bind.Binder;
import org.springframework.context.annotation.Bean;
import org.springframework.core.Ordered;
import org.springframework.core.env.StandardEnvironment;
import org.springframework.util.StringUtils;

import java.util.Collections;
import java.util.List;

public class NacosConfigDataLocationResolver implements ConfigDataLocationResolver<NacosServerConfigDataResource>, Ordered {

    /**
     * 就这个是让配置文件找到这个解析器的核心字符串，千万不能写错了
     */
    public static final String PREFIX = "nacos:";

    public NacosConfigDataLocationResolver() {

    }

    @Bean
    @ConditionalOnMissingBean
    public NacosConfigProperties nacosConfigProperties() {
        return new NacosConfigProperties();
    }

    @Override
    public int getOrder() {
        return -1;
    }

    @Override
    public boolean isResolvable(ConfigDataLocationResolverContext context, ConfigDataLocation location) {
        return location.hasPrefix(PREFIX);
    }

    @Override
    public List<NacosServerConfigDataResource> resolve(ConfigDataLocationResolverContext context, ConfigDataLocation location) throws ConfigDataLocationNotFoundException, ConfigDataResourceNotFoundException {
        return Collections.emptyList();
    }

    @Override
    public List<NacosServerConfigDataResource> resolveProfileSpecific(ConfigDataLocationResolverContext context, ConfigDataLocation location, Profiles profiles) throws ConfigDataLocationNotFoundException {
        String uris = location.getNonPrefixedValue(PREFIX);
        final NacosConfigProperties properties = loadProperties(context);
        properties.setServerAddr(uris);

        return Collections.singletonList(new NacosServerConfigDataResource(new NacosConfigManager(properties)));
    }

    protected NacosConfigProperties loadProperties(ConfigDataLocationResolverContext context) {
        Binder binder = context.getBinder();
        BindHandler bindHandler = getBindHandler(context);
        NacosConfigProperties configClientProperties = binder
                .bind(NacosConfigProperties.PREFIX, Bindable.of(NacosConfigProperties.class), bindHandler)
                .orElseGet(NacosConfigProperties::new);
        configClientProperties.setEnvironment(new StandardEnvironment());
        if (!StringUtils.hasText(configClientProperties.getName())) {
            // default to spring.application.name if name isn't set
            String applicationName = binder.bind("spring.application.name", Bindable.of(String.class), bindHandler)
                    .orElse("application");
            configClientProperties.setPrefix(applicationName);
        }
        return configClientProperties;
    }

    private BindHandler getBindHandler(ConfigDataLocationResolverContext context) {
        return context.getBootstrapContext().getOrElse(BindHandler.class, null);
    }
}

```

## NacosServerConfigDataLoader.java

```java
import com.alibaba.cloud.nacos.NacosConfigManager;
import com.alibaba.cloud.nacos.client.NacosPropertySourceLocator;
import org.springframework.boot.context.config.ConfigData;
import org.springframework.boot.context.config.ConfigDataLoader;
import org.springframework.boot.context.config.ConfigDataLoaderContext;
import org.springframework.boot.context.config.ConfigDataResourceNotFoundException;
import org.springframework.core.env.PropertySource;
import org.springframework.core.env.StandardEnvironment;

import java.util.Collections;


public class NacosServerConfigDataLoader implements ConfigDataLoader<NacosServerConfigDataResource> {


    @Override
    public ConfigData load(ConfigDataLoaderContext context, NacosServerConfigDataResource resource) throws ConfigDataResourceNotFoundException {
        NacosConfigManager nacosConfigManager = resource.getNacosConfigManager();
        final NacosPropertySourceLocator nacosPropertySourceLocator = new NacosPropertySourceLocator(nacosConfigManager);
        final PropertySource<?> locate = nacosPropertySourceLocator.locate(new StandardEnvironment());
        return new ConfigData(Collections.singletonList(locate));
    }
}

```

## NacosServerConfigDataResource.java

```java
import com.alibaba.cloud.nacos.NacosConfigManager;
import org.springframework.boot.context.config.ConfigDataResource;

public class NacosServerConfigDataResource extends ConfigDataResource {
    private NacosConfigManager nacosConfigManager;

    public NacosServerConfigDataResource(NacosConfigManager nacosConfigManager) {
        this.nacosConfigManager = nacosConfigManager;
    }

    public NacosConfigManager getNacosConfigManager() {
        return nacosConfigManager;
    }
}

```

# 后续

　　创建好这些文件，如果不出意外的话应该能够将工程运行起来

　　主要核心就是继承 ConfigDataLocationResolver 和 ConfigDataLoader

　　ConfigDataLocationResolver 用于冷启动时，初始化各种参数，打包成一个ConfigDataResource交由给ConfigDataLoader使用

　　ConfigDataLoader则是通过ConfigDataResource进行配置文件的加载，加载到Environment中供应用程式使用
