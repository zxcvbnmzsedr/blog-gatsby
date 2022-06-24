import React from "react";
import {FaGithub, FaMailBulk,} from "react-icons/fa";
import styled from "styled-components";

interface Props {
  color: string;
  size: number;
}

const contacts = [
  [FaMailBulk, "mailto://i@ztianzeng.com", "E-mail: i@ztianzeng.com"],
  [FaGithub, "https://github.com/zxcvbnmzsedr", "GitHub: zxcvbnmzsedr"],
] as Array<[React.ComponentType, string, string]>;

const Contact = styled.span<{ color: string; size: number }>`
  svg {
    transition: transform 0.2s linear;

    height: ${(props) => props.size}em;
    width: ${(props) => props.size}em;
    margin: 12px 12px 12px 0;
    color: ${(props) => props.color};
    fill: ${(props) => props.color};

    &:hover {
      transform: scale(1.4);
    }


  }

`;

const Container = styled.div`
  margin: 4px 0;
`;

const Contacts: React.FC<Props> = (props) => {

  return (
    <Container>
      {contacts.map((contact) => {
        const [Icon, link, title] = contact;
        return (
          <Contact key={link} color={props.color} size={props.size}>
            <a href={link} title={title} target="__blank">
              <Icon />
            </a>
          </Contact>
        );
      })}
    </Container>
  );
};

export default Contacts;
