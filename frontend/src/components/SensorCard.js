import React from 'react';
import styled from 'styled-components';

const CardContainer = styled.div`
  background: ${props => props.theme.colors.background};
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.md};
  border: 1px solid ${props => props.theme.colors.border};
  border-left: 3px solid ${props => getStatusColor(props.status, props.theme)};
  display: flex;
  flex-direction: column;
  min-height: 85px;
  height: 100%;
  cursor: ${props => props.clickable ? 'pointer' : 'default'};
  transition: ${props => props.theme.transitions.fast};

  ${props => props.clickable && `
    &:hover {
      border-color: ${props.theme.colors.primary}30;
      background: ${props.theme.colors.surface};
    }

    &:active {
      transform: scale(0.98);
    }
  `}

  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    padding: ${props => props.theme.spacing.md};
    min-height: 80px;
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: ${props => props.theme.spacing.sm};
`;

const Title = styled.span`
  font-size: 0.7rem;
  font-weight: 500;
  color: ${props => props.theme.colors.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.02em;
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
    case 'offline':
      return theme.colors.textMuted;
    default:
      return theme.colors.success;
  }
}

function isDataStale(timestamp, maxAgeSeconds = 300) {
  if (!timestamp) return true;
  const now = Math.floor(Date.now() / 1000);
  return (now - timestamp) > maxAgeSeconds;
}

function getStatus(value, ranges, timestamp) {
  // Check if data is stale (offline) first - 5 minutes threshold
  if (isDataStale(timestamp, 300)) return 'offline';

  // If no value, it's offline
  if (value === null || value === undefined) return 'offline';

  // Check ranges if provided
  if (!ranges) return 'normal';
  if (value < ranges.critical.min || value > ranges.critical.max) return 'critical';
  if (value < ranges.warning.min || value > ranges.warning.max) return 'warning';
  return 'normal';
}

function formatTimestamp(timestamp) {
  if (!timestamp) return 'No data';
  return new Date(timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function getTimestampAge(timestamp) {
  if (!timestamp) return 'Never';
  const now = Math.floor(Date.now() / 1000);
  const diff = now - timestamp;

  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const ChartIcon = styled.span`
  font-size: 0.7rem;
  opacity: 0;
  transition: opacity 0.2s;

  ${CardContainer}:hover & {
    opacity: 0.7;
  }
`;

const OfflineOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: ${props => props.theme.colors.surface}80;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: ${props => props.theme.borderRadius.md};
`;

const OfflineText = styled.span`
  font-size: 0.7rem;
  font-weight: 600;
  color: ${props => props.theme.colors.textMuted};
  text-transform: uppercase;
`;

const SensorCard = ({
  title,
  value,
  unit = '',
  status = 'normal',
  timestamp,
  ranges,
  icon,
  onClick,
  sensorKey,
  unitId
}) => {
  const autoStatus = getStatus(value, ranges, timestamp);
  const displayValue = autoStatus === 'offline' ? '--' : (typeof value === 'number' ? value.toFixed(1) : value);
  const isClickable = !!onClick;

  const handleClick = () => {
    if (onClick && autoStatus !== 'offline') {
      onClick({ title, sensorKey, unitId, unit, ranges });
    }
  };

  return (
    <CardContainer
      status={autoStatus}
      clickable={isClickable}
      onClick={handleClick}
      style={{ position: 'relative' }}
    >
      <Header>
        <Title>{icon} {title}</Title>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {isClickable && <ChartIcon>📈</ChartIcon>}
          <StatusDot status={autoStatus} title={autoStatus} />
        </div>
      </Header>
      <ValueRow>
        <Value>{displayValue}</Value>
        {unit && autoStatus !== 'offline' && <Unit>{unit}</Unit>}
      </ValueRow>
      <Timestamp>
        {autoStatus === 'offline' ? `Offline - ${getTimestampAge(timestamp)}` : formatTimestamp(timestamp)}
      </Timestamp>
    </CardContainer>
  );
};

export default SensorCard;
