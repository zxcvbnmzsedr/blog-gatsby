const fs = require('fs')
const path = require('path')
const root = './content/topic/'
/**
 * 获取文件的结构
 * @param filePath 文件路径
 * @returns {unknown[]|*[]}
 */
const getNavStructure = (filePath) => {
    const source = fs.readFileSync(filePath, 'utf8')
    const fileName = path.basename(filePath).split(".")[0]
    const parentName = path.basename(path.resolve(filePath, '..'))
    const router = `/${parentName}/${fileName}`
    const contentWithoutCode = source
        .replace(/^[^#]+\n/g, '')
        .replace(/(?:[^\n#]+)#+\s([^#\n]+)\n*/g, '') // 匹配行内出现 # 号的情况
        // .replace(/^#\s[^#\n]*\n+/, '')
        .replace(/```[^`\n]*\n+[^```]+```\n+/g, '')
        .replace(/`([^`\n]+)`/g, '$1')
        .replace(/\*\*?([^*\n]+)\*\*?/g, '$1')
        .replace(/__?([^_\n]+)__?/g, '$1')
        .trim();

    const pattOfTitle = /#+\s([^#\n]+)\n*|( {0,3}(?:[*+-]|\d{1,9}[.)]))( [^\n]+?)?(?:\n|$)/g;

    const matchResult = contentWithoutCode.match(pattOfTitle);

    if (!matchResult) {
        return [];
    }
    // 索引序列
    let parent = null
    const navData = matchResult.map((r, i) => {
        if (r.match(/( {0,3}(?:[*+-]|\d{1,9}[.)]))/g)) {
            let level = parent.level
            if (parent.type === 'heading') {
                level += 1
            } else if (parent.type === 'list_item' && r.match(/( {0,3}(?:[*+-]|\d{1,9}[.)]))/g)[0].length > parent.text.match(/( {0,3}(?:[*+-]|\d{1,9}[.)]))/g)[0].length) {
                level += 1;
            } else if (parent.type === 'list_item' && r.match(/( {0,3}(?:[*+-]|\d{1,9}[.)]))/g)[0].length < parent.text.match(/( {0,3}(?:[*+-]|\d{1,9}[.)]))/g)[0].length) {
                level -= 1;
            }
            parent = {
                type: 'list_item',
                level: level,
                text: r
            }
            return {
                index: i,
                type: 'list_item',
                level: level,
                text: r
            }

        }
        parent = {
            type: 'heading',
            level: r.match(/^#+/g)[0].length,
            text: r
        }
        return {
            type: 'heading',
            index: i,
            level: r.match(/^#+/g)[0].length,
            text: r.replace(pattOfTitle, '$1')
        }
    });


    let maxLevel = 0;
    navData.forEach((t) => {
        if (t.level > maxLevel) {
            maxLevel = t.level
        }
    })
    let matchStack = [];
    for (let i = 0; i < navData.length; i++) {
        const t = navData[i];
        const {level} = t
        while (matchStack.length && matchStack[matchStack.length - 1].level > level) {
            matchStack.pop();
        }
        if (matchStack.length === 0) {
            const arr = new Array(maxLevel).fill(0);
            arr[level - 1] += 1;
            matchStack.push({
                level,
                arr,
            })
            t.listNo = trimArrZero(arr).join(".")
            t.parentNo = t.listNo.split(".").slice(0, -1).join(".")
            t.href = `${router}#${t.text}`
            continue;
        }
        const {arr} = matchStack[matchStack.length - 1];
        const newArr = arr.slice()
        newArr[level - 1] += 1;
        matchStack.push({
            level,
            arr: newArr
        })
        t.listNo = trimArrZero(newArr).join(".")
        t.parentNo = t.listNo.split(".").slice(0, -1).join(".")
        t.href = `${router}#${t.text}`
    }
    return navData;
}
const trimArrZero = (arr) => {
    let start, end
    for (start = 0; start < arr.length;
         start++
    ) {
        if (arr[start]) {
            break
        }
    }
    for (end = arr.length - 1; end >= 0; end--) {
        if (arr[end]) {
            break
        }
    }
    return arr.slice(start, end + 1)
}
const parseNode = (dir, node) => {
    node.text = node.text.trim()
    // 匹配[abc](123)这种
    if (node.text.match(/\[[\s\S]*?\]\([\s\S]*?\)/g)) {
        const text = node.text.match(/(?<=\[).+(?=\])/g)[0]
        // 根据连接寻找文件，然后衔接到node上
        const link = node.text.match(/(?<=\().+(?=\))/g)[0]
        const pathname = path.join(dir, link)
        node.href = path.join('/', path.basename(path.dirname(pathname)), path.basename(pathname).split(".md")[0])
        const children = buildTree(dir, getNavStructure(pathname).filter(node => node.type === 'heading'))[0].child
        node.child.push(...children)
        node.text = text
    }
}
/**
 * 将list构造成树结构
 * @param list
 * @returns {*[]}
 */
const buildTree = (dir, list) => {
    let map = {}, node, tree = [], i;
    for (i = 0; i < list.length; i++) {
        map[list[i].listNo] = list[i];
        list[i].child = [];
        parseNode(dir, list[i])
    }
    for (i = 0; i < list.length; i += 1) {
        node = list[i];
        if (node.parentNo !== '') {
            console.log(node)
            map[node.parentNo].child.push(node);
        } else {
            tree.push(node);
        }
    }
    return tree;
}
function getTitle(filePath) {
    const source = fs.readFileSync(filePath, 'utf8')

    return source.match(/(?<=^(#+))(.*)/g)[0].trim();
}
/**
 * 1. 解析根目录，扫描所有文件夹
 * 2. 文件夹下的README文件作为根文件，进行第一次解析
 * 3. 递归解析README扩展出的文件
 */
function parse() {
    const dirs = fs.readdirSync(root).filter(file => file !== '.DS_Store');
    for (let dir of dirs) {
        dir = path.join(root, dir);
        const readmeMDs = fs.readdirSync(dir).filter(file => file === 'README.md')
        if (readmeMDs.length === 0) {
            continue
        }
        const readmePath = path.join(dir, readmeMDs[0])
        const tokens = getNavStructure(readmePath);
        const title = getTitle(readmePath)
        const tree = buildTree(dir, tokens)
        fs.writeFileSync(path.join(dir, 'index.json'), JSON.stringify([{
            'tree': JSON.stringify(tree),
            'name': title ? title : path.basename(dir)
        }]))
    }
}
module.exports = {
    parse
}
parse();
