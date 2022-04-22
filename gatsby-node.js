const path = require(`path`);
const {createFilePath} = require(`gatsby-source-filesystem`);
const {siYuan} = require("./config");
const {getSiYuanPost, getSiYuanTopic} = require("./siyuan.jsx");
const {timeToRead} = require(`gatsby-transformer-remark/utils/time-to-read`);
const frontMatter = require('front-matter')
const removeMd = require('remove-markdown')

function getMarkdownExcerpt(markdown, maxExcerptLength = 120) {
    const parsedMarkdown = frontMatter(markdown)
    let contentText = removeMd(parsedMarkdown.body)
    // Trim and normalize whitespace in content text
    contentText = contentText.trim().replace(/\s+/g, ' ')
    const excerpt = contentText.slice(0, maxExcerptLength)

    if (contentText.length > maxExcerptLength) {
        return excerpt + '...'
    }

    return excerpt
}


const createMind = async ({graphql, actions}) => {
    const {createPage} = actions
    const result = await graphql(`
    query MyQuery {
      allTopic {
        nodes {
          tree
          title
        }
      }
    }
  `)

    result.data.allTopic.nodes.forEach(({title}) => {
        createPage({
            path: 'topic/' + title,
            component: path.resolve(`./src/templates/mind-template.js`),
            context: {
                title: title,
            },
        })
    })
}


exports.sourceNodes = async ({actions, createContentDigest}) => {
    const {createNode} = actions;
    const list = await getSiYuanPost({box: siYuan.box});
    const processResult = (result) => {
        const {id, title, slug, date, tags, contentType, template, raw, content} = result;
        const excerpt = getMarkdownExcerpt(raw)
        return Object.assign({}, {
            field: {
                contentType: contentType,
                slug
            },
            raw,
            timeToRead: timeToRead(raw),
            excerpt,
            frontmatter: {
                date,
                tags,
                template,
                title,
                description: excerpt
            }
        }, {
            id: id,
            endpointId: result.id,
            parent: null,
            children: [],
            internal: {
                type: `SiYuan`,
                contentDigest: createContentDigest(result)
            }
        });
    };
    list.forEach(n => {
        if (n) {
            createNode(processResult(n))
        }
    })
    const processTopic = (result) => {
        const {id} = result;
        return Object.assign({}, {
            tree: JSON.stringify(result),
            title: result.title
        }, {
            id: id,
            endpointId: result.id,
            parent: null,
            children: [],
            internal: {
                type: `topic`,
                contentDigest: createContentDigest(result)
            }
        });
    };
    const topicTree = await getSiYuanTopic({box: siYuan.box});
    topicTree.forEach(n => {
        if (n) {
            createNode(processTopic(n))
        }
    })
};

exports.createPages = async ({graphql, actions, reporter}) => {
    await createMind({graphql, actions})
    const {createPage} = actions;

    const result = await graphql(
        `
      {
        allSiYuan(
          sort: { fields: [frontmatter___date], order: DESC }
          limit: 1000
        ) {
          nodes {
            field {
              contentType
              slug
            }
            frontmatter {
              template
            }
          }
        }
        tagsGroup: allSiYuan(
          limit: 2000
          filter: { field: { contentType: { eq: "posts" } } }
        ) {
          group(field: frontmatter___tags) {
            fieldValue
          }
        }
      }
    `
    );

    if (result.errors) {
        reporter.panicOnBuild(
            `There was an error loading your blog posts`,
            result.errors
        );
        return;
    }

    const tags = result.data.tagsGroup.group;
    const allMarkdownNodes = result.data.allSiYuan.nodes;

    const blogMarkdownNodes = allMarkdownNodes.filter(
        (node) => node.field.contentType === `posts`
    );

    const pageMarkdownNodes = allMarkdownNodes.filter(
        (node) => node.field.contentType === `pages`
    );

    const topicMarkdownNodes = allMarkdownNodes.filter(
        (node) => node.field.contentType === `topic`
    );

    if (blogMarkdownNodes.length > 0) {
        blogMarkdownNodes.forEach((node, index) => {
            let prevSlug = null;
            let nextSlug = null;

            if (index > 0) {
                prevSlug = blogMarkdownNodes[index - 1].field.slug;
            }

            if (index < blogMarkdownNodes.length - 1) {
                nextSlug = blogMarkdownNodes[index + 1].field.slug;
            }

            createPage({
                path: `${node.field.slug}`,
                component: path.resolve(`./src/templates/post-template.js`),
                context: {
                    slug: `${node.field.slug}`,
                    prevSlug: prevSlug,
                    nextSlug: nextSlug,
                },
            });
        });
    }

    if (pageMarkdownNodes.length > 0) {
        pageMarkdownNodes.forEach((node) => {
            if (node.frontmatter.template) {
                const templateFile = `${String(node.frontmatter.template)}.js`;

                createPage({
                    path: `${node.field.slug}`,
                    component: path.resolve(`src/templates/${templateFile}`),
                    context: {
                        slug: `${node.field.slug}`,
                    },
                });
            }
        });
    }

    if (topicMarkdownNodes.length > 0) {
        topicMarkdownNodes.forEach((node) => {
            createPage({
                path: `${node.field.slug}`,
                component: path.resolve(`./src/templates/post-template.js`),
                context: {
                    slug: `${node.field.slug}`,
                },
            });

        });
    }
    tags.forEach((tag) => {
        createPage({
            path: `/tags/${tag.fieldValue}/`,
            component: path.resolve(`./src/templates/tags-template.js`),
            context: {
                tag: tag.fieldValue,
            },
        });
    });
};

exports.onCreateNode = ({node, actions, getNode}) => {
    const {createNodeField} = actions;

    if (node.internal.type === `MarkdownRemark`) {
        const relativeFilePath = createFilePath({
            node,
            getNode,
        });

        const fileNode = getNode(node.parent);

        createNodeField({
            node,
            name: `contentType`,
            value: fileNode.sourceInstanceName,
        });

        if (fileNode.sourceInstanceName === 'posts') {
            createNodeField({
                name: `slug`,
                node,
                value: '/post' + relativeFilePath,
            });
        }

        if (fileNode.sourceInstanceName === 'pages') {
            createNodeField({
                name: `slug`,
                node,
                value: relativeFilePath,
            });
        }
        if (fileNode.sourceInstanceName === 'topic') {
            createNodeField({
                name: `slug`,
                node,
                value: '/topic' + relativeFilePath,
            });
        }
    }
};

exports.createSchemaCustomization = ({actions}) => {
    const {createTypes} = actions;

    createTypes(`
    type SiteSiteMetadata {
      author: Author
      siteUrl: String
      social: Social
    }

    type Author {
      name: String
      summary: String
    }

    type Social {
      twitter: String
    }

    type MarkdownRemark implements Node {
      frontmatter: Frontmatter
      fields: Fields
    }

    type Frontmatter {
      title: String
      slug: String
      description: String
      date: Date @dateformat
      template: String
      tags: [String!]
    }

    type Fields {
      slug: String
      contentType: String
    }
  `);
};
