---
title: MySQL性能优化-索引下推
date: 2022-08-08 15:07
permalink: /posts/MySQL%E6%80%A7%E8%83%BD%E4%BC%98%E5%8C%96-%E7%B4%A2%E5%BC%95%E4%B8%8B%E6%8E%A8
categories:
- posts
tags: 
---
　　索引下推是MySQL5.6的一个新特性，在之前是没有的，这块的知识比较冷门。

　　索引下推通俗一点讲就是 `在Service层把查询工作下推到引擎层去处理`。其下推的目的是为了减少回表次数，提高查询效率，节约IO开销。

　　

## MySQL的查询逻辑

　　![](https://image.ztianzeng.com/uPic/20220808152254.png)​

　　当客户端从连接过来之后，就交由给Service层来进行处理，Service主要是执行一些语句的处理和优化，然后交由给引擎层进行处理。

　　在这个当中，原本由Service层处理的一些逻辑，下推到引擎层进行处理，这个过程就叫做索引下推。

## 案例

　　![](https://image.ztianzeng.com/uPic/20220808153434.png)​

　　创建一个表，然后对name 和 age 建立一个联合索引。

```sql
create index idx on user(name,age);
```

　　然后我们执行一个简单的查询，来分析他是怎么进行处理的

```sql
select * from user where name like '张%' and age = 10;
```

### 没有使用索引下推

　　在没有使用索引下推的情况下 

　　存储引擎读取索引记录，根据索引中的主键值回表读取出完整的行记录；

　　存储引擎将回表之后的数据提交给Service层去检测，剩下的age是否满足Where条件。

　　也就是说，原本即使配置了二级索引，也不会起效

　　![](https://image.ztianzeng.com/uPic/20220808154308.png)​

### 使用了索引下推

　　使用了索引下推之后，在引擎层就做了age的判断，因为做了判断在回表的时候只需要回表一次即可。

　　![](https://image.ztianzeng.com/uPic/20220808154457.png)​

## 总结

　　如果我么能用Explain去查看这个SQL

```sql
explain select * from user where name linke '张%' and age = 10
```

　　就能看到Extra一列中，Using index condition。这就是用到索引下推。
