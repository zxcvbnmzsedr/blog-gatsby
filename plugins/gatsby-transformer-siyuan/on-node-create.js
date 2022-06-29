const {SiYuan} = require("./siyuan.jsx");
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

const create = async ({actions, createContentDigest}, options) => {
  const {box, token, host} = options

  const {createNode} = actions;
  const siYuan = new SiYuan(token, host, box)

  const list = await siYuan.getSiYuanPost();
  const processResult = (result) => {
    const {id, title, slug, date, tags, contentType, template, raw, html, headings} = result;
    const excerpt = getMarkdownExcerpt(raw)
    const topic = slug.startsWith('/topic') ? slug.split('/')[2] : null
    const slugReNew = contentType === 'posts' ? `/posts/${title}` : slug
    // getHtml(raw)
    return Object.assign({}, {
      field: {
        contentType: contentType,
        slug: slugReNew,
        topic
      },
      raw,
      html,
      excerpt,
      // headings,
      frontmatter: {
        date,
        absolute_path: slugReNew,
        id: slugReNew,
        tags,
        lang: "cn",
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
    return Object.assign(
      {},
      {
        tree: JSON.stringify(result),
        href: result.href,
        title: result.title
      },
      {
        id: 'topic' + id,
        endpointId: result.id,
        parent: null,
        children: [],
        internal: {
          type: `topic`,
          contentDigest: createContentDigest(result)
        }
      });
  };
  const topicTree = await siYuan.getSiYuanTopic();
  topicTree.forEach(n => {
    if (n) {
      createNode(processTopic(n))
    }
  })
};
module.exports.create = create
