import React from 'react';
import {graphql, Link} from 'gatsby';
import Layout from '../components/layout';
import PostList from '../components/post/list';
import styled from 'styled-components';

const Blog = ({ data }) => {
  const posts = data.allSiYuan.nodes;

  return (
      <Layout title="Blog">
          <HeaderWrapper>
              <h1>文章</h1>

              <Link
                  css={`
            margin-top: var(--size-400);
            color: inherit;
            text-transform: uppercase;
          `}
                  to="/tags"
              >
                  查看所有标签
              </Link>
          </HeaderWrapper>

          <PostList posts={posts} />

      </Layout>
  );
};

export default Blog;

const HeaderWrapper = styled.div`
  display: flex;
  flex-direction: column;
  margin-top: var(--size-900);
  margin-bottom: var(--size-700);

  h1 {
    max-width: none;
  }
`;

export const pageQuery = graphql`
query {
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
}

`;
