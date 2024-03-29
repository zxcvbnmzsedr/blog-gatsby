import {Link} from "gatsby";
import React, {useCallback, useState} from "react";
import {FaBookOpen, FaHome, FaInfo,} from "react-icons/fa";
import {
  Collapse,
  DropdownMenu as BSDropdownMenu,
  DropdownToggle as BSDropdownToggle,
  DropdownToggleProps,
  Nav,
  Navbar,
  NavbarToggler,
  UncontrolledDropdown,
} from "reactstrap";
import {useStore} from "simstate";
import styled from "styled-components";
import Placeholder from "@/components/Header/HeaderPlaceholder";
import NavItem from "@/components/Header/NavItem";
import {Localized, prefix} from "@/i18n";
import LocationStore from "@/stores/LocationStore";
import {colors, widths} from "@/styles/variables";
import isServer from "@/utils/isServer";
import {useEventListener} from "@/utils/useEventListener";
import Icon from "~/assets/logo.svg";
import MetadataStore from "@/stores/MetadataStore";

interface Props {
  transparentHeader: boolean;
}

const root = prefix("headers.");

const StyledNavbar = styled(Navbar)`
  && {
    max-width: ${widths.mainContent}px;
    margin-left: auto;
    margin-right: auto;
    padding: 4px 8px;

    transition: width 0.2s ease-in-out;
  }
`;

const Container = styled.header`

`;

const NavbarContainer = styled.div<{ transparent: boolean }>`
  transition: background-color 0.2s ease-in-out;
  background-color: ${({transparent}) => transparent ? "transparent" : colors.headerBg};
`;

const Header: React.FC<Props> = ({transparentHeader}) => {
  const [isOpen, setOpen] = useState(false);
  const [isTransparent, setTransparent] = useState(transparentHeader);

  if (!isServer()) {
    // eslint-disable-next-line no-undef
    useEventListener(window, "scroll", () => {
      // eslint-disable-next-line no-undef
      setTransparent(transparentHeader && window.scrollY === 0);
    }, [transparentHeader]);
  }

  const close = useCallback(() => {
    setOpen(false);
  }, []);
  const metadataStore = useStore(MetadataStore);
  return (
    <Container>
      <Placeholder
        isOpen={isOpen}
        transparent={transparentHeader}
      />
      <NavbarContainer transparent={isTransparent} className="fixed-top">
        <StyledNavbar dark={true} expand="md">
          <Branding/>
          <NavbarToggler onClick={() => setOpen(!isOpen)}/>
          <Collapse isOpen={isOpen} navbar={true}>
            <Nav className="ml-auto" navbar={true}>
              <NavItem
                wrapper="navItem"
                to="/"
                onClick={close}
                match={"exact"}
                Icon={FaHome}
                textId={root("home")}
              />
              <NavItem
                wrapper="navItem"
                to="/posts"
                onClick={close}
                match={"startsWith"}
                Icon={FaBookOpen}
                textId={root("posts")}
              />
              <UncontrolledDropdown nav={true} inNavbar={true}>
                <DropdownToggle nav={true} caret={true}>
                  <FaInfo/>
                  <Localized id={root("topic.title")}/>
                </DropdownToggle>
                <DropdownMenu right={true}>
                  {
                    metadataStore.topicList.map(e => {
                      return (
                        <NavItem
                          wrapper="navItem"
                          to={`/mind/topic/${e.title}`}
                          onClick={close}
                          match={"startsWith"}
                          text={e.title}
                        />
                      )
                    })
                  }
                </DropdownMenu>
              </UncontrolledDropdown>
            </Nav>
          </Collapse>
        </StyledNavbar>
      </NavbarContainer>
    </Container>
  );
};

export default Header;

const StyledLogo = styled(Icon)`
  width: 42px;
  height: 42px;
  margin-right: 8px;
`;

const DropdownMenu = styled(BSDropdownMenu)`
  .dropdown-item {
    padding-top: 0;
    padding-bottom: 0;
  }
`;

const Branding: React.FC = () => {
  return (
    <Link to={"/"} className={"navbar-brand"}>
      <StyledLogo/>
      天增的博客
    </Link>
  );
};

const DropdownToggle: React.FC<DropdownToggleProps> = (props) => {
  const {pathname} = useStore(LocationStore);

  const {className, ...rest} = props;

  return (
    <BSDropdownToggle {...rest} className={
      [className, pathname.startsWith("/about") ? "active" : undefined].filter((x) => !!x)
        .join(" ")
    }
    />
  );
};
