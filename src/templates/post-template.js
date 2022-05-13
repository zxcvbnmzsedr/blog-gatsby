import React from 'react';
import {graphql, Link} from 'gatsby';
import Layout from '../components/layout';
import styled from 'styled-components';
import Tags from '../components/tags';
import Comment from '../components/comment';
import Post from "../components/post";
import SidebarRight from "../components/SidebarRight";


const PostTemplate = ({data}) => {
    let {frontmatter, excerpt, field, raw, html} = data.siYuan;
    const prev = data.prev;
    const next = data.next;
    const title = frontmatter.title;

    return (
        <Layout
            title={title}
            description={frontmatter.description || excerpt}
            socialImage={
                frontmatter.profile_image ? frontmatter.profile_image.absolutePath : ''
            }
        >
            <PostWrapper>
                <article style={{textAlign: 'center'}}>
                    <PostTitle>{title}</PostTitle>
                    <PostDate>{frontmatter.date}</PostDate>
                    ・本文已被阅
                    <span id={field.slug} className="leancloud_visitors" data-flag-title="Your Article Title"><i
                        className="leancloud-visitors-count">-1</i></span>
                    次
                </article>
                <Post rawMarkdownBody={raw} html={html}/>
                <Comment slug={field.slug}/>

                <PostPagination>
                    {prev && (
                        <div>
                            <span>上一篇</span>
                            <Link to={prev.field.slug}> {prev.frontmatter.title}</Link>
                        </div>
                    )}

                    {next && (
                        <div>
                            <span>下一篇</span>
                            <Link to={next.field.slug}> {next.frontmatter.title}</Link>
                        </div>
                    )}
                </PostPagination>
                <Tags tags={frontmatter.tags}/>
            </PostWrapper>
        </Layout>
    );
};

export default PostTemplate;

const PostWrapper = styled.div`
  padding-top: var(--size-900);
  padding-bottom: var(--size-900);
  margin-left: auto;
  margin-right: auto;
  word-wrap: break-word;
`;

const PostTitle = styled.h1`
  font-size: var(--size-700);
`;

const PostDate = styled.span`
  font-size: var(--size-400);
  padding-top: 1rem;
  text-transform: uppercase;
`;

const PostPagination = styled.nav`
  display: flex;
  flex-wrap: wrap;
  margin-top: var(--size-900);

  & > * {
    position: relative;
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 0.5rem 1rem;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.5);
    background-color: rgba(255, 255, 255, 0.3);
    backdrop-filter: blur(10px);
    margin: 0.5rem;
  }

  & > *:hover {
    background-color: rgba(255, 255, 255, 0.5);
  }

  & span {
    text-transform: uppercase;
    opacity: 0.6;
    font-size: var(--size-400);
    padding-bottom: var(--size-500);
  }

  & a {
    color: inherit;
    text-decoration: none;
    font-size: var(--size-400);
    text-transform: capitalize;
  }

  & a::after {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
  }
`;

export const pageQuery = graphql`
  query PostBySlug($slug: String!, $prevSlug: String, $nextSlug: String) {
    siYuan(field: { slug: { eq: $slug } }) {
      excerpt
      raw
      field {
        slug
      }
      frontmatter {
        title
        tags
        date(formatString: "YYYY-MM-DD")
        description
      }
    }

    prev: siYuan(field: { slug: { eq: $prevSlug } }) {
      frontmatter {
        title
      }
      field {
        slug
      }
    }

    next: siYuan(field: { slug: { eq: $nextSlug } }) {
      frontmatter {
        title
      }
      field {
        slug
      }
    }
  }
  `;
