import React from 'react';
import styled from 'styled-components';

const CardContainer = styled.div`
  background: ${props => props.theme.colors.surface};
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.md};
  box-shadow: ${props => props.theme.shadows.sm};
  border-left: 3px solid ${props => getStatusColor(props.status, props.theme)};
  display: flex;
  flex-direction: column;
  min-height: 80px;
  height: 100%;

  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    padding: ${props => props.theme.spacing.sm};
    min-height: 70px;
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: ${props => props.theme.spacing.xs};
`;

const Title = styled.span`
  font-size: 0.75rem;
  font-weight: 500;
  color: ${props => props.theme.colors.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.03em;
`;

const StatusDot = styled.span`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${props => getStatusColor(props.status, props.theme)};
  flex-shrink: 0;
`;

const ValueRow = styled.div`
  display: flex;
  align-items: baseline;
  gap: 4px;
  margin-top: auto;
`;

const Value = styled.span`
  font-size: 1.5rem;
  font-weight: 700;
  color: ${props => props.theme.colors.text};
  line-height: 1;

  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    font-size: 1.25rem;
  }
`;

const Unit = styled.span`
  font-size: 0.75rem;
  color: ${props => props.theme.colors.textMuted};
  font-weight: 500;
`;

const Timestamp = styled.div`
  font-size: 0.65rem;
  color: ${props => props.theme.colors.textMuted};
  margin-top: 4px;
`;

function getStatusColor(status, theme) {
  switch (status) {
    case 'normal':
      return theme.colors.success;
    case 'warning':
      return theme.colors.warning;
    case 'critical':
      return theme.colors.danger;
    default:
      return theme.colors.success;
  }
}

function getStatus(value, ranges) {
  if (!ranges) return 'normal';
  if (value < ranges.critical.min || value > ranges.critical.max) return 'critical';
  if (value < ranges.warning.min || value > ranges.warning.max) return 'warning';
  return 'normal';
}

function formatTimestamp(timestamp) {
  return new Date(timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

const SensorCard = ({
  title,
  value,
  unit = '',
  status = 'normal',
  timestamp,
  ranges,
  icon
}) => {
  const autoStatus = ranges ? getStatus(value, ranges) : status;
  const displayValue = typeof value === 'number' ? value.toFixed(1) : value;

  return (
    <CardContainer status={autoStatus}>
      <Header>
        <Title>{icon} {title}</Title>
        <StatusDot status={autoStatus} title={autoStatus} />
      </Header>
      <ValueRow>
        <Value>{displayValue}</Value>
        {unit && <Unit>{unit}</Unit>}
      </ValueRow>
      {timestamp && <Timestamp>{formatTimestamp(timestamp)}</Timestamp>}
    </CardContainer>
  );
};

export default SensorCard;
