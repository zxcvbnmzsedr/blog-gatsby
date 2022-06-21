import { Link } from "gatsby";
import { DateTime } from "luxon";
import React from "react";
import {
  FaCalendar,
  FaCalendarPlus, FaFileWord, FaTags,   FaUserClock } from "react-icons/fa";
import styled from "styled-components";

import ArticleTag from "@/components/Article/TagGroup/ArticleTag";
import { Localized, prefix, useI18n } from "@/i18n";
import { breakpoints } from "@/styles/variables";
import useConstant from "@/utils/useConstant";

interface Props {
  articleId: string;
  date: DateTime;
  lastUpdated?: DateTime;
  timeToRead: number;
  wordCount: number;
  tags?: string[] | null;
  currentArticleLanguage: string;
  setItemProp: boolean;
}

const p = prefix("articleFrontmatter.");

const Span = styled.span`
  margin-right: 8px;
  padding-right: 8px;
  margin-bottom: 4px;
  /* border-left: 1px solid black; */
  display: inline-block;

`;

const Tags = styled(Span)`

  /* @media (max-width: ${breakpoints.md}px) {
    display: block;
    margin-bottom: 4px;
  } */
`;

const ContainerRow = styled.div`
  font-size: 0.9em;
  margin: 8px 0;

  vertical-align: center;
`;

const DATE_FORMAT = "yyyy-MM-dd";

const ArticleFrontmatter: React.FC<Props> = (props) => {
  const {
    date, timeToRead, tags,
    lastUpdated, setItemProp, wordCount,
  } = props;

  const { translate } = useI18n();

  const dateString = useConstant(() => date.toFormat(DATE_FORMAT));
  const lastUpdatedString = useConstant(() => lastUpdated?.toFormat(DATE_FORMAT));

  const createTimeTitle = translate(p("date")) as string;
  const lastUpdatedTimeTitle = translate(p("lastUpdated")) as string;
  return (
    <ContainerRow>
      {tags && (
        <Tags>
          <FaTags />
          {tags.map((tag) => <ArticleTag tag={tag} key={tag} />)}
        </Tags>
      )}
      <Span title={createTimeTitle} >
        <FaCalendar />
        { setItemProp
          ? <time itemProp="datePublished" dateTime={date.toISO()}>{dateString}</time>
          : dateString
        }
      </Span>
      {
        lastUpdatedString
          ? (
            <Span title={lastUpdatedTimeTitle}>
              <FaCalendarPlus />
              { setItemProp
                ? (
                  <time itemProp="dateModified" dateTime={lastUpdated!.toISO()}>
                    {lastUpdatedString}
                  </time>
                ) : lastUpdatedString
              }
            </Span>
          ) : undefined
      }
      <Span>
        <FaFileWord />
        <Localized id={p("wordCount")} args={[wordCount]} />
      </Span>
      <Span>
        <FaUserClock />
        <Localized id={p("timeToRead")} args={[timeToRead]} />
      </Span>
    </ContainerRow>
  );
};

export default ArticleFrontmatter;
styled(Link)`

  margin-right: 8px;
`;
