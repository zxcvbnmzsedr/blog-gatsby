import "gitalk/dist/gitalk.css";

import GitalkComponent from "gitalk/dist/gitalk-component";
import React, { useEffect } from "react";
import { FaComments } from "react-icons/fa";
import styled from "styled-components";

import { languageInfo,Localized, useI18n } from "@/i18n";
import isServer from "@/utils/isServer";

interface Props {
  articleId: string;
  articleTitle: string;
  language: string;
}

const CommentDiv = styled.div`
  margin-top: 32px;

  .gt-action-text {
    color: #6190e8;;
  }
`;

const CommentPanel: React.FC<Props> = (props) => {

  const [mount, setMount] = React.useState(!isServer());

  const firstUpdate = React.useRef(true);

  useEffect(() => {
    if (firstUpdate.current) {
      firstUpdate.current = false;
      return;
    }
    setMount(false);
  }, [props.language]);

  useEffect(() => {
    if (!isServer() && !mount) {
      setMount(true);
    }
  });

  return (
    <CommentDiv>
      <h3>
        <FaComments />
        <Localized id="comments.title" />
      </h3>

    </CommentDiv>
  );
};

const CommentPanelWithCurrentLanguage: React.FC<Omit<Props, "language">> = (props) => {
  const i18n = useI18n();

  return (
    <CommentPanel
      {...props}
      language={languageInfo[i18n.currentLanguage.id].gitalkLangId
        ?? languageInfo.cn.gitalkLangId}
    />
  );
};

export { CommentPanelWithCurrentLanguage,CommentPanel as default };
