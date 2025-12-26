import React from 'react';
import styled from 'styled-components';

const Container = styled.div`
  background: ${props => props.theme.colors.surface};
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  box-shadow: ${props => props.theme.shadows.sm};
`;

const Title = styled.div`
  font-size: 0.7rem;
  font-weight: 600;
  color: ${props => props.theme.colors.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.03em;
  margin-bottom: ${props => props.theme.spacing.xs};
`;

const RoomsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const RoomRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.md};
  padding: 6px 0;
  border-bottom: 1px solid ${props => props.theme.colors.border};

  &:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }
`;

const RoomName = styled.span`
  font-size: 0.8rem;
  font-weight: 600;
  color: ${props => props.theme.colors.text};
  min-width: 80px;
`;

const MetricsGroup = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.md};
  flex-wrap: wrap;
`;

const Metric = styled.span`
  font-size: 0.8rem;
  color: ${props => props.theme.colors.textSecondary};
  display: flex;
  align-items: center;
  gap: 4px;
`;

const MetricValue = styled.span`
  font-weight: 600;
  color: ${props => {
    if (props.status === 'critical') return props.theme.colors.danger;
    if (props.status === 'warning') return props.theme.colors.warning;
    return props.theme.colors.text;
  }};
`;

const MetricLabel = styled.span`
  color: ${props => props.theme.colors.textMuted};
  font-size: 0.7rem;
`;

const getStatus = (value, warningRange, criticalRange) => {
  if (value < criticalRange[0] || value > criticalRange[1]) return 'critical';
  if (value < warningRange[0] || value > warningRange[1]) return 'warning';
  return 'normal';
};

const EnvironmentRow = ({ frontRoom, backRoom }) => {
  return (
    <Container>
      <Title>Environment</Title>
      <RoomsContainer>
        {frontRoom && (
          <RoomRow>
            <RoomName>Front Room</RoomName>
            <MetricsGroup>
              <Metric>
                <MetricValue status={getStatus(frontRoom.temp, [18, 30], [15, 35])}>
                  {frontRoom.temp?.toFixed(1)}°C
                </MetricValue>
              </Metric>
              <Metric>
                <MetricValue status={getStatus(frontRoom.humidity, [40, 80], [30, 90])}>
                  {frontRoom.humidity?.toFixed(0)}%
                </MetricValue>
                <MetricLabel>humidity</MetricLabel>
              </Metric>
              <Metric>
                <MetricValue status={getStatus(frontRoom.co2, [300, 1200], [250, 1500])}>
                  {frontRoom.co2}
                </MetricValue>
                <MetricLabel>ppm CO2</MetricLabel>
              </Metric>
            </MetricsGroup>
          </RoomRow>
        )}

        {backRoom && (
          <RoomRow>
            <RoomName>Back Room</RoomName>
            <MetricsGroup>
              <Metric>
                <MetricValue status={getStatus(backRoom.temp, [18, 30], [15, 35])}>
                  {backRoom.temp?.toFixed(1)}°C
                </MetricValue>
              </Metric>
              <Metric>
                <MetricValue status={getStatus(backRoom.humidity, [40, 80], [30, 90])}>
                  {backRoom.humidity?.toFixed(0)}%
                </MetricValue>
                <MetricLabel>humidity</MetricLabel>
              </Metric>
              {backRoom.acTemp && (
                <Metric>
                  <MetricValue>AC {backRoom.acTemp}°C</MetricValue>
                </Metric>
              )}
            </MetricsGroup>
          </RoomRow>
        )}
      </RoomsContainer>
    </Container>
  );
};

export default EnvironmentRow;
