import React from 'react';
import Seo from './seo';
import Header from './header';
import Container from './container';
import GlobalStyle from './global-styles';
import {Layout} from 'antd';
import './global.css'
import {isMobile} from 'react-device-detect';

const {Sider} = Layout;
const PostLayout = ({children, title, isFullContainer, description, sidebar, socialImage = ''}) => {
    return (
        <Layout>
            <GlobalStyle/>
            <Seo title={title} description={description} socialImage={socialImage}/>
            <Header/>
            <Layout>
                {!isMobile && sidebar &&
                    <Sider
                        style={{overflowY: 'auto'}}
                        width={300}
                        theme='light'
                    >
                        {sidebar}
                    </Sider>}
                <Layout style={{padding: '0 24px 24px'}}>
                    <Container isMobile={isMobile} full={isFullContainer}>{children}</Container>
                </Layout>
            </Layout>
        </Layout>
    );
};

export default PostLayout;
