import React from 'react';
import styled from 'styled-components';

const CardContainer = styled.div`
  background: ${props => props.theme.colors.surface};
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.sm};
  box-shadow: ${props => props.theme.shadows.sm};
  border-left: 3px solid ${props => getStatusColor(props.status, props.theme)};
  min-height: 70px;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
`;

const Location = styled.span`
  font-size: 0.7rem;
  font-weight: 600;
  color: ${props => props.theme.colors.textMuted};
  text-transform: uppercase;
`;

const StatusDot = styled.span`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: ${props => getStatusColor(props.status, props.theme)};
`;

const ReadingsRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Reading = styled.div`
  display: flex;
  align-items: baseline;
  gap: 2px;
`;

const Value = styled.span`
  font-size: 1.1rem;
  font-weight: 700;
  color: ${props => props.theme.colors.text};
`;

const Unit = styled.span`
  font-size: 0.65rem;
  color: ${props => props.theme.colors.textMuted};
`;

function getStatusColor(status, theme) {
  switch (status) {
    case 'normal': return theme.colors.success;
    case 'warning': return theme.colors.warning;
    case 'critical': return theme.colors.danger;
    default: return theme.colors.success;
  }
}

function getStatus(value, ranges) {
  if (!ranges) return 'normal';
  if (value < ranges.critical.min || value > ranges.critical.max) return 'critical';
  if (value < ranges.warning.min || value > ranges.warning.max) return 'warning';
  return 'normal';
}

const DHT22Card = ({
  location,
  temperature,
  humidity,
  timestamp,
  tempRanges,
  humidityRanges
}) => {
  const tempStatus = tempRanges ? getStatus(temperature, tempRanges) : 'normal';
  const humidityStatus = humidityRanges ? getStatus(humidity, humidityRanges) : 'normal';
  const overallStatus = tempStatus === 'critical' || humidityStatus === 'critical' ? 'critical' :
                       tempStatus === 'warning' || humidityStatus === 'warning' ? 'warning' : 'normal';

  return (
    <CardContainer status={overallStatus}>
      <Header>
        <Location>{location}</Location>
        <StatusDot status={overallStatus} />
      </Header>
      <ReadingsRow>
        <Reading>
          <Value>{typeof temperature === 'number' ? temperature.toFixed(1) : temperature}</Value>
          <Unit>°C</Unit>
        </Reading>
        <Reading>
          <Value>{typeof humidity === 'number' ? humidity.toFixed(0) : humidity}</Value>
          <Unit>%</Unit>
        </Reading>
      </ReadingsRow>
    </CardContainer>
  );
};

export default DHT22Card;
