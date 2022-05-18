import styled from 'styled-components';

const Container = styled.div`
  max-width: 1300px;
  height: 100%;
  ${props => props.full && `
    max-width: inherit;
    margin-left: unset;
     margin-right: unset;
  `}
  ${props => !props.isMobile && `
    padding-left: var(--size-700);
    padding-right: var(--size-700);
  `}
`;

export default Container;
