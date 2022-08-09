const fetch = require('isomorphic-fetch');
const path = require('path')
const cheerio = require('cheerio');

class SiYuan {
  constructor(token, host, box) {
    this.token = token
    this.host = host
    this.box = box
  }

  param = (data) => {
    return {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Token ${this.token}`,
      },
      body: JSON.stringify(data)
    }
  }
  getFormatDate = ({date}) => {
    return `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)} ${date.slice(8, 10)}:${date.slice(10, 12)}`
  }


  addLevel = (root, level) => {
    root.level = level;
    if (root && root.children) {
      root.children.sort((a, b) => {
        if (a.type === 'h' && b.type === 'd') {
          return -1;
        }
        return a.sort - b.sort;
      }).forEach(e => this.addLevel(e, level + 1))
    }
  }
  merge = (pathTree, treeList) => {
    if (pathTree) {
      for (let i = 0; i < pathTree.length; i++) {
        for (let filterKey of treeList.filter((tree) => tree.parentId === pathTree[i].id)) {
          pathTree[i].children.push(filterKey)
        }
        this.merge(pathTree[i].children, treeList)
      }
    }
  }
  getTreeNode = (data, sortData) => {
    return {
      title: data['content'],
      id: data['id'],
      type: data['type'],
      href: data['type'] === 'h' ? data['hpath'] + '#' + data['content'] : data['hpath'],
      parentId: data['parent_id'],
      path: data['hpath'],
      parentPath: path.join(data['hpath'], '..'),
      sort: sortData[data['id']],
      children: []
    }
  }
  parseTreeForPath = (arr, p) => {
    function loop(p) {
      return arr.reduce((acc, cur) => {
        if (cur.parentPath === p) {
          const l = loop(cur.path)
          if (l.length > 0) {
            l.forEach(e => {
              cur.children.push(e)
            })
          }
          acc.push(cur)
        }
        return acc
      }, [])
    }

    return loop(p)
  }

  getData = (url, data) => {
    // console.log(this.param(data))
    return fetch(this.host + url, this.param(data)).then(res => {
      if (res.status >= 400) {
        console.log(res);
        const err = new Error('http server error');
        err.res = res;
        throw err;
      }
      return res.json();
    })
  }

  async getSiYuanTopic() {
    const topicList = await this.getData('query/sql', {stmt: `select id,hpath, LTRIM(hpath, '/topic/') as topic from blocks where box = '${this.box}' and (type = 'd')  and hpath like '/topic/%' and topic not like '%/%'`});
    const res = []

    const sortData = await this.getData('file/getFile', {path: `/data/${this.box}/.siyuan/sort.json`})
    for (const topic of topicList.data) {
      const topicData = await this.getData('query/sql', {stmt: `select sort,content, created, type, hpath, parent_id,id from blocks where box = '${this.box}' and (type = 'd') and hpath like '${topic.hpath}%'`});
      const treeList = topicData.data.map(e => this.getTreeNode(e, sortData)).sort((a, b) => a.sort - b.sort);
      const pathTree = this.parseTreeForPath(treeList.filter(({type}) => type === 'd'), topic.hpath)

      this.merge(pathTree, treeList)

      const root = {
        title: topic.topic,
        id: topic.id,
        parentId: '',
        href: topic.hpath,
        path: topic.hpath,
        children: pathTree
      }
      this.addLevel(root, 0)
      res.push(root)
    }
    return res;
  }

  headingTreeToList({result, children}) {
    children.map(e => {
      result.put({
        id: e.id,
        name: e.name
      })
    })
  }

  /**
   *
   * @param box
   */
  async getSiYuanPost() {
    const siYuanBox = await this.getData('query/sql', {stmt: `select * from blocks where box = '${this.box}' and type='d' order by created desc`});
    return await Promise.all(siYuanBox.data.map(async (siYuanBoxData) => {
      const {id, content, created} = siYuanBoxData;
      const {data} = await this.getData('export/exportMdContent', {id});
      const htmlResult = await this.getData('export/preview', {id});
      const html = htmlResult.data.html
      const htmlParser = cheerio.load(html)
      const headings = []
      htmlParser('h1,h2,h3,h4,h5').each((index, item) => {
        const i = htmlParser(item)
        headings.push({
          value: i.text(),
          depth: 0 | item.name.slice(-1),
          slug: i.attr('id')
        })
      });
      const contentType = data.hPath.split('/')[1];
      if (contentType === 'posts') {
        if (!data.content.trim() || data.content.trim() === `# ${content}`) {
          return
        }
      }

      const attributes = await this.getData('query/sql', {
        stmt: `select name,value from attributes where block_id = '${id}' union \n
                       SELECT type, group_concat(content) \n
                        from spans \n
                        where type = 'tag' \n
                               and block_id = '${id}' \n
                        group by type`
      });
      const attribute = attributes.data.reduce((r, item) => (
        {
          ...r,
          [item.name]: item.value,
        }
      ), {});
      const template = attribute['custom-template']
      const slug = attribute['custom-slug']
      const tags = []
      // const tags = data.hPath.split('/').slice(2, -1).filter(e => e !== '')
      if (attribute['tag']) {
        tags.push.apply(tags, attribute['tag'].split(','));
      }
      return {
        ...siYuanBoxData,
        html,
        title: content,
        template,
        headings,
        slug: slug ? slug : data.hPath,
        raw: data.content,
        date: this.getFormatDate({date: created}),
        tags,
        contentType,
      }
    }))
  }

}

