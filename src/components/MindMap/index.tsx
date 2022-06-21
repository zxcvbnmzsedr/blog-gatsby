import * as React from "react";
import {useStore} from "simstate";
import MetadataStore from "@/stores/MetadataStore";
import {Markmap} from "markmap-view";
import {INode} from 'markmap-common';
import {SVGAttributes} from "react";


function handleNodes(parent, root, initialTreeDepth, count): INode {

  const node: INode = {
    type: root.type,
    depth: root.level,
    content: `<a href="${root.href}">${root.title}</a>`
  };
  if (root.children && root.children.length > 0) {
    node.children = []
    for (const c of root.children) {
      node.children.push(handleNodes(node, c, initialTreeDepth, count + 1))
    }
  }
  return node;
}


const MindMap = ({
                   title,
                   height = 800,
                 }) => {
  const metadataStore = useStore(MetadataStore);
  const root = metadataStore.topicList.filter(e => e.title === title)[0].tree
  // @ts-ignore
  const svgRef = React.useRef<SVGAttributes>();
  const markMapRef = React.useRef<Markmap>();

  React.useEffect(() => {
    if (!svgRef.current) {
      return
    }
    const nodes = handleNodes(null, root, 3, 0);
    if (markMapRef.current) {
      markMapRef.current.setData(nodes);
      markMapRef.current.fit();
      return;
    }
    markMapRef.current = Markmap.create(svgRef.current, {
      fitRatio: 1,
      initialExpandLevel: 3,
      autoFit: true,
      scrollForPan: true,
    }, nodes);
  }, [root]);

  return (
    <div style={{textAlign: "center"}}>
      <svg ref={svgRef}
           style={{
             width: "90%",
             height: height,
           }}/>
    </div>

  )
};

export default MindMap;
