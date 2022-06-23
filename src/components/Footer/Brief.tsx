import React from "react";
import { useStore } from "simstate";

import Contacts from "@/components/Contacts";
import { RunningTime } from "@/components/Footer/RunningTime";
import { Localized, prefix } from "@/i18n";
import MetadataStore from "@/stores/MetadataStore";

const root = prefix("footer.");

const Brief: React.FC = () => {

  const metadataStore = useStore(MetadataStore);

  return (
    <div className="footer-brief">
      <p>
        📝 <Localized id={root("license")} args={[
          <a key="license" rel="licene"
            href="https://creativecommons.org/licenses/by-sa/4.0/"
          >
            CC BY-SA 4.0
          </a>,
        ]} />

      </p>
      <p>
        ⏲️ <Localized id="statistics.lastUpdated" />:
        <strong>{metadataStore.siteMetadata.formattedLastUpdate}</strong>
      </p>
      {/* <p>
        📔 <Localized id={lang.statistics.articleCount} replacements={[
          <strong key="articles">{allArticles.length}</strong>,
          <strong key="words">{totalWordsCount}</strong>,
        ]} />
      </p> */}
      <RunningTime />
      <div>
        <span id="contacts">📲 <Localized id={root("contacts")} /></span>
        <Contacts color="white" size={1.6} />
      </div>

    </div>
  );
};

export default Brief;