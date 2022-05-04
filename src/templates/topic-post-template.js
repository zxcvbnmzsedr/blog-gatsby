import React from 'react';
import {graphql} from 'gatsby';
import Layout from '../components/layout';
import styled from 'styled-components';
import Comment from '../components/comment';
import Post from "../components/post";
import TopicSideBar from "../components/TopicSideBar";
import MarkdownNavbar from "markdown-navbar";

const PostTemplate = ({data}) => {
    let {frontmatter, excerpt, field, raw,html} = data.siYuan;
    const title = frontmatter.title;
    return (
        <Layout
            title={title}
            description={frontmatter.description || excerpt}
            socialImage={
                frontmatter.profile_image ? frontmatter.profile_image.absolutePath : ''
            }
            sidebarRight={<MarkdownNavbar declarative={true} source={raw}/>}
            sidebar={<TopicSideBar treeJson={data.topic.tree}/>}
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
            </PostWrapper>
        </Layout>
    );
};

export default PostTemplate;

const PostWrapper = styled.div`
  padding-top: var(--size-900);
  padding-bottom: var(--size-900);
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


export const pageQuery = graphql`
  query PostByTopic($slug: String!, $topic: String) {
  siYuan(field: {slug: {eq: $slug}}) {
    excerpt
    raw
    html
    field {
      slug
      topic
    }
    frontmatter {
      title
      tags
      date(formatString: "YYYY-MM-DD")
      description
    }
  }
  topic(title: {eq: $topic}) {
    title
    tree
  }
}
  `;
