import React from "react"
import remarkGfm from "remark-gfm";
import ReactMarkdown from "react-markdown";
import * as style from './topic-post.module.css'
import {Prism as SyntaxHighlighter} from 'react-syntax-highlighter'
import {okaidia} from 'react-syntax-highlighter/dist/esm/styles/prism'
import Zoom from 'react-medium-image-zoom'
import 'react-medium-image-zoom/dist/styles.css'
import Mermaid from '../mermaid'
import CopyButton from "../copybutton";
import rehypeRaw from 'rehype-raw'
import {Affix, Col} from "antd";
import SidebarRight from "../SidebarRight";
import '../../static/toc.less'

const Post = ({rawMarkdownBody}) => {
    return (
        <div>
            <div className={style.markdownBody}>
                <ReactMarkdown
                    className="markdown-body"
                    children={rawMarkdownBody}
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw]}
                    components={{
                        img({alt, ...props}) {
                            return <Zoom wrapStyle={{display: "block"}}>
                                <img style={{margin: "0 auto", width: 700}} {...props} alt={alt}/>
                            </Zoom>
                        },
                        video({alt, ...props}) {
                            return <div style={{textAlign: "center"}}>
                                <video style={{margin: "0 auto", width: 700}} {...props} >
                                    <track/>
                                </video>
                            </div>
                        },
                        table({alt, ...props}) {
                            return <div style={{textAlign: "center"}}>
                                <table style={{margin: "0 auto", width: 700}} {...props} />
                            </div>
                        },
                        // 重写URL ，让他不用跳来跳去
                        a({node, href, className, children, ...props}) {
                            return (
                                <a href={href.split('.md')[0]} {...props}>{children}</a>
                            )
                        }, code: ({inline, children, className, ...props}) => {
                            const txt = children[0];
                            if (
                                txt &&
                                typeof txt === "string" &&
                                typeof className === "string" &&
                                /^language-mermaid/.test(className.toLocaleLowerCase())
                            ) {
                                return <Mermaid chart={txt}/>;
                            }
                            const match = /language-(\w+)/.exec(className || '')
                            return !inline && match ? (
                                <div style={{
                                    position: "relative",
                                }}>
                                    <SyntaxHighlighter
                                        children={String(children).replace(/\n$/, '')}
                                        language={match[1]}
                                        style={okaidia}
                                        PreTag="div"
                                        {...props}
                                    >
                                    </SyntaxHighlighter>
                                    <CopyButton valueToCopy={txt}/>
                                </div>
                            ) : (
                                <code className={className} {...props}>
                                    {children}
                                </code>
                            )
                        }
                    }}
                />
            </div>
            <Col lg={24} xs={0} span={0}>
                <Affix className="toc-affix" offsetTop={16}>
                    <SidebarRight raw={rawMarkdownBody}/>
                </Affix>
            </Col>
        </div>
    )
}
export default Post
