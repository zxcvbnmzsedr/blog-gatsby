import React from 'react';
import { graphql } from 'gatsby';
import Layout from '../components/layout';
import PostList from '../components/post-list';
import styled from 'styled-components';
import StyledLink from '../components/styled-link';
import ReactMarkdown from "react-markdown";

const HomePage = ({ data }) => {
  const posts = data.allSiYuan.nodes;
  const intro = data.siYuan.raw;
  const title = data.siYuan.frontmatter.title;

  return (
    <Layout title={title}>
        <Intro>
            <ReactMarkdown children={intro}/>
        </Intro>

      <PostList posts={posts} />
      <StyledLink
        css={`
          display: block;
          margin: var(--size-800) auto;
          width: fit-content;
        `}
        to="/blog"
      >
        全部文章
      </StyledLink>
    </Layout>
  );
};

export default HomePage;

const Intro = styled.div`
  display: flex;
  flex-direction: column;
  max-width: 60ch;
  align-items: center;
  margin: var(--size-800) auto var(--size-900);
  text-align: center;

  & p {
    text-transform: capitalize;
    font-size: var(--size-400);
  }

  @media screen and (max-width: 700px) {
    & h1 {
      font-size: var(--size-700);
    }
  }
`;

export const pageQuery = graphql`
query ($slug: String!) {
  site {
    siteMetadata {
      title
    }
  }
  allSiYuan(
    filter: {field: {contentType: {eq: "posts"}}}
    sort: {order: DESC, fields: frontmatter___date}
    limit: 9
  ) {
    nodes {
      field {
        slug
      }
      excerpt
      timeToRead
      frontmatter {
        date(formatString: "YYYY-MM-DD")
        title
        description
        tags
      }
    }
  }
  siYuan(field: {slug: {eq: $slug}}) {
    raw
    frontmatter {
      title
    }
  }
}

`;
