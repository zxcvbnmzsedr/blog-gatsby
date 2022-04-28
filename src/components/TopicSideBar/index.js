import React from 'react';
import {Badge, Menu} from "antd";
import {Link, navigate} from "gatsby"
const { SubMenu } = Menu;

const onClick = (({key}) => {
    navigate(key, {
        replace: true
    })
})
const TopicSideBar = ({treeJson}) => {
    const generateMenuItem = (item) => {
        if (!item.title) {
            return;
        }
        return (
            <Menu.Item key={item.href}>
                {item.title}
            </Menu.Item>
        );
    };
    const generaGroupItem = (item) => {
        if (!item.children || !item.children.length) {
            return generateMenuItem(item);
        }
        return (
            <Menu.ItemGroup key={item.href} title={item.title}>
                {item.children.map(generateMenuItem)}
            </Menu.ItemGroup>
        );
    };
    const generateSubMenuItems = (tree) => {
        const itemGroups = tree.map(menu => {
            if (!menu.children || !menu.children.length) {
                console.log("generateMenuItem",menu)
                return generateMenuItem(menu);
            }
            const groupItems = menu.children.map((item) =>
                generaGroupItem(item)
            );
            return (
                <SubMenu title={menu.title} key={menu.href}>
                    {groupItems}
                </SubMenu>
            );
        });
        return itemGroups;
    };
    const defaultOpenKeys =[]
    const buildTree = (tree) => {
        defaultOpenKeys.push(tree.href)
        tree.children = tree.children.filter(t => t !== null).map(t => {
            if (t.type === 'd') {
                return buildTree(t)
            } else {
                return null;
            }
        }).filter(t => t !== null)

        return tree
    }
    const getMenuItems = () => {
        const tree = JSON.parse(treeJson)
        buildTree(tree)
        console.log(JSON.stringify(tree))
        return generateSubMenuItems(tree.children);
    };

    const menuItems = getMenuItems();
    return <Menu
        onClick={onClick}
        onTitleClick={onClick}
        mode="inline"
        openKeys={defaultOpenKeys}
    >
        {menuItems}
    </Menu>
}

export default TopicSideBar;
