import React from 'react';
import {Menu} from "antd";
import {navigate} from "gatsby"

const onClick = (({key}) => {
    console.log(key)
    navigate(key, {
        replace: true
    })
})
const TopicSideBar = ({treeJson}) => {
    const defaultOpenKeys = []
    const buildTree = (tree) => {
        tree.label = tree.title
        tree.key = tree.href
        defaultOpenKeys.push(tree.key)
        tree.children = tree.children?.filter(t => t !== null).map(t => {
            if (t.type === 'd') {
                return buildTree(t)
            } else {
                return null;
            }
        })
        if (tree.children?.length === 0) {
            tree.children = null
        }
        return tree
    }

    const buildTree2 = (tree) => {

        if (!tree){
            return <></>
        }
        // tree.label = tree.title
        // tree.key = tree.href
        // defaultOpenKeys.push(tree.key)
        return <Menu.SubMenu key={tree.title}>
            {tree.title}
            <Menu.Item>
                {
                    tree.children.map(t => {
                            return buildTree2(t)
                        }
                    )
                }
            </Menu.Item>

        </Menu.SubMenu>
    }

    const tree = JSON.parse(treeJson)
    console.log(tree)
    buildTree(tree)
    const items = buildTree(tree).children
    return <Menu
        onClick={onClick}
        onTitleClick={onClick}
        openKeys={defaultOpenKeys}
        defaultOpenKeys={defaultOpenKeys}
        triggerSubMenuAction="click"
        mode="inline"
        items={items}
    >
        {/*{buildTree2(tree)}*/}
    </Menu>
}

export default TopicSideBar;
