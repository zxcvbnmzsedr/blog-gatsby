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
  head: [
    ['link', {rel: 'shortcut icon', type: "image/x-icon", href: `/logo.svg`}]
  ],
  themeConfig: {
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
      }
    ],
    sidebar: config
  }
}
