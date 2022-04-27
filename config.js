module.exports = {
    siteMetadata: {
        title: `天增`,
        author: {
            name: `天增的博客`,
            summary: `一期一会，世当珍惜`,
        },
        image: {},
        description: `一期一会，世当珍惜`,
        siteUrl: `https://www.ztianzeng.com`,
        social: {
            github: `zxcvbnmzsedr`,
        },
        socialLinks: [
            {
                name: 'GitHub',
                url: 'https://github.com/zxcvbnmzsedr',
            },
            {
                name: 'Email',
                url: 'mailto:i@ztianzeng.com'
            }
        ],
    },
    valine: {
        appId: process.env.VALINE_APPID || '<valine.APPID>',
        appKey: process.env.VALINE_APPKEY || '<valine.APPKEY>'
    },
    google: {
        trackingId: 'G-MEZSZT13C9'
    },
    baidu: {
        siteId: '305970e09045d4afbab60ece95d61930'
    },
    siYuan: {
        host: process.env.SIYUAN_HOST || 'http://127.0.0.1:6806/api/',
        token: process.env.SIYUAN_TOKEN || '<token>',
        box: process.env.SIYUAN_BOX || '20220420112442-p6q6e8w'
    }
}
