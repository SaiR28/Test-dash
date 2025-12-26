import React from 'react';
import styled from 'styled-components';

const Container = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.sm};
  flex-wrap: wrap;
  margin-bottom: ${props => props.theme.spacing.md};
`;

const StatCard = styled.div`
  flex: 1;
  min-width: 80px;
  max-width: 120px;
  background: ${props => props.theme.colors.surface};
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.sm};
  text-align: center;
  box-shadow: ${props => props.theme.shadows.sm};
  border-top: 3px solid ${props => {
    if (props.status === 'critical') return props.theme.colors.danger;
    if (props.status === 'warning') return props.theme.colors.warning;
    return props.theme.colors.success;
  }};
`;

const Value = styled.div`
  font-size: 1.25rem;
  font-weight: 700;
  color: ${props => props.theme.colors.text};
  line-height: 1.2;
`;

const Label = styled.div`
  font-size: 0.65rem;
  color: ${props => props.theme.colors.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.03em;
  margin-top: 2px;
`;

const StatusDot = styled.span`
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${props => props.connected ? props.theme.colors.success : props.theme.colors.danger};
  animation: ${props => props.connected ? 'pulse 2s infinite' : 'none'};

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`;

const QuickStats = ({
  unitsOnline,
  totalUnits,
  alertCount,
  warningCount,
  avgPh,
  roomTemp,
  roomHumidity,
  connected
}) => {
  const getPhStatus = (ph) => {
    if (ph < 5.5 || ph > 7.5) return 'critical';
    if (ph < 6.0 || ph > 7.0) return 'warning';
    return 'normal';
  };

  const getTempStatus = (temp) => {
    if (temp < 15 || temp > 35) return 'critical';
    if (temp < 18 || temp > 30) return 'warning';
    return 'normal';
  };

  return (
    <Container>
      <StatCard status={unitsOnline === totalUnits ? 'normal' : 'warning'}>
        <Value>{unitsOnline}/{totalUnits}</Value>
        <Label>Online</Label>
      </StatCard>

      <StatCard status={alertCount > 0 ? 'critical' : warningCount > 0 ? 'warning' : 'normal'}>
        <Value>{alertCount + warningCount}</Value>
        <Label>Issues</Label>
      </StatCard>

      <StatCard status={getPhStatus(avgPh)}>
        <Value>{avgPh?.toFixed(1) || '-'}</Value>
        <Label>Avg pH</Label>
      </StatCard>

      <StatCard status={getTempStatus(roomTemp)}>
        <Value>{roomTemp?.toFixed(0) || '-'}°</Value>
        <Label>Room</Label>
      </StatCard>

      <StatCard status="normal">
        <Value>{roomHumidity?.toFixed(0) || '-'}%</Value>
        <Label>Humidity</Label>
      </StatCard>

      <StatCard status={connected ? 'normal' : 'critical'}>
        <Value><StatusDot connected={connected} /></Value>
        <Label>Live</Label>
      </StatCard>
    </Container>
  );
};

export default QuickStats;
