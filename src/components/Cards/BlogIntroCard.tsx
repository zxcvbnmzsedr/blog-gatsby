import {Link} from "gatsby";
import React from "react";
import {FaCode, FaRegCommentDots, FaRss} from "react-icons/fa";
import {CardBody, CardText} from "reactstrap";
import styled from "styled-components";

import {BaseCard, BaseCardHeader} from "@/components/Cards/components";
import {Localized, prefix} from "@/i18n";

const BlockContainer = styled.div`
  a {
    display: block;
  }
`;

interface Props {

}

const root = prefix("blogIntro.");

const BlogIntroCard: React.FC<Props> = () => {

  return (
    <BaseCard>
      <BaseCardHeader>
        <span>💻 ztianzeng.com | <Localized id={root("subtitle")} /></span>
      </BaseCardHeader>
      <CardBody>
        <CardText>
          <Localized id={root("description1")} />
        </CardText>
        <BlockContainer>
          <a href="https://github.com/zxcvbnmzsedr/blog-gatsby" target="__blank">
            <FaCode />
            <Localized id={root("sourceCode")} />
          </a>
          <a href="/rss.xml" target="__blank">
            <FaRss />
            RSS
          </a>
          <Link to="/feedback">
            <FaRegCommentDots />
            <Localized id={root("feedback")} />
          </Link>
        </BlockContainer>
      </CardBody>
    </BaseCard >
  );
};

export default BlogIntroCard;
