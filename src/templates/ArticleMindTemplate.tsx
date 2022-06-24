import React from "react"
import MindMap from "@/components/MindMap";
import BannerLayout from "@/layouts/BannerLayout";
import {TopicNodeTree} from "@/models/ArticleNode";


interface Props {
  pageContext: {
    title: string;
    tree: TopicNodeTree;
  };
}

const ArticleMindTemplate: React.FC<Props> = ({pageContext: {title,tree}}) => {
  return (
    <BannerLayout transparentHeader={true}
    banner={
      <h1>
        {title}
      </h1>
    }>
      <MindMap tree={tree}/>
    </BannerLayout>
  )
}
export default ArticleMindTemplate
