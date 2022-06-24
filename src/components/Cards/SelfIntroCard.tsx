import React from "react";
import {CardBody, CardText} from "reactstrap";

import {BaseCard, BaseCardHeader} from "@/components/Cards/components";
import {Localized, prefix} from "@/i18n";

import Contacts from "../Contacts";

interface Props {
}

const p = prefix("selfIntro.");

const SelfIntroCard: React.FC<Props> = () => {

  return (
    <BaseCard>
      <BaseCardHeader>
        <span>👦 <Localized id={p("author")}/></span>
      </BaseCardHeader>
      <CardBody>
        <CardText>
          <Localized id={p("university")}/>
        </CardText>
        <Contacts color="black" size={1.4}/>
      </CardBody>
    </BaseCard>
  );
};

export default SelfIntroCard;
