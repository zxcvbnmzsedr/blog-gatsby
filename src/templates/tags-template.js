import React from 'react';
import { Link, graphql } from 'gatsby';
import Layout from '../components/layout';
import PostList from '../components/post/list';
import StyledLink from '../components/styled-link';
import styled from 'styled-components';

const TagsTemplate = ({ pageContext, data }) => {
  const { tag } = pageContext;
  const { totalCount } = data.allSiYuan;
  const posts = data.allSiYuan.nodes;
  const title = `Posts tagged ${tag}`;

  return (
    <Layout title={title}>
      <TagsTemplateWrapper>
        <Title>
          有 {totalCount} 篇{tag}相关文章
        </Title>
        <Link
          css={`
            margin-top: var(--size-400);
            display: inline-block;
            color: inherit;
            text-transform: uppercase;
          `}
          to="/tags"
        >
          查看所有
        </Link>
        <PostList posts={posts} />

        <StyledLink
          css={`
            margin-top: var(--size-400);
            display: inline-block;
          `}
          to="/tags"
        >
          查看全部标签
        </StyledLink>
      </TagsTemplateWrapper>
    </Layout>
  );
};

export default TagsTemplate;

const TagsTemplateWrapper = styled.div`
  padding-top: var(--size-900);
`;

const Title = styled.h1`
  font-size: var(--size-700);
`;

export const pageQuery = graphql`
  query($tag: String) {
    allSiYuan(
      limit: 2000
      sort: { fields: [frontmatter___date], order: DESC }
      filter: {
        frontmatter: { tags: { in: [$tag] } }
        field: { contentType: { eq: "posts" } }
      }
    ) {
      totalCount
      nodes {
        field {
          slug
        }
        frontmatter {
          date(formatString: "YYYY-MM-DD")
          description
          tags
          title
        }
        timeToRead
        excerpt
      }
    }
  }
`;
