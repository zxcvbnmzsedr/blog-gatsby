import React from "react";
import { useStaticQuery, graphql } from "gatsby"
import Contacts from "@/components/Contacts";
import { RunningTime } from "@/components/Footer/RunningTime";
import { Localized, prefix } from "@/i18n";

const root = prefix("footer.");

const Brief: React.FC = () => {
  const data = useStaticQuery(graphql`
    {
      site {
        siteMetadata {
          lastUpdated(formatString :"YYYY-MM-DD hh:mm")
        }
      }
    }
  `)

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
        <strong>{data.site.siteMetadata.lastUpdated}</strong>
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
