import React from 'react';
import MarkdownNavbar from "markdown-navbar";
import './sidebar.css'

const SidebarRight = ({raw}) => {
    return <MarkdownNavbar declarative={false} source={raw} ordered={false}/>
}
export default SidebarRight
