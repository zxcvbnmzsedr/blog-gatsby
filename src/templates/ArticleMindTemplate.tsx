import React from "react"
import MindMap from "@/components/MindMap";
import BannerLayout from "@/layouts/BannerLayout";


interface Props {
  pageContext: {
    title: string;
  };
}

const ArticleMindTemplate: React.FC<Props> = ({pageContext: {title}}) => {
  return (
    <BannerLayout transparentHeader={true}
    banner={
      <h1>
        {title}
      </h1>
    }>
      <MindMap title={title}/>
    </BannerLayout>
  )
}
export default ArticleMindTemplate
