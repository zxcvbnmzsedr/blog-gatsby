import { Link } from "gatsby";
import React from "react";
import { CardBody, CardText } from "reactstrap";
import { useStore } from "simstate";

import { BaseCard, BaseCardHeader } from "@/components/Cards/components";
import { Localized, prefix, useI18n } from "@/i18n";
import MetadataStore from "@/stores/MetadataStore";

import Contacts from "../Contacts";

interface Props {
}

const p = prefix("selfIntro.");

const SelfIntroCard: React.FC<Props> = () => {

  const metadataStore = useStore(MetadataStore);
  const i18n = useI18n();


  return (
    <BaseCard>
      <BaseCardHeader>
        <span>👦 <Localized id={p("author")} /></span>
      </BaseCardHeader>
      <CardBody>
        <CardText>
          <Localized id={p("university")} />
        </CardText>
        <Contacts color="black" size={1.4}/>
      </CardBody>
    </BaseCard>
  );
};

export default SelfIntroCard;
