import React from 'react';
import {Badge, Menu} from "antd";
import {Link, navigate} from "gatsby"
import {useLocation} from '@reach/router';

const {SubMenu} = Menu;

const onClick = (({key}) => {
    navigate(key, {
        replace: true
    })
})
const onTitleClick = (({key}) => {
    navigate(key, {
        replace: true
    })
})
const TopicSideBar = ({treeJson}) => {
    const location = useLocation();
    const generateMenuItem = (item) => {
        if (!item.title) {
            return;
        }
        const text = item.title;

        const child = <Link to={item.href}>
            <Badge dot={false}>
                {text}
            </Badge>
        </Link>;
        return (
            <Menu.Item key={item.href} disabled={false}>
                {child}
            </Menu.Item>
        );
    };
    const generaGroupItem = (item) => {
        if (!item.children || !item.children.length) {
            return generateMenuItem(item);
        }
        return (
            <SubMenu onTitleClick={onTitleClick} key={item.href} title={item.title}>
                {item.children.map(generateMenuItem)}
            </SubMenu>
        );
    };
    const generateSubMenuItems = (tree) => {
        return tree.map(menu => {
            if (!menu.children || !menu.children.length) {
                return generateMenuItem(menu);
            }
            const groupItems = menu.children.map((item) =>
                generaGroupItem(item)
            );
            return (
                <SubMenu onTitleClick={onTitleClick} title={menu.title} key={menu.href}>
                    {groupItems}
                </SubMenu>
            );
        });
    };
    const defaultOpenKeys = []
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
        return generateSubMenuItems(tree.children);
    };

    const menuItems = getMenuItems();
    return <Menu
        onClick={onClick}
        onTitleClick={onTitleClick}
        mode="inline"
        openKeys={defaultOpenKeys}
        selectedKeys={[decodeURI(location.pathname)]}
    >
        {menuItems}
    </Menu>
}

export default TopicSideBar;
