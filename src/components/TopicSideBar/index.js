import React from 'react';
import * as styles from './styles.module.css';
import {Link} from 'gatsby';
import styled from 'styled-components';

const buildTree = (tree) => {
    if (tree.type === 'h') {
        return
    }
    return (
        <ul>
            <li className={styles.item}>
                <Link to={tree.href}>{tree.title}</Link>
                {tree.children.map(t => buildTree(t))}
            </li>
        </ul>
    )
}

const TopicSideBar = ({title, treeJson}) => {
    const tree = JSON.parse(treeJson)
    return <Sidebar>
        {buildTree(tree)}
    </Sidebar>
}
const Sidebar = styled('aside')`
  width: 100%;
  height: 100vh;
  overflow: auto;
  position: fixed;
  padding-left: 0px;
  top: 50px;
  padding-right: 0;
  left: 50%;
  margin-left: -700px;
  @media only screen and (max-width: 1023px) {
    width: 100%;
    /* position: relative; */
    height: 100vh;
  }

  @media (min-width: 767px) and (max-width: 1023px) {
    padding-left: 0;
  }

  @media only screen and (max-width: 767px) {
    padding-left: 0px;
    height: auto;
  }
`;
export default TopicSideBar;
