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
  tree:string
  title:string
}
