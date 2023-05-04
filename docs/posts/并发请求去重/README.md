---
title: 并发请求去重
date: 2022-05-25 20:17
permalink: /posts/%E5%B9%B6%E5%8F%91%E8%AF%B7%E6%B1%82%E5%8E%BB%E9%87%8D
categories:
- posts
tags: 
---
# 并发请求去重

# 背景

一些请求在某种情况下，会导致重复请求，比如:

* Nginx反向代理下游服务器，下游服务器超时自动故障转移进行重试
* 前端按钮重复点击，没有做处理
* 分布式环境下，请求出现错误进行重试
* 甚至于[重放攻击](https://zh.wikipedia.org/wiki/%E9%87%8D%E6%94%BE%E6%94%BB%E5%87%BB)

因此，对于后端来说需要统一去处理这种情况。

# 利用唯一编号进行去重

在分布式环境下，我们可以借助Redis来进行数据去重,伪代码如下: 

```java
fun 是否第一次访问(key){
    if (redis.setKey(key,key,超时时间)){
	return true
    }else {
	return false
    }
}
```

所以，目前的问题就是这个关键的key怎么生成

## 提前下发

我们可以提供一个接口，提前下发一个key下去，在请求的时候带上这个key就可以完成重复接口的判断

但是这种方式会导致开发成本变大，不太适合用这个

## 唯一索引

 数据库处理就是设置唯一索引，可设联合唯一索引用来处理重复数据。

> 缺点：如果业务场景就是应该存储重复的数据，则该种方式不可用。

## 业务参数去重

主流的方式都是采用业务参数进行去重

我们可以对请求的参数进行一个升序排序，拼接成一个字符串，然后字符串转成MD5来作为请求的key。

代码如下：

> 因为用的是SpringMVC来做处理，参数都是用Bean来声明，所以加密的时候可以去掉排序这项，因为反序列化的顺序就是Bean中的顺序

```java
@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
public @interface RepeatableCommit {

    /**
     * 根据UserId限制重复提交
     * 取不到 ID 会报错
     */
    boolean userId() default true;

    /**
     * 用于定义区别重复提交的Key SPEl语法描述，就和CacheAble一样
     * <p>
     * 默认直接按照整个类去区分
     */
    String key() default "";

    /**
     * 指定时间内不可重复提交,单位毫秒
     */
    long timeout() default 3000;
}

@Aspect
@Component
public class RepeatableCommitAspect {

    @Autowired
    private RedisConnectionFactory redisConnectionFactory;

    @Around("@annotation(com.easysoft.puyao.config.RepeatableCommit)")
    public Object around(ProceedingJoinPoint point) throws Throwable {
        MethodSignature signature = (MethodSignature) point.getSignature();
        Method method = signature.getMethod();
        RepeatableCommit commitAnnotation = method.getAnnotation(RepeatableCommit.class);
        String[] parameterNames = new LocalVariableTableParameterNameDiscoverer().getParameterNames(signature.getMethod());


        String className = method.getDeclaringClass().getName();
        String commitKey = handlerKey(commitAnnotation.key(), parameterNames, point.getArgs());

        String key;

        if (commitAnnotation.userId()) {
            String userId = BaseContextHandler.getUserId();
            if (userId == null) {
                throw new BizRuntimeException(API_REQUEST_LIMIT_ERROR, "请求失败，UserID不能为空");
            }
            key = StrUtil.format("{}_{}_{}", className, commitKey, userId);
        } else {
            key = StrUtil.format("{}_{}", className, commitKey);
        }


        long timeout = commitAnnotation.timeout();
        RedisLockRegistry redisLockRegistry = new RedisLockRegistry(redisConnectionFactory, "new_king", timeout);

        Lock lock = redisLockRegistry.obtain("lock:" + key);
        if (!lock.tryLock()) {
            throw new BizRuntimeException(API_REQUEST_LIMIT_ERROR, "重复请求");
        }
        //执行方法
        return point.proceed();
    }

    /**
     * 处理用于过滤重复请求的key
     */
    private String handlerKey(String key, String[] params, Object[] args) {
        if (StringUtils.isEmpty(key)) {
            return SecureUtil.md5(JSONObject.toJSONString(args));
        }
        Object request = getRequest(key, params, args);
        return SecureUtil.md5(JSONObject.toJSONString(request));
    }

    /**
     * 通过spring Spel 获取参数
     *
     * @param key            定义的key值 以#开头 例如:#user
     * @param parameterNames 形参
     * @param values         形参值
     * @return
     */
    public Object getRequest(String key, String[] parameterNames, Object[] values) {

        //spel解析器
        ExpressionParser parser = new SpelExpressionParser();
        //spel上下文
        EvaluationContext context = new StandardEvaluationContext();
        for (int i = 0; i < parameterNames.length; i++) {
            context.setVariable(parameterNames[i], values[i]);
        }
        return parser.parseExpression(key).getValue(context);
    }
}
```
