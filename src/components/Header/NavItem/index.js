import {Link} from "gatsby";
import React from "react";
import styled from "styled-components";

const NavItem = ({to, text}) => {
    return (
        <HeaderNavListItem>
            <Link to={to}>{text}</Link>
        </HeaderNavListItem>
    )
}

const HeaderNavListItem = ({children}) => {
    return <StyledNavListItem>{children}</StyledNavListItem>;
};
const StyledNavListItem = styled.li`
  &:not(:last-of-type) {
    margin-right: 2rem;
  }

  @media screen and (max-width: 700px) {
    &:not(:last-of-type) {
      margin-right: 1rem;
    }
  }

  & a {
    color: inherit;
    text-transform: uppercase;
    font-size: var(--size-300);
    text-decoration: none;
    letter-spacing: 0.1rem;
  }

  @media screen and (max-width: 700px) {
    & a {
      font-size: 0.7rem;
    }
  }
`;
export default NavItem
