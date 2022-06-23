import React from 'react';
import Layout from '../components/layout';
import { Link, graphql } from 'gatsby';


const Tags = ({ data }) => {
  const tags = data.allSiYuan.group;

  return (
    <Layout title="All Tags">
      <h1>所有标签</h1>

      <ul>
        {tags.map((tag) => (
          <li key={tag.fieldValue}>
            <Link to={`/tags/${tag.fieldValue}/`}>
              {tag.fieldValue} ({tag.totalCount})
            </Link>
          </li>
        ))}
      </ul>
    </Layout>
  );
};

export default Tags;

export const pageQuery = graphql`
  {
  allSiYuan(limit: 2000, filter: {field: {contentType: {eq: "posts"}}}) {
    group(field: frontmatter___tags) {
      fieldValue
      totalCount
    }
  }
}

`;
