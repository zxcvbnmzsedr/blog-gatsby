---
title: 兜兜转转，最后用Gastby重写了我的博客
date: 2022-04-21 17:07
permalink: /posts/%E5%85%9C%E5%85%9C%E8%BD%AC%E8%BD%AC%EF%BC%8C%E6%9C%80%E5%90%8E%E7%94%A8Gastby%E9%87%8D%E5%86%99%E4%BA%86%E6%88%91%E7%9A%84%E5%8D%9A%E5%AE%A2
categories:
- posts
tags: 
---
# 兜兜转转，最后用Gastby重写了我的博客

6年前，我建立的自己的一个个人博客。最开始是采用WordPress进行构建，但是由于那个时候由于还是学生，可以通过腾讯云学生优惠拿到10块钱一个月的机器，勉强还算能玩。

随着，腾讯云优惠的结束，服务器开销着实承担不起，后面就尝试寻找在线博客，当时的简书、CSDN、博客园等在线博客平台都注册了账号，体验过后都不是很满意。

后面，随着以Hexo为首的静态站点生成框架的兴起，可以通过OSS方便的生成自己的网站，后面采用Hexo尝试了一段时间

随着时间的流逝~~~~~

有几个月没有写博客，就导致Hexo的命令完全就忘光了~~~~

而且当时为了国内能够顺利的访问还把源码托管在国内的某个平台上，长达半年多没写，甚至连托管在哪个平台上都不知道了。

后面有继续转站带有客户端的静态网站生成工具Gridea，也由于无法满足自己的需要，所以最后也放弃了~~~~

索性自己就推导重来，都是静态网站，React搞一搞，难度也不是很大~~~

经过一番折腾选择了Gastby作为基础框架来生成自己的网站~~~

## 为啥是Gastby嘞

|博客系统|开发语言|模板语言|类型|优势|
| ----------| -----------| ------------| ------| --------------|
|**[Hexo]()**|Node.js|EJS|静态|中文资料多|
|**[Hugo]()**|Go|Go|静态|编译超快|
|**[Jekyll]()**|Ruby|Liquid|静态|/|
|[Ghost](https://ghost.org/)|Node.js|Handlebars|CMS|默认主题好看|
|**[Gatsby]()**|JS(React)|JS(React)|静态|React|
|[Typecho](https://typecho.org/)|PHP|PHP|静态|/|
|[WordPress](https://wordpress.org/)|PHP|PHP|CMS|/|
|[Gridea](https://gridea.dev)|JS(Vue)|EJS|静态|/|
|**[Gridsome]()**|JS(Vue)|JS(Vue)|静态|Vue|
|[Halo](https://halo.run/)|Java|Freemarker|CMS|/|
|**[Pelican]()**|Python|Jinja|静态|Python|

1. 支持Markdown语法
2. 生态繁荣
3. 无后端
4. 可定制化程度高
5. 得是熟悉的技术栈！！！

目前前端就会个React，所以自然就选择了Gastby。

‍

## 界面设计

大部分的界面是我抄的，css调起来要人命，还不一定有别人的好看

唯一有特色的，就是扫描markdown文件来生成思维导图

大概长这样：

![VaXToq](https://image.ztianzeng.com/uPic/VaXToq.png)

## 数据哪来?

在整个网站中，系统分为两个部分

1. posts: 记录日常的文章
2. topic: 体系化的知识，不会东一点西一点

由于topic的知识，是需要通过扫描本地文件的，所以目前还是和工程放置在一起的。

而posts的文章，是通过思源笔记来进行生成的

得益于思源笔记开放的API，可以通过API将在笔记上写的文章，导出到对应的文件夹下，达到了共存。。

代码大概是这样:

```js
const fs = require('fs')
const fetch = require('isomorphic-fetch');
const param = (data) => {
    return {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    }
}
const getHead = ({title, date, tags}) => {
    const formatDate = `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)} ${date.slice(8, 10)}:${date.slice(10, 12)}  `;
    return `---\n` +
        `title: ${title}\n` +
        `date: ${formatDate}\n` +
        `tags: [${tags}]\n` +
        `---\n`
}
const host = 'http://127.0.0.1:6806/api/'

function getData(url, data) {
    return fetch(host + url, param(data)).then(res => {
        if (res.status >= 400) {
            console.log(res);
            const err = new Error('http server error');
            err.res = res;
            throw err;
        }
        return res.json();
    })
}

function delDir(path) {
    let files = [];
    if (fs.existsSync(path)) {
        files = fs.readdirSync(path);
        files.forEach((file, index) => {
            let curPath = path + "/" + file;
            if (fs.statSync(curPath).isDirectory()) {
                delDir(curPath); //递归删除文件夹
            } else {
                fs.unlinkSync(curPath); //删除文件
            }
        });
        fs.rmdirSync(path);
    }
}

async function getSiyuan({path, box}) {
    delDir(path)
    fs.mkdirSync(path)
    const pathArray = path.split('/')
    const json = await getData('query/sql', {stmt: `select * from blocks where box = '${box}' and type='d'`});
    for (let i = 0; i < json.data.length; i++) {
        const {id, content, created} = json.data[i];
        const {data} = await getData('export/exportMdContent', {id});
        if (!data.content.trim()) {
            continue
        }
        const tags = data.hPath.split('/').filter(e => !pathArray.includes(e)).slice(0,-1)
        console.log(content, tags)
        const head = getHead({title: content, date: created, tags})
        fs.writeFile(path + content + '.md', head + data.content, err => {
            if (err) {
                console.error(err)
            }
        })
    }
}

try {
    getSiyuan({path: './content/posts/', box: '20220420112442-p6q6e8w'}).catch(e => {
        console.log(e)
    })
} catch (e) {
    console.log(e);
}
```

这样就能将思源笔记中的文章，导出成markdown文档写入到项目中。。这样就不需要找额外的客户端来编写markdown，all in one

## 

这样其实还有个缺陷，就是修改文档的时候需要重新生成，提交给github进行打包~~~

目前此点无解，除非哪天思源提供了在线API的服务~~~

利用graphql来生成文章，就避免了持续生成的烦恼~~~

‍
