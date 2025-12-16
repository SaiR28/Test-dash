import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const StatusContainer = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.sm};
  border-radius: ${props => props.theme.borderRadius.full};
  background: ${props => getStatusBg(props.status, props.theme)};
  border: 1px solid ${props => getStatusColor(props.status, props.theme)};
`;

const StatusDot = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${props => getStatusColor(props.status, props.theme)};
  animation: ${props => props.status === 'online' ? 'pulse 2s infinite' : 'none'};

  @keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.6; }
    100% { opacity: 1; }
  }
`;

const StatusText = styled.span`
  font-size: ${props => props.theme.fontSizes.xs};
  font-weight: ${props => props.theme.fontWeights.medium};
  color: ${props => getStatusColor(props.status, props.theme)};
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const LastSeen = styled.div`
  font-size: ${props => props.theme.fontSizes.xs};
  color: ${props => props.theme.colors.textMuted};
  margin-top: ${props => props.theme.spacing.xs};
`;

function getStatusColor(status, theme) {
  switch (status) {
    case 'online':
      return theme.colors.success;
    case 'offline':
      return theme.colors.danger;
    case 'warning':
      return theme.colors.warning;
    default:
      return theme.colors.textMuted;
  }
}

function getStatusBg(status, theme) {
  switch (status) {
    case 'online':
      return `${theme.colors.success}15`;
    case 'offline':
      return `${theme.colors.danger}15`;
    case 'warning':
      return `${theme.colors.warning}15`;
    default:
      return `${theme.colors.textMuted}15`;
  }
}

function getDeviceStatus(timestamp) {
  if (!timestamp) return { status: 'offline', text: 'No data' };

  const now = Math.floor(Date.now() / 1000);
  const timeDiff = now - timestamp;

  if (timeDiff <= 300) { // 5 minutes
    return { status: 'online', text: 'Online' };
  } else if (timeDiff <= 900) { // 15 minutes
    return { status: 'warning', text: 'Delayed' };
  } else {
    return { status: 'offline', text: 'Offline' };
  }
}

function formatLastSeen(timestamp) {
  if (!timestamp) return 'Never';

  const now = Date.now();
  const lastSeen = new Date(timestamp * 1000);
  const diffMs = now - lastSeen.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMins / 60);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;

  return lastSeen.toLocaleDateString();
}

const IoTStatusIndicator = ({
  unitId,
  timestamp,
  showLastSeen = false,
  compact = false
}) => {
  const [currentTime, setCurrentTime] = useState(Date.now());
  const deviceStatus = getDeviceStatus(timestamp);

  // Update current time every 30 seconds to refresh status
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  if (compact) {
    return (
      <StatusDot status={deviceStatus.status} title={`${unitId}: ${deviceStatus.text}`} />
    );
  }

  return (
    <div>
      <StatusContainer status={deviceStatus.status}>
        <StatusDot status={deviceStatus.status} />
        <StatusText status={deviceStatus.status}>
          {deviceStatus.text}
        </StatusText>
      </StatusContainer>
      {showLastSeen && (
        <LastSeen>
          Last seen: {formatLastSeen(timestamp)}
        </LastSeen>
      )}
    </div>
  );
};

export default IoTStatusIndicator;