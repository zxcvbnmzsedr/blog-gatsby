---
title: TCC模式
date: 2022-04-26 16:00
permalink: /topic/%E5%88%86%E5%B8%83%E5%BC%8F%E8%A7%A3%E5%86%B3%E6%96%B9%E6%A1%88/%E6%95%B0%E6%8D%AE%E8%B0%83%E5%BA%A6/%E5%88%86%E5%B8%83%E5%BC%8F%E4%BA%8B%E5%8A%A1/Seata%E6%A1%86%E6%9E%B6/Seata%E8%A7%A3%E5%86%B3%E6%96%B9%E6%A1%88/TCC%E6%A8%A1%E5%BC%8F
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
  - TCC模式
---
TCC 与 Seata AT 事务⼀样都是两阶段事务，它与 AT 事务的主要区别为：

* TCC 对业务代码侵⼊严重

  每个阶段的数据操作都要⾃⼰进⾏编码来实现，事务框架⽆法⾃动处理。

* TCC 性能更⾼

  不必对数据加全局锁，允许多个事务同时操作数据。

　　![ecaeda572495e4ea5e308fb938a38fd5](https://image.ztianzeng.com/uPic/ecaeda572495e4ea5e308fb938a38fd5.png)

　　Seata TCC整体是`两阶段提交`的模型。

　　⼀个分布式的全局事务，全局事务是由若⼲分⽀事务组成的，分⽀事务要满⾜`两阶段提交`的模型要求，即需要每个分⽀事务都具备⾃⼰的：

* ⼀阶段 prepare ⾏为
* ⼆阶段 commit 或 rollback ⾏为

　　![](https://image.ztianzeng.com/uPic/20220427100423.png)

　　TCC 模式，不依赖于底层数据资源的事务⽀持：

* ⼀阶段 prepare ⾏为：调⽤ ⾃定义 的 prepare 逻辑。

* ⼆阶段 commit ⾏为：调⽤ ⾃定义 的 commit 逻辑。

* ⼆阶段 rollback ⾏为：调⽤ ⾃定义 的 rollback 逻辑。

　　TCC 模式，是指⽀持把`⾃定义`的分⽀事务纳⼊到全局事务的管理中。

　　

# 第⼀阶段 Try

　　以账户服务为例，当下订单时要扣减⽤户账户⾦额：

　　假如⽤户购买 100 元商品，要扣减 100 元。

　　![](https://image.ztianzeng.com/uPic/20220427100935.png)

　　TCC 事务⾸先对这100元的扣减⾦额进⾏预留，或者说是先冻结这100元

　　![](https://image.ztianzeng.com/uPic/20220427101002.png)

# 第⼆阶段 Confirm

　　如果第⼀阶段能够顺利完成，那么说明“扣减⾦额”业务(分⽀事务)最终肯定 是可以成功的。

　　当全局事务提交时， TC会控制当前分⽀事务进⾏提交，如 果提交失败，TC 会反复尝试，直到提交成功为⽌。

　　当全局事务提交时，就可以使⽤冻结的⾦额来最终实现业务数据操作：

　　![](https://image.ztianzeng.com/uPic/20220427101024.png)

# 第⼆阶段 Cancel

　　如果全局事务回滚，就把冻结的⾦额进⾏解冻，恢复到以前的状态，TC 会 控制当前分⽀事务回滚，如果回滚失败，TC 会反复尝试，直到回滚完成为⽌。

　　![image.png](assets/image-20220427101106-zhsw0mu.png)

# 多个事务并发的情况

　　多个TCC全局事务允许并发，它们执⾏扣减⾦额时，只需要冻结各⾃的⾦额即可：

　　![](https://image.ztianzeng.com/uPic/20220427101229.png)

# SpringCloud集成TCC

### 定义TCC接口

　　由于我们使用的是 SpringCloud + Feign，Feign的调用基于http，因此此处我们使用`@LocalTCC`便可。值得注意的是，`@LocalTCC`一定需要注解在接口上，此接口可以是寻常的业务接口，只要实现了TCC的两阶段提交对应方法便可，TCC相关注解如下：

* `@LocalTCC` 适用于SpringCloud+Feign模式下的TCC
* `@TwoPhaseBusinessAction` 注解try方法，其中name为当前tcc方法的bean名称，写方法名便可（全局唯一），commitMethod指向提交方法，rollbackMethod指向事务回滚方法。指定好三个方法之后，seata会根据全局事务的成功或失败，去帮我们自动调用提交方法或者回滚方法。
* `@BusinessActionContextParameter` 注解可以将参数传递到二阶段（commitMethod/rollbackMethod）的方法。
* `BusinessActionContext` 便是指TCC事务上下文

```java
/**
 * 这里定义tcc的接口
 * 一定要定义在接口上
 * 我们使用springCloud的远程调用
 * 那么这里使用LocalTCC便可
 *
 * @author tanzj
 */
@LocalTCC
public interface TccService {
 
    /**
     * 定义两阶段提交
     * name = 该tcc的bean名称,全局唯一
     * commitMethod = commit 为二阶段确认方法
     * rollbackMethod = rollback 为二阶段取消方法
     * BusinessActionContextParameter注解 传递参数到二阶段中
     *
     * @param params  -入参
     * @return String
     */
    @TwoPhaseBusinessAction(name = "insert", commitMethod = "commitTcc", rollbackMethod = "cancel")
    String insert(
            @BusinessActionContextParameter(paramName = "params") Map<String, String> params
    );
 
    /**
     * 确认方法、可以另命名，但要保证与commitMethod一致
     * context可以传递try方法的参数
     *
     * @param context 上下文
     * @return boolean
     */
    boolean commitTcc(BusinessActionContext context);
 
    /**
     * 二阶段取消方法
     *
     * @param context 上下文
     * @return boolean
     */
    boolean cancel(BusinessActionContext context);
}
```

### TCC接口的业务实现

　　为了保证代码的简洁，此处将路由层与业务层结合讲解，实际项目则不然。

* 在try方法中使用`@Transational`可以直接通过spring事务回滚关系型数据库中的操作，而非关系型数据库等中间件的回滚操作可以交给rollbackMethod方法处理。
* 使用context.getActionContext("params")便可以得到一阶段try中定义的参数，在二阶段对此参数进行业务回滚操作。
* **注意1：**此处亦不可以捕获异常（同理切面处理异常），否则TCC将识别该操作为成功，二阶段直接执行commitMethod。
* **注意2：**TCC模式要**开发者自行**保证幂等和事务防悬挂

```java
@Slf4j
@RestController
public class TccServiceImpl implements  TccService {
 
    @Autowired
    TccDAO tccDAO;
 
    /**
     * tcc服务t（try）方法
     * 根据实际业务场景选择实际业务执行逻辑或者资源预留逻辑
     *
     * @param params - name
     * @return String
     */
    @Override
    @PostMapping("/tcc-insert")
    @Transactional(rollbackFor = Exception.class, propagation = Propagation.REQUIRED)
    public String insert(@RequestBody Map<String, String> params) {
        log.info("xid = " + RootContext.getXID());
        //todo 实际的操作，或操作MQ、redis等
        tccDAO.insert(params);
        //放开以下注解抛出异常
        //throw new RuntimeException("服务tcc测试回滚");
        return "success";
    }
 
    /**
     * tcc服务 confirm方法
     * 若一阶段采用资源预留，在二阶段确认时要提交预留的资源
     *
     * @param context 上下文
     * @return boolean
     */
    @Override
    public boolean commitTcc(BusinessActionContext context) {
        log.info("xid = " + context.getXid() + "提交成功");
        //todo 若一阶段资源预留，这里则要提交资源
        return true;
    }
 
    /**
     * tcc 服务 cancel方法
     *
     * @param context 上下文
     * @return boolean
     */
    @Override
    public boolean cancel(BusinessActionContext context) {
        //todo 这里写中间件、非关系型数据库的回滚操作
        System.out.println("please manually rollback this data:" + context.getActionContext("params"));
        return true;
    }
}
```
