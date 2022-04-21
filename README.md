通过Gatsby生成博客站点

[点击这里查看生成后的效果](https://www.ztianzeng.com)

# 运行方式

```shell
git clone git@github.com:zxcvbnmzsedr/blog-gatsby.git
cd blog-gatsby
yarn install
yarn start
```

启动成功之后访问 localhost:8000 即可访问

然后启动思源本地客户端的，执行下面的命令，将markdown文件导入到本工程中，导入的位置在 content/pages 下

```shell
yarn siyuan
```

# 运行过程

其脚本原理是通过API接口，扫描对应的笔记本，将笔记本中的内容生成markdown文件

导入的脚本在siyuan.jsx中,通过修改导出路径和笔记本对应的box的ID即可完成导出

```js

try {
    getSiyuan({path: './content/posts/', box: '20220420112442-p6q6e8w'}).catch(e => {
        console.log(e)
    })
} catch (e) {
    console.log(e);
}
```

# 其他功能

其中还通过扫描content/topic/ 路径下的markdown文件可以生成思维导图

就像这样:

![VaXToq](https://image.ztianzeng.com/uPic/VaXToq.png)

