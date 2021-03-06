import "@/styles/index.scss";

import React from "react";
import {IconContext} from "react-icons";
import {createStore, StoreProvider} from "simstate";
import styled from "styled-components";

import {PageMetadata} from "@/components/PageMetadata";
import ToTop from "@/components/ToTop";
import UpdatePop from "@/components/UpdatePop";
import {Provider} from "@/i18n";
import cn from "@/i18n/cn";
import {ArticleNode, TopicNode} from "@/models/ArticleNode";
import {SiteMetadata} from "@/models/SiteMetadata";
import ArticleStore from "@/stores/ArticleStore";
import LocationStore, {LocationProvider} from "@/stores/LocationStore";
import MetadataStore from "@/stores/MetadataStore";
import useConstant from "@/utils/useConstant";
import icon512 from "~/assets/icon.png";

const initialLanguage = {
  id: "cn",
  definitions: cn,
};

const LayoutRoot = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  word-wrap: break-word;
`;

interface Props {
  // eslint-disable-next-line no-undef
  location: Location;
  posts: ArticleNode[];
  topics: TopicNode[];
  siteMetadata: SiteMetadata;
  children?: React.ReactNode;
}

const iconContext = {className: "icons"};

const RootLayout: React.FC<Props> = ({
                                       location, posts,
                                       siteMetadata, topics, children,
                                     }) => {

  const locationStore = useConstant(() => createStore(LocationStore, location));

  const metadataStore = useConstant(() => createStore(MetadataStore,
    siteMetadata,
    posts,
    topics
  ));

  const articleStore = useConstant(() => createStore(ArticleStore, null));

  return (
    <Provider initialLanguage={initialLanguage}>
      <IconContext.Provider value={iconContext}>
        <StoreProvider stores={[
          locationStore,
          metadataStore,
          articleStore,
        ]}
        >
          <LocationProvider location={location}/>
          <LayoutRoot>
            <PageMetadata
              meta={[
                {name: "keywords", content: "gatsbyjs, gatsby, react, blog"},
              ]}
              link={[
                {rel: "icon", type: "image/png", href: icon512},
                {rel: "shortcut icon", type: "image/png", href: icon512},
              ]}
              script={[
                {
                  type: "text/javascript",
                  src: "https://s5.cnzz.com/z_stat.php?id=1276500124&web_id=1276500124",
                  async: true,
                },
              ]}
            />
            <UpdatePop/>
            <ToTop/>
            {children}
          </LayoutRoot>
        </StoreProvider>
      </IconContext.Provider>
    </Provider>
  );
};

export default RootLayout;
