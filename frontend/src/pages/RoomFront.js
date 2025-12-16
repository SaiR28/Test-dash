import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import SensorCard from '../components/SensorCard';
import { roomAPI, apiUtils } from '../services/api';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.md};
`;

const Section = styled.section`
  background: ${props => props.theme.colors.surface};
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.md};
  box-shadow: ${props => props.theme.shadows.sm};
`;

const SectionTitle = styled.h2`
  font-size: 0.85rem;
  font-weight: 600;
  color: ${props => props.theme.colors.textSecondary};
  margin-bottom: ${props => props.theme.spacing.sm};
  text-transform: uppercase;
  letter-spacing: 0.03em;
`;

const StatusRow = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.md};
  flex-wrap: wrap;
`;

const StatusItem = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  background: ${props => props.theme.colors.background};
  border-radius: ${props => props.theme.borderRadius.md};
  font-size: 0.85rem;
`;

const StatusLabel = styled.span`
  color: ${props => props.theme.colors.textMuted};
`;

const StatusValue = styled.span`
  font-weight: 600;
  color: ${props => props.theme.colors.text};
`;

const LoadingMessage = styled.div`
  text-align: center;
  padding: ${props => props.theme.spacing.lg};
  color: ${props => props.theme.colors.textSecondary};
`;

const ErrorMessage = styled.div`
  background: ${props => props.theme.colors.danger}10;
  color: ${props => props.theme.colors.danger};
  padding: ${props => props.theme.spacing.md};
  border-radius: ${props => props.theme.borderRadius.md};
  border: 1px solid ${props => props.theme.colors.danger}30;
`;

const RoomFront = () => {
  const [sensorData, setSensorData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await roomAPI.getFrontSensors();
      setSensorData(response.data);
    } catch (err) {
      setError(apiUtils.handleError(err, 'Failed to load front room data'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <LoadingMessage>Loading front room data...</LoadingMessage>;
  }

  if (error) {
    return <ErrorMessage>{error}</ErrorMessage>;
  }

  return (
    <Container>
      <Section>
        <SectionTitle>🌡️ Environmental Monitoring</SectionTitle>
        {sensorData && (
          <div className="sensor-grid">
            <SensorCard
              title="Temperature"
              value={sensorData.bme?.temp}
              unit="°C"
              timestamp={sensorData.timestamp}
              ranges={{
                warning: { min: 18, max: 30 },
                critical: { min: 15, max: 35 }
              }}
              icon="🌡️"
            />
            <SensorCard
              title="Humidity"
              value={sensorData.bme?.humidity}
              unit="%"
              timestamp={sensorData.timestamp}
              ranges={{
                warning: { min: 40, max: 80 },
                critical: { min: 30, max: 90 }
              }}
              icon="💧"
            />
            <SensorCard
              title="Pressure"
              value={sensorData.bme?.pressure}
              unit="hPa"
              timestamp={sensorData.timestamp}
              ranges={{
                warning: { min: 990, max: 1030 },
                critical: { min: 980, max: 1040 }
              }}
              icon="🎯"
            />
            <SensorCard
              title="Air Quality"
              value={sensorData.bme?.iaq}
              unit="IAQ"
              timestamp={sensorData.timestamp}
              ranges={{
                warning: { min: 0, max: 200 },
                critical: { min: 0, max: 300 }
              }}
              icon="🌬️"
            />
            <SensorCard
              title="CO2 Level"
              value={sensorData.co2}
              unit="ppm"
              timestamp={sensorData.timestamp}
              ranges={{
                warning: { min: 300, max: 1200 },
                critical: { min: 250, max: 1500 }
              }}
              icon="🌿"
            />
          </div>
        )}
      </Section>

      <Section>
        <SectionTitle>📊 System Status</SectionTitle>
        <StatusRow>
          <StatusItem>
            <StatusLabel>Last Update:</StatusLabel>
            <StatusValue>
              {sensorData ? new Date(sensorData.timestamp * 1000).toLocaleTimeString() : 'N/A'}
            </StatusValue>
          </StatusItem>
          <StatusItem>
            <StatusLabel>Sensors:</StatusLabel>
            <StatusValue>5 Online</StatusValue>
          </StatusItem>
          <StatusItem>
            <StatusLabel>Status:</StatusLabel>
            <StatusValue style={{ color: '#10b981' }}>● Active</StatusValue>
          </StatusItem>
        </StatusRow>
      </Section>
    </Container>
  );
};

export default RoomFront;
