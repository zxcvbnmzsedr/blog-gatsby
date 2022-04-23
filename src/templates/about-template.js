import React from 'react';
import Layout from '../components/layout';
import { graphql } from 'gatsby';
import styled from 'styled-components';
import { GatsbyImage, getImage } from 'gatsby-plugin-image';

const AboutTemplate = ({ data }) => {
  const { raw, frontmatter } = data.siYuan;

  return (
    <Layout title={frontmatter.title}>
      <AboutWrapper>
        {/*<AboutImageWrapper image={profileImage} alt="" />*/}

        <AboutCopy dangerouslySetInnerHTML={{ __html: raw }} />
      </AboutWrapper>
    </Layout>
  );
};

export default AboutTemplate;

const AboutWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-around;
  height: 100%;

  @media screen and (max-width: 1000px) {
    & {
      flex-direction: column;
    }

    & > * {
      margin-top: 2rem;
      width: 100%;
      text-align: center;
    }
  }
`;

const AboutImageWrapper = styled(GatsbyImage)`
  display: block;
  border-radius: 50%;
  height: 300px;
  width: 300px;
`;

const AboutCopy = styled.div`
  max-width: 60ch;

  & p {
    font-size: var(--size-400);
  }
`;

export const pageQuery = graphql`
  query($slug: String!) {
    siYuan(field: { slug: { eq: $slug } }) {
      raw
      frontmatter {
        title
      }
    }
  }
`;
