const fetch = require('isomorphic-fetch');
const {siYuan} = require("./config");
const path = require('path')

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
const getFormatDate = ({date}) => {
    return `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)} ${date.slice(8, 10)}:${date.slice(10, 12)}`
}
const getHead = ({title, date, tags}) => {
    const formatDate = getFormatDate({date});
    return `---\n` +
        `title: ${title}\n` +
        `date: ${formatDate}\n` +
        `tags: [${tags}]\n` +
        `---\n`
}

function getData(url, data) {
    return fetch(siYuan.host + url, param(data)).then(res => {
        if (res.status >= 400) {
            console.log(res);
            const err = new Error('http server error');
            err.res = res;
            throw err;
        }
        return res.json();
    })
}


/**
 *
 * @param path
 * @param box
 * @param hpath
 * @returns {Promise<undefined | Object<{}>>}
 */
async function getSiYuanPost({box}) {
    const siYuanBox = await getData('query/sql', {stmt: `select * from blocks where box = '${box}' and type='d' order by created desc`});
    const list = await Promise.all(siYuanBox.data.map(async (siYuanBoxData) => {
        const {id, content, created} = siYuanBoxData;
        const {data} = await getData('export/exportMdContent', {id});
        if (!data.content.trim()) {
            return
        }
        const attributes = await getData('query/sql', {stmt: `select name,value from attributes where block_id = '${id}'`});
        const attribute = attributes.data.reduce((r, item) => (
                {
                    ...r,
                    [item.name]: item.value,
                }
            ), {})
        ;
        const template = attribute['custom-template']
        const slug = attribute['custom-slug']
        const tags = data.hPath.split('/').slice(2, -1).filter(e => e !== '')
        return {
            ...siYuanBoxData,
            title: content,
            template,
            slug: slug ? slug : data.hPath,
            raw: data.content,
            date: getFormatDate({date: created}),
            tags: tags,
            contentType: data.hPath.split('/')[1],
        }
    }));
    return list
}

const addLevel = (root, level) => {
    root.level = level;
    if (root && root.children) {
        root.children.sort((a, b) => a.sort - b.sort).forEach(e => addLevel(e, level + 1))
    }
}

async function getSiYuanTopic({box}) {
    const topicList = await getData('query/sql', {stmt: `select id,hpath, LTRIM(hpath, '/topic/') as topic from blocks where box = '${box}' and (type = 'h' or type = 'd')  and hpath like '/topic/%' and topic not like '%/%'`});
    const res = []

    const sortData = await getData('file/getFile', {path: `/data/${box}/.siyuan/sort.json`})
    for (const topic of topicList.data) {
        const topicData = await getData('query/sql', {stmt: `select sort,content, created, type, hpath, parent_id,id from blocks where box = '${box}' and (type = 'h' or type = 'd') and hpath like '${topic.hpath}%'`});
        const treeList = topicData.data.map(e => getTreeNode(e, sortData)).sort((a, b) => a.sort - b.sort);
        const or = parseTreeParentId(treeList, '')
        const o2 = parseTreePath(or, topic.hpath)
        const root = {
            title: topic.topic,
            id: topic.id,
            parentId: '',
            href: topic.hpath,
            path: topic.hpath,
            children: o2
        }
        addLevel(root, 0)
        res.push(root)
    }
    return res;
}


module.exports = {
    getSiYuanPost, getSiYuanTopic
}
const getTreeNode = (data, sortData) => {
    return {
        title: data['content'],
        id: data['id'],
        href: data['hpath'] + '#' + data['content'],
        parentId: data['parent_id'],
        path: data['hpath'],
        sort: sortData[data['id']],
        children: []
    }
}

const parseTreeParentId = (arr, parentId) => {
    function loop(parentId) {
        return arr.reduce((acc, cur) => {
            if (cur.parentId === parentId) {
                cur.children = loop(cur.id)
                acc.push(cur)
            }
            return acc
        }, [])
    }

    return loop(parentId)
}
const parseTreePath = (arr, p) => {
    function loop(p) {
        return arr.reduce((acc, cur) => {
            const parentPath = path.join(cur.path, '..')
            if (parentPath === p) {
                const l = loop(cur.path)
                if (l.length > 0) {
                    l.forEach(e => cur.children.push(e))
                }
                acc.push(cur)
            }
            return acc
        }, [])
    }

    return loop(p)
}
// const fs = require('fs')
//
// getSiYuanTopic({box: '20220420112442-p6q6e8w'})
//     .then(e => fs.writeFileSync(path.join('.', 'index.json'), JSON.stringify(e)))
