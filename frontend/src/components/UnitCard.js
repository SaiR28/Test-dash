import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';

const Card = styled(Link)`
  display: block;
  background: ${props => props.theme.colors.surface};
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.sm};
  text-decoration: none;
  color: inherit;
  transition: all 0.15s;
  border: 1px solid ${props => props.theme.colors.border};
  border-left: 3px solid ${props => {
    if (props.status === 'critical') return props.theme.colors.danger;
    if (props.status === 'warning') return props.theme.colors.warning;
    return props.theme.colors.success;
  }};

  &:hover {
    transform: translateY(-1px);
    box-shadow: ${props => props.theme.shadows.md};
    border-color: ${props => props.theme.colors.primary};
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${props => props.theme.spacing.xs};
`;

const UnitName = styled.span`
  font-size: 0.9rem;
  font-weight: 700;
  color: ${props => props.theme.colors.text};
`;

const StatusDot = styled.span`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${props => {
    if (props.status === 'critical') return props.theme.colors.danger;
    if (props.status === 'warning') return props.theme.colors.warning;
    return props.theme.colors.success;
  }};
`;

const MetricsRow = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.md};
  margin-bottom: ${props => props.theme.spacing.xs};
`;

const Metric = styled.div`
  display: flex;
  flex-direction: column;
`;

const MetricValue = styled.span`
  font-size: 1rem;
  font-weight: 600;
  color: ${props => props.theme.colors.text};
`;

const MetricLabel = styled.span`
  font-size: 0.6rem;
  color: ${props => props.theme.colors.textMuted};
  text-transform: uppercase;
`;

const RelayRow = styled.div`
  display: flex;
  gap: 6px;
  padding-top: ${props => props.theme.spacing.xs};
  border-top: 1px solid ${props => props.theme.colors.border};
`;

const RelayIcon = styled.span`
  font-size: 0.85rem;
  opacity: ${props => props.isOn ? 1 : 0.3};
  filter: ${props => props.isOn ? 'none' : 'grayscale(100%)'};
`;

const UnitCard = ({
  unitId,
  type,
  status = 'normal',
  ph,
  tds,
  waterTemp,
  waterLevel,
  relays = {}
}) => {
  return (
    <Card to={`/hydro-units/${unitId}`} status={status}>
      <Header>
        <UnitName>{unitId}</UnitName>
        <StatusDot status={status} title={status} />
      </Header>

      <MetricsRow>
        <Metric>
          <MetricValue>{ph?.toFixed(1) || '-'}</MetricValue>
          <MetricLabel>pH</MetricLabel>
        </Metric>
        <Metric>
          <MetricValue>{tds || '-'}</MetricValue>
          <MetricLabel>TDS</MetricLabel>
        </Metric>
        <Metric>
          <MetricValue>{waterTemp?.toFixed(0) || '-'}°</MetricValue>
          <MetricLabel>Temp</MetricLabel>
        </Metric>
        <Metric>
          <MetricValue>{waterLevel || '-'}%</MetricValue>
          <MetricLabel>Level</MetricLabel>
        </Metric>
      </MetricsRow>

      <RelayRow>
        <RelayIcon isOn={relays.lights === 'ON'} title={`Lights: ${relays.lights || 'OFF'}`}>
          💡
        </RelayIcon>
        <RelayIcon isOn={relays.fans === 'ON'} title={`Fans: ${relays.fans || 'OFF'}`}>
          🌀
        </RelayIcon>
        <RelayIcon isOn={relays.pump === 'ON'} title={`Pump: ${relays.pump || 'OFF'}`}>
          💧
        </RelayIcon>
      </RelayRow>
    </Card>
  );
};

export default UnitCard;
