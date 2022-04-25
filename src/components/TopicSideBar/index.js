import React from 'react';
import * as styles from './styles.module.css';
import {Link} from 'gatsby';
const buildTree = (tree) => {
    if (tree.type === 'h') {
        return
    }
    return (
        <ul>
            <Link to={tree.href}>{tree.title}</Link>
            <li className={styles.item}>
                {tree.children.map(t => buildTree(t))}
            </li>
        </ul>
    )
}

const TopicSideBar = ({title, treeJson}) => {
    const tree = JSON.parse(treeJson)
    return <aside style={{float:'left',marginLeft:'50px'}}>
        {buildTree(tree)}
    </aside>
}
export default TopicSideBar;
