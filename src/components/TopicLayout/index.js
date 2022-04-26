import * as React from 'react';
import styled from 'styled-components';
import MarkdownNavbar from "markdown-navbar";


const Wrapper = styled('div')`
  display: flex;
  justify-content: space-between;

  .sideBarUL li a {

  }

  .sideBarUL .item > a:hover {
    background-color: #1ed3c6;
    color: #fff !important;

    /* background: #F8F8F8 */
  }

  @media only screen and (max-width: 767px) {
    display: block;
  }
`;

const Content = styled('main')`
  display: flex;
  flex-grow: 1;
  margin: 0px 88px;
  padding-top: 3rem;

  table tr {

  }

  @media only screen and (max-width: 1023px) {
    padding-left: 0;
    margin: 0 10px;
    padding-top: 3rem;
  }
`;

const MaxWidth = styled('div')`
  @media only screen and (max-width: 50rem) {
    width: 100%;
    position: relative;
  }
`;

const LeftSideBarWidth = styled('div')`
  width: 298px;
`;

const RightSideBarWidth = styled('div')`
  width: 224px;
`;

const Layout = ({children, location,raw}) => (
    <Wrapper>
        <LeftSideBarWidth className={'hiddenMobile'}>
        </LeftSideBarWidth>
        <Content>
            <MaxWidth>{children}</MaxWidth>
        </Content>
        <RightSideBarWidth className={'hiddenMobile'}>
            <MarkdownNavbar declarative={true} source={raw}/>
        </RightSideBarWidth>
    </Wrapper>
);

export default Layout;
