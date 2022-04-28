通过Gatsby生成博客站点

[点击这里查看生成后的效果](https://www.ztianzeng.com)

# 运行方式

```shell
git clone git@github.com:zxcvbnmzsedr/blog-gatsby.git
cd blog-gatsby
yarn install
```

启动思源客户端，配置config.js下的思源笔记对应的url路径和token

```js
siYuan: {
    host: 'http://127.0.0.1:6806/api/',
    token: '<token>',
    box: '<boxId>'
}
```

通过`yarn start`启动项目，启动成功之后访问 localhost:8000 即可访问

![LwEJBV](https://image.ztianzeng.com/uPic/LwEJBV.png)

复制出来的ID，就是对应笔记本的BoxId

笔记本下面分为三块，posts、pages、topic

+ posts 就是日常的博客记录
+ pages 用于存放首页的一些title之类
+ topic 用于存放体系化结构的知识，会通过这些生成思维导图

目前生成出来的文章标签是通过路径标记的，比如笔记本的路径是`/posts/java/HashMap`, 生成出来的文章的标签就是`java`

思维导图的生成逻辑也是通过路径标记的，比如笔记本的路径是`/topic/分布式`和`/topic/并发`，这样就会以`分布式`和`并发`生成两份思维导图

思维导图的顺序是根据手动排序的结果生成。

Posts的顺序是通过文档的创建时间来生成。

以下面的笔记结构为例:

![IdyNzp](https://image.ztianzeng.com/uPic/IdyNzp.png)

生成的思维导图就是这样的:

![FHyPDb](https://image.ztianzeng.com/uPic/FHyPDb.png)

![rsuarD](https://image.ztianzeng.com/uPic/rsuarD.png)

文章就是这样的:

![U0ExiV](https://image.ztianzeng.com/uPic/U0ExiV.png)
