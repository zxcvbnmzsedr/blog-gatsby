export interface Heading {
  depth: number;
  value: string;
  slug: string;
}

export interface ArticleNode {
  path: string;
  excerpt: string;
  timeToRead: number;
  wordCountChinese: number;
  field: {
    contentType: string
  }
  frontmatter: {
    absolute_path?: string;
    date: string;
    id: string;
    tags: string[] | null;
    title: string;
    lang: string;
  };
}

export interface TopicNode {
  tree: TopicNodeTree
  title: string
}

export interface TopicNodeTree {
  title: string,
  id: string,
  type: string,
  href: string
  parentId: string,
  path: string,
  parentPath: string,
  sort: number,
  children: TopicNodeTree[]
}
