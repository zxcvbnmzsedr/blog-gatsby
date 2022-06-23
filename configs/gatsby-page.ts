/* eslint-disable max-len */
// for better code readability

import {CreatePagesArgs} from "gatsby";
import GitHubSlugger from "github-slugger";
import path from "path";

const indexTemplate = path.resolve("src/templates/ArticleListPageTemplate.tsx");
const articleTemplate = path.resolve("src/templates/ArticlePageTemplate.tsx");
const topicPageTemplate = path.resolve("src/templates/TopicPageTemplate.tsx");
const mindTemplate = path.resolve("src/templates/ArticleMindTemplate.tsx");

type CreatePageFn = CreatePagesArgs["actions"]["createPage"];


type ArticleGroups = { [articleId: string]: ArticleNode[] };

interface ArticleNode {
  frontmatter: {
    id: string;
    date: string;
    absolute_path?: string;
  };
  field: {
    contentType: string
  }
  path: string;
  headings: {
    depth: number;
    value: string;
  }[];
  htmlAst: string;
}

interface ArticlesQueryResult {
  allSiYuan: {
    edges: {
      node: ArticleNode;
    }[];
  };
  allTopic: {
    nodes: {
      title: string
    }[]
  }
}

export const createPages = async ({actions, graphql}: CreatePagesArgs) => {

  const {createPage, createRedirect} = actions;

  const result = await graphql<ArticlesQueryResult>(`{
     allTopic {
        nodes {
          title
        }
      }
    allSiYuan(
      sort: { order: DESC, fields: [frontmatter___date] }
    ) {
      edges {
        node {
          field {
            contentType
          }
          frontmatter {
            id
            date
            absolute_path
          }
          htmlAst
          headings {
            depth
            value
          }
        }
      }
    }
  }`);

  if (result.errors || !result.data) {
    throw result.errors;
  }

  // Group articles with lang
  const articleGroups = {} as ArticleGroups;
  const topicGroups = {} as ArticleGroups;
  result.data.allSiYuan.edges.forEach(({node}) => {
    const {id, absolute_path} = node.frontmatter;
    node.path = absolute_path as string;
    if (node.field.contentType === 'posts') {
      articleGroups[id] = articleGroups[id] || [];
      articleGroups[id].push(node);
    }
    if (node.field.contentType === 'topic') {
      topicGroups[id] = topicGroups[id] || [];
      topicGroups[id].push(node);
    }
  });

  function redirect(from: string, to: string) {
    createRedirect({
      fromPath: from,
      toPath: to,
      isPermanent: true,
      redirectInBrowser: true,
    });

    createRedirect({
      fromPath: from + "/",
      toPath: to,
      isPermanent: true,
      redirectInBrowser: true,
    });
  }

  // create redirects
  redirect("/about", "/about/odyssey");

  createPaginatedHomepages(
    createPage,
    articleGroups,
  );

  createArticlePages(
    createPage,
    articleGroups,
    articleTemplate
  );

  createArticlePages(
    createPage,
    topicGroups,
    topicPageTemplate
  );

  result.data.allTopic.nodes.forEach(({title}) => {
    createPage({
      path: 'mind/topic/' + title,
      component: mindTemplate,
      context: {
        title: title,
      },
    })
  })

};

function createPaginatedHomepages(
  createPage: CreatePageFn, articleGroups: ArticleGroups) {

  const generatePath = (index: number) => {
    return `/posts${index === 0 ? "" : `/${index + 1}`}`;
  };

  const notIgnoredGroups = [] as ArticleNode[];

  for (const key in articleGroups) {
    const node = articleGroups[key][0];
    notIgnoredGroups.push(node);
  }

  notIgnoredGroups.sort((a, b) =>
    new Date(b.frontmatter.date).getTime() - new Date(a.frontmatter.date).getTime());

  const pageSize = 5;

  const pageCount = Math.ceil(notIgnoredGroups.length / pageSize);

  Array.from({length: pageCount}).forEach((_, pageIndex) => {
    createPage({
      path: generatePath(pageIndex),
      component: indexTemplate,
      context: {
        limit: pageSize,
        skip: pageIndex * pageSize,
        pageCount,
        pageIndex: pageIndex,
        ids: notIgnoredGroups
          .slice(pageIndex * pageSize, pageIndex * pageSize + pageSize)
          .map((x) => x.frontmatter.id),
      },
    });
  });

}

function createArticlePages(
  createPage: CreatePageFn, articleGroups: ArticleGroups, template: string) {
  const slugger = new GitHubSlugger();

  const createPageWithPath = (node: ArticleNode, path: string) => {
    createPage({
      path,
      component: template,
      context: {
        id: node.frontmatter.id,
        htmlAst: node.htmlAst,
        headings: node.headings.map((x) => ({
          ...x,
          slug: slugger.slug(x.value, false),
        })),
      },
    });
  };

  Object.entries(articleGroups).forEach(([key, nodes]) => {
    if (nodes.length === 0) {
      throw new Error(`${key} has no article!`);
    }

    // 2. Create index page for the cn version or the first version
    const firstNode = nodes[0];

    createPageWithPath(firstNode, firstNode.path);
  });
}

