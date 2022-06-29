import {DateTime} from "luxon";
import React from "react";
import {Col, Row} from "reactstrap";
import styled, {keyframes} from "styled-components";
import CommentPanel from "@/components/Article/CommentPanel";
import ArticleContentDisplay from "@/components/Article/ContentDisplay";
import TocPanel from "@/components/Article/TocPanel";
import {PageMetadata} from "@/components/PageMetadata";
import {languageInfo, useI18n} from "@/i18n";
import BannerLayout from "@/layouts/BannerLayout";
import Page from "@/layouts/Page";
import {ArticleNode, Heading, TopicNodeTree} from "@/models/ArticleNode";
import {HtmlAst} from "@/models/HtmlAst";
import {heights} from "@/styles/variables";
import {fromArticleTime} from "@/utils/datetime";
import useConstant from "@/utils/useConstant";
import {Link} from "gatsby";

interface Props {
  pageContext: {
    id: string;
    lang: string;
    html: string;
    htmlAst: HtmlAst;
    headings: Heading[];
    tree: TopicNodeTree;
    articleNode: ArticleNode;
  };
}


const enterAnimation = keyframes`
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
`;

const PageWithHeader = styled(Page)`
  animation: ${enterAnimation} 0.2s ease-in-out;
`;

const PageComponent: React.FC<{ hasHeader: boolean; children: React.ReactNode }> =
  ({hasHeader, children}) => {
    return (
      hasHeader
        ? <PageWithHeader>{children}</PageWithHeader>
        : <Page>{children}</Page>
    );
  };

interface RootLayoutProps {
  article: ArticleNode;
  lang: string;
  date: DateTime;
  lastUpdated?: DateTime;
}

const RootLayout: React.FC<RootLayoutProps> = ({children}) => {

  return (
    <BannerLayout transparentHeader={false}>
      {children}
    </BannerLayout>
  );
};

const ArticlePageTemplate: React.FC<Props> = (props) => {

  const i18n = useI18n();

  const {id, lang, htmlAst, html, headings, tree, articleNode} = props.pageContext;

  const {
    path, excerpt,
    frontmatter: {title, date, tags},
  } = articleNode;


  const publishedTime = useConstant(() => fromArticleTime(date));
  const lastUpdatedTime = useConstant(() => undefined);

  const deleteOther = (tree) => {
    tree = tree.filter(t => t.type === 'd');
    return tree.map(t => {
      return {
        ...t,
        children: deleteOther(t.children),
      }
    })
  }
  const buildNav = (item) => {
    return (
      <li>
        <li>
          <Link to={item.href}>{item.title}</Link>
        </li>
        {item.children.map((subNav) => {
          return (
            buildNav(subNav)
          )
        })}
      </li>
    )
  }
  const getDIr = (tree) => {
    let items = tree.children as TopicNodeTree[];

    items = deleteOther(items)
    if (items.length > 0) {
      return (
        <nav>
          {
            items.map(item => {
              return (
                <ul key={item.id}>
                  {buildNav(item)}
                </ul>
              )
            })
          }
        </nav>
      )
    }
  }


  return (
    <RootLayout
      article={articleNode} lang={lang}
      date={publishedTime} lastUpdated={lastUpdatedTime}
    >
      <div>
        <PageMetadata
          title={title}
          description={excerpt}
          url={path}
          locale={languageInfo['cn'].detailedId}
          meta={[
            {name: "og:type", content: "article"},
            {name: "og:article:published_time", content: publishedTime.toISO()},
            ...(tags || []).map((x) => ({
              name: "og:article:tag",
              content: x,
            })),
          ]}
        />

        <PageComponent hasHeader={true}>
          <SideBar className="d-none d-xl-block">
            {getDIr(tree)}
          </SideBar>
          <Row>
            <Col md={1}>

            </Col>
            <Col md={8} sm={12}>
              <ArticleContentDisplay
                htmlAst={htmlAst}
                html={html}
                headings={headings}
              />
            </Col>
            <Col md={3} className="d-none d-md-block">
              <StickySidePanel>
                <TocPanel headings={headings}/>
              </StickySidePanel>
            </Col>
          </Row>
          <hr/>
          <CommentPanel
            language={languageInfo[i18n.currentLanguage.id].gitalkLangId}
            articleId={id}
            articleTitle={title}
          />
        </PageComponent>
      </div>
    </RootLayout>
  );
};

export default ArticlePageTemplate;

const StickySidePanel = styled.div`
  position: sticky;
  top: ${heights.header + 32}px;
`;


const SideBar = styled.aside`
  background-color: #222;
  width: 20rem;
  position: fixed;
  z-index: 10;
  margin: 0;
  top: 3.6rem;
  left: 0;
  bottom: 0;
  box-sizing: border-box;
  overflow-y: auto;

  ul {
    list-style-type: none;
    padding: 0;
  }

  li {
    padding-left: 1rem;
  }

  a {
    padding: .35rem 1rem .35rem 1.25rem;
    color: #cbd2d8;
  }
`;
