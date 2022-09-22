const config = require('./topic.json')

function getTopicItems() {
  const res = []
  for (const i in config) {
    var topic = config[i][0]
    res.push({
      text: topic.title,
      link: topic.path
    })
  }
  return res
}

module.exports = {
  theme: 'vdoing',
  title: '天增的博客',
  description: '一期一会，世当珍惜',
  plugins: [
    [
      'rss-feed',
      {
        username: 'ztianzeng',
        hostname: 'https://www.ztianzeng.com',
        selector: '.content__post', // extract content to content:encoded
        count: 100,
        filter: (page) => /^post/.test(page.relativePath),
      },
    ],
    ['vuepress-plugin-baidu-tongji-analytics', {
      key: '305970e09045d4afbab60ece95d61930'
    }]
  ],
  head: [
    [
      'link', {rel: 'shortcut icon', type: "image/x-icon", href: `/logo.svg`},
    ]
  ],
  themeConfig: {
    footer: {
      createYear: 2015, // 博客创建年份
      copyrightInfo:
        '天增 | <a href="https://beian.miit.gov.cn/" target="_blank">苏ICP备16037388号-1</a>'
    },
    nav: [
      {
        text: '首页',
        link: '/'
      },
      {
        text: '博客',
        link: '/categories/?category=posts'
      },
      {
        text: '专题',
        items: getTopicItems()
      },
      {
        text: 'Github',
        link: 'https://github.com/zxcvbnmzsedr',
      },
      {
        text: 'Rss',
        link: 'https://www.ztianzeng.com/rss.xml',
      },
    ],
    sidebar: config
  }
}
