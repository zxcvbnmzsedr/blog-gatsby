import React from "react"
import {graphql} from "gatsby"
import 'markdown-navbar/dist/navbar.css';
import DefaultLayout from "../components/layout";
import 'react-medium-image-zoom/dist/styles.css'
import MindMap from "../components/mindmap";

const BlogReadmeMind = ({data}) => {
    const node = data.topic
    const tree = JSON.parse(node.tree);
    const name = node.name
    return (
        <DefaultLayout title={name} isFullContainer>
            <h1 style={{textAlign: "center",marginBottom:100}}>{name}</h1>
            <MindMap extension={true} isScale={false} root={tree} initialTreeDepth={-1}/>
        </DefaultLayout>
    )
}
export default BlogReadmeMind
export const query = graphql`
query MyQuery($title: String) {
  topic(title: {eq: $title}) {
    title
    tree
  }
}
`
