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
