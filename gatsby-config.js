"use strict"

const { DateTime } = require("luxon");
const path = require("path");

module.exports = {
  siteMetadata: {
    lastUpdated: DateTime.utc().toString(),
    name: `天增`,
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
  plugins: [
    'gatsby-plugin-typescript',
    {
      resolve: `gatsby-plugin-sass`,
      options: {
        sassOptions: {
          includePaths: [path.join(__dirname, "src/styles")],
        }
      },
    },
    {
      resolve: 'gatsby-plugin-styled-components',
      options: {
        minify: true,
      },
    },
    "gatsby-plugin-layout",
    {
      resolve: 'gatsby-plugin-root-import',
      options: {
        "@": path.join(__dirname, 'src'),
        "~": path.join(__dirname)
      }
    },
    'gatsby-plugin-catch-links',
    {
      resolve: 'gatsby-source-filesystem',
      options: {
        name: 'contents',
        path: `${__dirname}/contents`
      }
    },
    `gatsby-transformer-json`,
    'gatsby-plugin-sharp',
    'gatsby-transformer-sharp',
    {
      resolve: `gatsby-transformer-siyuan`,
      options: {
        host: process.env.SIYUAN_HOST || 'http://127.0.0.1:6806/api/',
        token: process.env.SIYUAN_TOKEN || 'noeyqg6qknhqvl5m',
        box: process.env.SIYUAN_BOX || '20220420112442-p6q6e8w'
      },
    },
    {
      resolve: 'gatsby-transformer-remark',
      options: {
        plugins: [
          {
            resolve: 'gatsby-remark-responsive-iframe',
            options: {
              wrapperStyle: 'margin-bottom: 1rem'
            }
          },
          {
            resolve: 'gatsby-remark-vscode',
            options: {
              inlineCode: {
                marker: "±",
              },
              theme: "Dark+ (default dark)",
              extensions: ['Kotlin', "viml"],
              languageAliases: {
                "kotlin": "kts",
                "vimscript": "viml",
              }
            }
          },
          `gatsby-remark-emoji`,
          {
            resolve: 'gatsby-remark-copy-linked-files',
            options: {
              destinationDir: "static",
              // ignoreFileExtensions: [],
            }
          },
          'gatsby-remark-smartypants',
          {
            resolve: 'gatsby-remark-images',
            options: {
              maxWidth: 1140,
              quality: 90,
              showCaptions: true,
              linkImagesToOriginal: false
            }
          },
          {
            resolve: `gatsby-remark-images-medium-zoom`,
            options: {
              background: "#222",
              zIndex: 1040,
            }
          }
        ]
      }
    },
    'gatsby-transformer-json',
    {
      resolve: 'gatsby-plugin-canonical-urls',
      options: {
        siteUrl: 'https://www.ztianzeng.com'
      }
    },
    {
      resolve: `gatsby-plugin-baidu-analytics`,
      options: {
        siteId: "305970e09045d4afbab60ece95d61930",
        head: false,
      },
    },
    {
      resolve: 'gatsby-plugin-react-svg',
      options: {
        include: /assets/
      }
    },
    {
      resolve: `gatsby-plugin-nprogress`,
      options: {
        // Setting a color is optional.
        color: `#3498DB`,
        // Disable the loading spinner.
        showSpinner: false,
      }
    },
    'gatsby-plugin-react-helmet',
    {
      resolve: `gatsby-plugin-manifest`,
      options: {
        name: "ztianzeng.com",
        short_name: "ztianzeng",
        start_url: "/",
        background_color: "#FFFFFF",
        theme_color: "#3498DB",
        display: "minimal-ui",
        icon: "assets/icon.png", // This path is relative to the root of the site.
      },
    },
    `gatsby-plugin-remove-serviceworker`,
    'gatsby-plugin-sitemap'
  ]
}
