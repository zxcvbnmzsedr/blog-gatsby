import {DateTime} from "luxon";
import {useCallback, useMemo} from "react";

import {LanguageId} from "@/i18n";
import {ArticleIdMap} from "@/models/ArticleIdMap";
import {ArticleNode, TopicNode} from "@/models/ArticleNode";
import {SiteMetadata} from "@/models/SiteMetadata";
import {TagMap} from "@/models/Tag";
import {formatDateTime} from "@/utils/datetime";
import {groupBy} from "@/utils/groupBy";

export type LangPathMap = Map<string, string>;

function noSuchArticle(articleId: string): string {
  return `No such article with id ${articleId}!`;
}

export default function MetadataStore(
  siteMetadata: SiteMetadata, articleNodes: ArticleNode[], topics: TopicNode[]) {

  const tagMap = useMemo(() => {
    const tagMap = new Map() as TagMap;
    articleNodes.filter(e => e.field.contentType === 'posts').forEach((node) => {
      if (node.frontmatter.tags) {
        node.frontmatter.tags.forEach((tag) => {
          if (!tagMap.has(tag)) {
            tagMap.set(tag, {count: 1, variations: tag});
          } else {
            tagMap.get(tag)!.count++;
          }
        });
      }
    });
    return tagMap;
  }, [articleNodes]);

  const articleIdMap: ArticleIdMap = useMemo(() => {
    const map = groupBy(articleNodes.map((article) => {
      const {frontmatter: {id, absolute_path}} = article;
      article.path = `${absolute_path || `/posts/${id}`}`;
      return article;
    }), (article) => article.frontmatter.id);

    // replicate the logic from page creation
    // (the cn or first version of article has no lang postfix)
    Array.from(map.values()).forEach((values) => {
      // sort the articles by lang
      values.sort((a, b) => a.frontmatter.lang.localeCompare(b.frontmatter.lang, "en"));

      // except the chinese or the first version, append lang prefix
      const exception = values.find((x) => x.frontmatter.lang === "cn") || values[0];
      values.forEach((article) => {
        if (article === exception) {
          return;
        }
        article.path += `/${article.frontmatter.lang}`;
      });
    });

    return map;
  }, [articleNodes]);

  const articleCount = articleNodes.filter(e=>e.field.contentType === 'posts').length;

  const getArticleOfLang = useCallback((id: string, languageId: string): ArticleNode => {
    const group = articleIdMap.get(id);

    if (!group) {
      throw noSuchArticle(id);
    }

    return group.find((x) => x.frontmatter.lang === languageId) || group[0];
  }, [articleIdMap]);

  const getLangPathMap = useCallback((id: string): LangPathMap => {
    const group = articleIdMap.get(id);

    if (!group) {
      throw noSuchArticle(id);
    }

    const map: LangPathMap = new Map();

    group.forEach((node) => {
      map.set(node.frontmatter.lang, node.path);
    });

    return map;
  }, [articleIdMap]);

  const getTagOfLang = useCallback(
    (tag: string, languageId: LanguageId): string | null => {
      const info = tagMap.get(tag);
      if (!info) {
        return null;
      }

      const {variations} = info;
      if (typeof variations === "string") {
        return variations;
      }
      return variations[languageId] || variations[0];
    }, [tagMap]);

  const getAllVariationsOfTag = useCallback((tag: string): string[] => {
    const variations = [tag];

    const value = tagMap.get(tag);
    if (value && typeof (value.variations) === "object") {
      Object.values(value.variations).forEach((variation) => {
        variations.push(variation);
      });
    }
    return variations;
  }, [tagMap]);

  const getAllTagsOfLang = useCallback((languageId: LanguageId): string[] => {
    const tags = [] as string[];
    tagMap.forEach(({variations}) => {
      if (typeof variations === "string") {
        tags.push(variations);
      } else {
        tags.push(variations[languageId] || variations[0]);
      }
    });

    return tags;
  }, [tagMap]);

  const getCountOfTag = useCallback((tag: string): number => {
    const info = tagMap.get(tag);
    return info ? info.count : 0;
  }, [tagMap]);

  const formattedLastUpdate = useMemo(() => {
    return formatDateTime(DateTime.fromISO(siteMetadata.lastUpdated));
  }, [siteMetadata.lastUpdated]);

  const topicList = useMemo(() => {

    return topics.map(e => {
      return {
        title: e.title,
        // @ts-ignore
        tree: JSON.parse(e.tree)
      }
    })
  }, [topics])

  return {
    siteMetadata: {...siteMetadata, formattedLastUpdate},
    tagMap,
    articleCount,
    articleIdMap,
    topicList,
    getArticleOfLang,
    getLangPathMap,
    getTagOfLang,
    getAllTagsOfLang,
    getAllVariationsOfTag,
    getCountOfTag,
  };
}
