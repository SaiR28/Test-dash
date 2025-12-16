import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';

const Container = styled.div`
  background: ${props => props.theme.colors.danger}10;
  border: 1px solid ${props => props.theme.colors.danger}30;
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  margin-bottom: ${props => props.theme.spacing.md};
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  margin-bottom: ${props => props.theme.spacing.xs};
`;

const Title = styled.span`
  font-size: 0.75rem;
  font-weight: 600;
  color: ${props => props.theme.colors.danger};
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const Count = styled.span`
  background: ${props => props.theme.colors.danger};
  color: white;
  font-size: 0.65rem;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 10px;
`;

const AlertsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const AlertItem = styled(Link)`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 10px;
  background: white;
  border-radius: 4px;
  text-decoration: none;
  transition: all 0.15s;

  &:hover {
    background: ${props => props.theme.colors.danger}10;
  }
`;

const AlertText = styled.span`
  font-size: 0.8rem;
  color: ${props => props.theme.colors.text};
  display: flex;
  align-items: center;
  gap: 6px;
`;

const AlertUnit = styled.span`
  font-weight: 600;
  color: ${props => props.theme.colors.danger};
`;

const AlertValue = styled.span`
  color: ${props => props.theme.colors.textSecondary};
`;

const ViewLink = styled.span`
  font-size: 0.7rem;
  color: ${props => props.theme.colors.primary};
  font-weight: 500;
`;

const WarningContainer = styled(Container)`
  background: ${props => props.theme.colors.warning}10;
  border-color: ${props => props.theme.colors.warning}30;
`;

const WarningTitle = styled(Title)`
  color: ${props => props.theme.colors.warning};
`;

const WarningCount = styled(Count)`
  background: ${props => props.theme.colors.warning};
`;

const WarningItem = styled(AlertItem)`
  &:hover {
    background: ${props => props.theme.colors.warning}10;
  }
`;

const WarningUnit = styled(AlertUnit)`
  color: ${props => props.theme.colors.warning};
`;

const AlertsBanner = ({ alerts = [], warnings = [] }) => {
  if (alerts.length === 0 && warnings.length === 0) {
    return null;
  }

  return (
    <>
      {alerts.length > 0 && (
        <Container>
          <Header>
            <Title>Critical Alerts</Title>
            <Count>{alerts.length}</Count>
          </Header>
          <AlertsList>
            {alerts.map((alert, index) => (
              <AlertItem key={index} to={`/hydro-units/${alert.unitId}`}>
                <AlertText>
                  <AlertUnit>{alert.unitId}</AlertUnit>
                  <span>{alert.message}</span>
                  <AlertValue>({alert.value})</AlertValue>
                </AlertText>
                <ViewLink>View</ViewLink>
              </AlertItem>
            ))}
          </AlertsList>
        </Container>
      )}

      {warnings.length > 0 && (
        <WarningContainer>
          <Header>
            <WarningTitle>Warnings</WarningTitle>
            <WarningCount>{warnings.length}</WarningCount>
          </Header>
          <AlertsList>
            {warnings.map((warning, index) => (
              <WarningItem key={index} to={`/hydro-units/${warning.unitId}`}>
                <AlertText>
                  <WarningUnit>{warning.unitId}</WarningUnit>
                  <span>{warning.message}</span>
                  <AlertValue>({warning.value})</AlertValue>
                </AlertText>
                <ViewLink>View</ViewLink>
              </WarningItem>
            ))}
          </AlertsList>
        </WarningContainer>
      )}
    </>
  );
};

export default AlertsBanner;