module.exports = {
  SiYuan
}


const fs = require('fs')
const s = new SiYuan('noeyqg6qknhqvl5m',
  'http://127.0.0.1:6806/api/',
  '20220420112442-p6q6e8w'
)

function mkdirsSync(dirname) {
  if (fs.existsSync(dirname)) {
    return true;
  } else {
    if (mkdirsSync(path.dirname(dirname))) {
      fs.mkdirSync(dirname);
      return true;
    }
  }
}

s.getSiYuanPost()
  .then(e => {
      fs.rmSync(path.join('.', 'docs', 'topic'), {recursive: true})
      fs.rmSync(path.join('.', 'docs', 'posts'), {recursive: true})
      e.forEach(raw => {
        if (raw && (raw.hpath.indexOf('posts') !== -1 || raw.hpath.indexOf('topic') !== -1)) {
          parswRaw(raw)
          mkdirsSync(path.join('.', 'docs', raw.hpath))
          fs.writeFileSync(path.join('.', 'docs', raw.hpath, 'README.md'), raw.raw)
        }
      })
    }
  )

s.getSiYuanTopic().then(e => {
  var sidebar = {}
  addPath(e)
  toSideBar(sidebar, e)
  mkdirsSync(path.join('.', 'docs', '.vuepress'))
  fs.writeFileSync(path.join('.', 'docs', '.vuepress', 'topic.json'), JSON.stringify(sidebar))
})

function parswRaw(raw) {
  var head = `---`
  head += `\ntitle: ${raw.title}`
  head += `\ndate: ${raw.date}`
  head += `\npermalink: ${encodeURI(raw.hpath)}`
  if (raw.contentType === 'posts') {
    head += `\ncategories:`
    head += `\n- ${raw.contentType}`
  }
  if (raw.contentType === 'topic') {
    head += `\ntopic:`
    head += `\n- ${raw.contentType}`
  }
  if (raw.tags) {
    head += `\ntags: `
    for (var i = 1, len = raw.tags.length; i < len; i++) {
      head += `\n- ${raw.tags[i]}`
    }
  }
  head += `\n---`
  raw.raw = head + '\n' + raw.raw
}

function addPath(topicList) {
  for (let index in topicList) {
    var topic = topicList[index]
    topic.path = topic.path + '/'
    topic.collapsable = false
    addPath(topic.children)
  }
}

function toSideBar(sidebar, topicList) {
  for (let index in topicList) {
    var topic = topicList[index]
    if (topic.level === 0) {
      sidebar[topic.path] = []
      sidebar[topic.path].push({
        "title": topic.title,
        "path": topic.path
      })
      sidebar[topic.path].push(...topic.children);
    }
  }
}
