/* eslint-disable max-len */
// for better code readability
/* eslint-disable @typescript-eslint/no-use-before-define */

import { CreatePagesArgs } from "gatsby";
import GitHubSlugger from "github-slugger";
import path from "path";

const indexTemplate = path.resolve("src/templates/ArticleListPageTemplate.tsx");
const articleTemplate = path.resolve("src/templates/ArticlePageTemplate.tsx");

type CreatePageFn = CreatePagesArgs["actions"]["createPage"];

type CreateRedirectFn = (from: string, to: string) => void;

type ArticleGroups = { [articleId: string]: ArticleNode[] };

interface ArticleNode {
  frontmatter: {
    id: string;
    date: string;
    absolute_path?: string;
  };
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
}

export const createPages = async ({ actions, graphql }: CreatePagesArgs) => {

  const { createPage, createRedirect } = actions;

  const result = await graphql<ArticlesQueryResult>(`{
    allSiYuan(
      filter: { field: { contentType: { eq: "posts" } } }
      sort: { order: DESC, fields: [frontmatter___date] }
    ) {
      edges {
        node {
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
  result.data.allSiYuan.edges.forEach(({ node }) => {
    const { id, absolute_path } = node.frontmatter;
    articleGroups[id] = articleGroups[id] || [];
    node.path = absolute_path as string;
    articleGroups[id].push(node);
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
    redirect,
    articleGroups,
  );

  await createRedirects(redirect, createPage, graphql);


};

function createPaginatedHomepages(
  createPage: CreatePageFn, articleGroups: ArticleGroups) {

  const generatePath = (index: number) => {
    return `/articles${index === 0 ? "" : `/${index + 1}`}`;
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

  Array.from({ length: pageCount }).forEach((_, pageIndex) => {
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
  createPage: CreatePageFn, redirect: CreateRedirectFn, articleGroups: ArticleGroups) {
  const slugger = new GitHubSlugger();

  const createPageWithPath = (node: ArticleNode, path: string) => {
    createPage({
      path,
      component: articleTemplate,
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
    if (nodes.length === 0) { throw new Error(`${key} has no article!`); }

    // 2. Create index page for the cn version or the first version
    const firstNode = nodes[0];

    createPageWithPath(firstNode, firstNode.path);
  });
}


interface RedirectsQueryResult {
  allRedirectsJson: {
    nodes: { id: string; to: string }[];
  }
}

const CLIENT_REDIRECT = true;
const redirectsTemplate = path.resolve("src/templates/RedirectPageTemplate.tsx");
const redirectPrefix = "/r/";

async function createRedirects(
  redirect: CreateRedirectFn,
  createPage: CreatePageFn,
  graphql: CreatePagesArgs["graphql"],
) {
  const result = await graphql<RedirectsQueryResult>(`{
    allRedirectsJson {
      nodes {
        id
        to
      }
    }
  }`);

  if (result.errors || !result.data) {
    throw result.errors;
  }

  result.data.allRedirectsJson.nodes.forEach(({ id, to }) => {

    const path = redirectPrefix + id;

    if (CLIENT_REDIRECT) {
      createPage({ path: path, component: redirectsTemplate, context: { id, to } });
    } else {
      redirect(path, to);
    }
  });

}
