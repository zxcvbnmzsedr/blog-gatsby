---
title: Sega模式
date: 2022-04-26 16:00
permalink: /topic/%E5%88%86%E5%B8%83%E5%BC%8F%E8%A7%A3%E5%86%B3%E6%96%B9%E6%A1%88/%E6%95%B0%E6%8D%AE%E8%B0%83%E5%BA%A6/%E5%88%86%E5%B8%83%E5%BC%8F%E4%BA%8B%E5%8A%A1/Seata%E6%A1%86%E6%9E%B6/Seata%E8%A7%A3%E5%86%B3%E6%96%B9%E6%A1%88/Sega%E6%A8%A1%E5%BC%8F
topic: 
  - topic
tags: null
categories: 
  - topic
  - 分布式解决方案
  - 数据调度
  - 分布式事务
  - Seata框架
  - Seata解决方案
  - Sega模式
---
Saga模式是SEATA提供的⻓事务解决⽅案，在Saga模式中，业务流程中 每个参与者都提交本地事务，当出现某⼀个参与者失败则补偿前⾯已经成 功的参与者，⼀阶段正向服务和⼆阶段补偿服务都由业务开发实现。

# 基于状态机引擎的 Saga 实现

　　⽬前SEATA提供的Saga模式是基于状态机引擎来实现的，机制是：

1. 基于json格式定义服务调用状态图；
2. 状态图的一个节点可以是一个服务，节点可以配置补偿节点；
3. 状态图json由状态机执行引擎驱动执行，当出现异常状态时状态机引擎执行反向补偿任务将事物回滚；
4. 异常状态发生时是否进行补偿由用户自定义决定；
5. 可以实现服务编排的需求，支持单项选择、并发、异步、子状态机调用、参数转换、参数映射、服务执行状态判断、异常捕获等功能；

