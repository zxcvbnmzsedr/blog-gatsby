import { graphql, useStaticQuery } from "gatsby";
import React from "react";

import { ArticleNode } from "@/models/ArticleNode";
import { SiteMetadata } from "@/models/SiteMetadata";
import { Tag } from "@/models/Tag";

import RootLayout from "./RootLayout";

interface InitialData {
  site: { siteMetadata: SiteMetadata };
  allTagsJson: { nodes: Tag[] };
  allSiYuan: { nodes: ArticleNode[] };
}

interface Props {
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
    allTagsJson {
      nodes {
        tag
        cn
        en
      }
    }
    allSiYuan{
      nodes {
        excerpt
        timeToRead
        wordCountChinese
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
      articles={data.allSiYuan.nodes}
      tags={data.allTagsJson.nodes}
    >
      {props.children}
    </RootLayout>
  );

};

export default IndexLayout;
