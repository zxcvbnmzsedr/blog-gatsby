import React from 'react';
import styled from 'styled-components';
import {Link} from 'gatsby';
import Container from '../container';
import {useStaticQuery, graphql} from 'gatsby';
import NavItem from "./NavItem";

const Index = () => {
    const {site, allTopic} = useStaticQuery(
        graphql`
      query {
        site {
          siteMetadata {
            title
          }
        }
        allTopic {
          edges {
            node {
              title
              href
            }
          }
        }
      }
    `
    );

    return (
        <StyledHeader>
            <HeaderWrapper>
                <HeaderTitle>
                    <Link to="/">{site.siteMetadata.title}</Link>
                </HeaderTitle>

                <HeaderNavList>
                    <HeaderNavList>
                        <NavItem to="/blog" text="Blog"/>
                        {allTopic.edges.map(({node}) => {
                            const {title, href} = node
                            return <NavItem to={'/mind' + href} text={title}/>
                        })}
                    </HeaderNavList>
                </HeaderNavList>
            </HeaderWrapper>
        </StyledHeader>
    );
};

export default Index;

const HeaderNavList = ({children}) => {
    return (
        <StyledNav>
            <StyledNavList>{children}</StyledNavList>
        </StyledNav>
    );
};


const StyledHeader = styled.header`
  padding-top: var(--size-300);
`;

const HeaderWrapper = styled(Container)`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const HeaderTitle = styled.div`
  & a {
    text-transform: uppercase;
    text-decoration: none;
    font-size: var(--size-400);
    color: inherit;
  }
`;

const StyledNav = styled.nav`
  position: static;
  padding: 0;
  background: transparent;
  backdrop-filter: unset;
`;

const StyledNavList = styled.ul`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  justify-content: space-around;
  padding: 0;
  list-style-type: none;
`;