　　![](https://image.ztianzeng.com/uPic/20220427111055.png)

# springCloud seata saga接入指南

### 配置状态机

```json
{
  "Name": "purchaseProcess",
  "Comment": "用户下单流程-saga流程",
  "StartState": "CreateOrderNo",
  "Version": "1.0.0",
  "States": {
    "CreateOrderNo": {
      "Comment": "生成订单号服务",
      "Type": "ServiceTask",
      "ServiceName": "com.fly.seata.api.OrderApi",
      "ServiceMethod": "createOrderNo",
      "CompensateState": "CompensationCanalOrder1",
      "Catch": [
        {
          "Exceptions": [
            "java.lang.Throwable"
          ],
          "Next": "CompensationTrigger"
        }],
      "Output": {
        "orderNo":"$.#root"
      },
      "Next": "CreateOrder",
      "Status": {
        "$Exception{java.lang.Throwable}": "UN",
        "#root != null": "SU",
        "#root == null": "FA"
      }
    },
    "CreateOrder": {
      "Comment": "创建订单服务",
      "Type": "ServiceTask",
      "ServiceName": "com.fly.seata.api.OrderApi",
      "ServiceMethod": "createOrder",
      "CompensateState": "CompensationCanalOrder2",
      "Next": "ReduceStorage",
      "Input": [{
          "orderNo": "$.[orderNo]",
          "userId": "$.[order].userId",
          "productId": "$.[order].productId",
          "count": "$.[order].count",
          "price": "$.[order].price"
        }],
      "Catch": [{
          "Exceptions": [
            "java.lang.Throwable"
          ],
          "Next": "CompensationTrigger"
        }],
      "Status": {
        "$Exception{java.lang.Throwable}": "UN",
        "#root != null": "SU",
        "#root == null": "FA"
      }
    },
    "ReduceStorage": {
      "Comment": "扣减库存服务",
      "Type": "ServiceTask",
      "ServiceName": "com.fly.seata.api.StorageApi",
      "ServiceMethod": "reduce",
      "CompensateState": "CompensatingReduceStorage",
      "Next":"Succeed",
      "Input": [{
        "orderNo": "$.[orderNo]",
        "productId": "$.[order].productId",
        "count": "$.[order].count"
      }],
      "Catch": [{
        "Exceptions": [
          "java.lang.Throwable"
        ],
        "Next": "CompensationTrigger"
      }]
    },
    "CompensationCanalOrder1": {
      "Comment": "取消订单补偿服务1--用于订单号生成失败",
      "Type": "ServiceTask",
      "ServiceName": "com.fly.seata.api.OrderApi",
      "ServiceMethod": "canalOrder",
      "Input": [
        "$.[orderNo]",
        1
      ]
    },
    "CompensationCanalOrder2": {
      "Comment": "取消订单补偿服务2--用于订单生成失败",
      "Type": "ServiceTask",
      "ServiceName": "com.fly.seata.api.OrderApi",
      "ServiceMethod": "canalOrder",
      "Input": [
        "$.[orderNo]",
        2
      ]
    },
    "CompensatingReduceStorage": {
      "Comment": "库存补偿服务",
      "Comment": "扣减库存服务",
      "Type": "ServiceTask",
      "ServiceName": "com.fly.seata.api.StorageApi",
      "ServiceMethod": "compensateReduce",
      "Input": [{
        "orderNo": "$.[orderNo]",
        "productId": "$.[order].productId",
        "count": "$.[order].count"
      }]
    },
    "CompensationTrigger": {
      "Type": "CompensationTrigger"
    },
    "Succeed": {
      "Type":"Succeed"
    },
    "Fail": {
      "Type":"Fail",
      "ErrorCode": "STORAGE_FAILED",
      "Message": "purchase failed"
    }
  }
}
```

## 配置状态机引擎

```java
@Configuration
public class SagaConfig {

  @ConfigurationProperties("spring.datasource.saga")
  @Bean
  public DataSource dataSource(){
    return new DruidDataSource();
  }

  @Bean
  public DbStateMachineConfig dbStateMachineConfig(){
    DbStateMachineConfig dbStateMachineConfig = new DbStateMachineConfig();
    dbStateMachineConfig.setDataSource(dataSource());
    Resource[] resources = {new ClassPathResource("statelang/purchase.json")};
    dbStateMachineConfig.setResources(resources);
    dbStateMachineConfig.setEnableAsync(true);
    dbStateMachineConfig.setThreadPoolExecutor(threadPoolExecutor());
    dbStateMachineConfig.setApplicationId("sage-tm");
    dbStateMachineConfig.setTxServiceGroup("my_test_tx_group");
    return dbStateMachineConfig;
  }

  /**
   * saga状态图执行引擎
   * @return
   */
  @Bean
  public StateMachineEngine processCtrlStateMachineEngine(){
    ProcessCtrlStateMachineEngine stateMachineEngine = new ProcessCtrlStateMachineEngine();
    stateMachineEngine.setStateMachineConfig(dbStateMachineConfig());
    return stateMachineEngine;
  }

  @Bean
  public StateMachineEngineHolder stateMachineEngineHolder(){
    StateMachineEngineHolder stateMachineEngineHolder = new StateMachineEngineHolder();
    stateMachineEngineHolder.setStateMachineEngine(processCtrlStateMachineEngine());
    return stateMachineEngineHolder;
  }

  @Bean
  public ThreadPoolExecutor threadPoolExecutor(){
    ThreadPoolExecutorFactoryBean threadPoolExecutorFactoryBean = new ThreadPoolExecutorFactoryBean();
    threadPoolExecutorFactoryBean.setCorePoolSize(1);
    threadPoolExecutorFactoryBean.setMaxPoolSize(20);
    threadPoolExecutorFactoryBean.setThreadNamePrefix("saga_");
    return (ThreadPoolExecutor)threadPoolExecutorFactoryBean.getObject();
  }
}
```

## 状态机执行

```java
@RequestMapping("/tm")
@RestController
public class TmController {

  /**
   * 模拟购买商品流程
   * @return
   */
  @GlobalTransactional
  @GetMapping("/purchase")
  public String purchase(){
    Map<String, Object> startParams = new HashMap<>();
    OrderDTO orderDTO = new OrderDTO();
    orderDTO.setUserId(1l);
    orderDTO.setCount(1);
    orderDTO.setPrice(new BigDecimal(19));
    orderDTO.setProductId(1l);
    startParams.put("order",orderDTO);
    StateMachineInstance stateMachineInstance = stateMachineEngine.start("purchaseProcess",null,startParams);
    return "执行状态:"+stateMachineInstance.getStatus().getStatusString();
  }

}
```
