import { graphql, useStaticQuery } from "gatsby";
import React from "react";

import {ArticleNode, TopicNode} from "@/models/ArticleNode";
import { SiteMetadata } from "@/models/SiteMetadata";

import RootLayout from "./RootLayout";

interface InitialData {
  site: { siteMetadata: SiteMetadata };
  allSiYuan: { nodes: ArticleNode[] };
  allTopic: { nodes: TopicNode[] };
}

interface Props {
  // eslint-disable-next-line no-undef
  location: Location;
  children: React.ReactNode;
}

const query = graphql`
  query IndexLayoutQuery {
    site {
      siteMetadata {
        name
        description
        lastUpdated
        siteUrl
      }
    }
    allTopic {
        nodes {
          tree
          title
        }
    }
    allSiYuan {
      nodes {
        excerpt
        timeToRead
        wordCountChinese
        field {
            contentType
        }
        frontmatter {
          date
          id
          absolute_path
          title
          tags
          lang
        }
      }
    }
  }
`;

const IndexLayout: React.FC<Props> = (props) => {

  const data: InitialData = useStaticQuery(query);

  return (
    <RootLayout
      location={props.location}
      siteMetadata={data.site.siteMetadata}
      posts={data.allSiYuan.nodes}
      topics={data.allTopic.nodes}
    >
      {props.children}
    </RootLayout>
  );

};

export default IndexLayout;
