import React from 'react';
import Seo from './seo';
import Header from './header';
import Container from './container';
import {Col, Layout, Row} from 'antd';
import './global.css'
import {isMobile} from 'react-device-detect';

const {Sider} = Layout;
const PostLayout = ({children, title, isFullContainer, description, sidebar, socialImage = ''}) => {
    const span = isFullContainer ? 24:16
    return (
        <Layout>
            <Seo title={title} description={description} socialImage={socialImage}/>
            <Row type="flex" justify="center">
                <Col xxl={16} xs={24}>
                    <Header/>
                </Col>
                <Col xxl={span} xs={24}>
                    <Layout>

                        {sidebar &&
                            <Col lg={5} xs={0} span={0}>
                                <Sider
                                    style={{overflowY: 'auto'}}
                                    width={300}
                                    theme='light'
                                >
                                    {sidebar}
                                </Sider>
                            </Col>
                            }
                        <Layout style={{padding: '0 24px 24px'}}>
                            <Container isMobile={isMobile} full={isFullContainer}>{children}</Container>
                        </Layout>
                    </Layout>
                </Col>
            </Row>
        </Layout>
    )
        ;
};

export default PostLayout;
