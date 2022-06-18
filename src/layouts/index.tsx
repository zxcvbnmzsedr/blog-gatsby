import { graphql, useStaticQuery } from "gatsby";
import React from "react";

import { ArticleNode } from "@/models/ArticleNode";
import { SiteMetadata } from "@/models/SiteMetadata";

import RootLayout from "./RootLayout";

interface InitialData {
  site: { siteMetadata: SiteMetadata };
  allSiYuan: { nodes: ArticleNode[] };
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
    allSiYuan(
    filter: { field: { contentType: { eq: "posts" } } }
    ){
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
      posts={data.allSiYuan.nodes}
      tags={[]}
    >
      {props.children}
    </RootLayout>
  );

};

export default IndexLayout;
