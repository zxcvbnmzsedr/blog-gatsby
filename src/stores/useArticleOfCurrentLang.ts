import { useStore } from "simstate";

import { ArticleNode } from "@/models/ArticleNode";
import MetadataStore from "@/stores/MetadataStore";

export function useArticleOfCurrentLang(articleId: string): ArticleNode {
  const metadataStore = useStore(MetadataStore);

  return metadataStore.getArticle(articleId);
}
