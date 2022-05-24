require("dotenv").config({
    path: `.env.${process.env.NODE_ENV}`,
})
const {valine, google, baidu, siteMetadata} = require('./config.js')
module.exports = {
    siteMetadata,
    plugins: [
        `gatsby-plugin-styled-components`,
        `gatsby-plugin-image`,
        {
            resolve: `gatsby-plugin-valine`,
            options: {
                appId: valine.appId,
                appKey: valine.appKey,
                avatar: `robohash`,
            },
        },

        {
            resolve: `gatsby-plugin-google-analytics`,
            options: {
                trackingId: google.trackingId,
                head: true,
            },
        },
        {
            resolve: `gatsby-plugin-baidu-analytics`,
            options: {
                // 百度统计站点ID
                siteId: baidu.siteId,
                // 配置统计脚本插入位置，默认值为 false, 表示插入到 body 中, 为 true 时插入脚本到 head 中
                head: true,
            },
        },
        {
            resolve: `gatsby-plugin-manifest`,
            options: {
                name: `Gatsby Frosted Blog`,
                short_name: `Gatsby Frosted`,
                start_url: `/`,
                background_color: `#ffffff`,
                theme_color: `#663399`,
                display: `minimal-ui`,
                icon: `src/images/icon.png`,
            },
        },
        {
            resolve: 'gatsby-plugin-brotli',
            options: {
                extensions: ['css', 'html', 'js', 'svg']
            }
        },
        `gatsby-plugin-react-helmet`,
        `gatsby-plugin-sitemap`,
        {
            resolve: 'gatsby-plugin-less',
            options: {
                lessOptions: {
                    javascriptEnabled: true
                },
                cssLoaderOptions: {
                    modules: true,
                },
            }
        },
        // `gatsby-plugin-split-css`,
        {
            resolve: 'gatsby-plugin-import',
            options: {
                libraryName: "antd",
                style: 'css',   // or 'css'
            }
        },
    ],
};
