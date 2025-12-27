import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';
import SensorCard from '../components/SensorCard';
import SensorChartModal from '../components/SensorChartModal';
import DHT22Card from '../components/DHT22Card';
import RelayControl from '../components/RelayControl';
import PumpControl from '../components/PumpControl';
import { hydroUnitsAPI, apiUtils } from '../services/api';
import { useSocket } from '../contexts/SocketContext';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.lg};
`;

/* Hero Header for Unit */
const HeroHeader = styled.div`
  background: ${props => props.theme.colors.primaryGradient};
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: ${props => props.theme.spacing.xl};
  color: white;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: -50%;
    right: -10%;
    width: 300px;
    height: 300px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 50%;
  }

  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    padding: ${props => props.theme.spacing.lg};
  }
`;

const HeroContent = styled.div`
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: ${props => props.theme.spacing.lg};
`;

const HeroLeft = styled.div``;

const HeroTitle = styled.h1`
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0 0 ${props => props.theme.spacing.xs} 0;
`;

const HeroSubtitle = styled.p`
  font-size: 0.85rem;
  opacity: 0.8;
  margin: 0;
`;

const HeroStats = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.xl};

  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    gap: ${props => props.theme.spacing.lg};
  }
`;

const HeroStat = styled.div`
  text-align: center;
`;

const HeroStatValue = styled.div`
  font-size: 2rem;
  font-weight: 800;
  line-height: 1;

  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    font-size: 1.5rem;
  }
`;

const HeroStatLabel = styled.div`
  font-size: 0.7rem;
  opacity: 0.7;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-top: 4px;
`;

const Section = styled.section`
  background: ${props => props.theme.colors.surface};
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: ${props => props.theme.spacing.lg};
  border: 1px solid ${props => props.theme.colors.border};

  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    padding: ${props => props.theme.spacing.md};
  }
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${props => props.theme.spacing.lg};
`;

const SectionTitle = styled.h2`
  font-size: 1rem;
  font-weight: 700;
  color: ${props => props.theme.colors.text};
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
`;

const SectionHint = styled.span`
  font-size: 0.75rem;
  color: ${props => props.theme.colors.textMuted};
  font-weight: 400;
`;

const SensorGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: ${props => props.theme.spacing.md};

  @media (max-width: ${props => props.theme.breakpoints.lg}) {
    grid-template-columns: repeat(3, 1fr);
  }

  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    grid-template-columns: repeat(2, 1fr);
    gap: ${props => props.theme.spacing.sm};
  }
`;

const ClimateGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: ${props => props.theme.spacing.sm};

  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const RelayGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: ${props => props.theme.spacing.md};

  @media (max-width: ${props => props.theme.breakpoints.lg}) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    grid-template-columns: 1fr;
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  color: ${props => props.theme.colors.textMuted};
`;

const LoadingSpinner = styled.div`
  width: 40px;
  height: 40px;
  border: 3px solid ${props => props.theme.colors.border};
  border-top-color: ${props => props.theme.colors.primary};
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: ${props => props.theme.spacing.md};

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const ErrorMessage = styled.div`
  background: ${props => props.theme.colors.dangerLight};
  color: ${props => props.theme.colors.danger};
  padding: ${props => props.theme.spacing.lg};
  border-radius: ${props => props.theme.borderRadius.lg};
  border: 1px solid ${props => props.theme.colors.danger}30;
  text-align: center;
`;

const HydroUnitDetail = () => {
  const { unitId } = useParams();
  const { joinUnit, leaveUnit } = useSocket();

  const [sensorData, setSensorData] = useState(null);
  const [relayData, setRelayData] = useState(null);
  const [scheduleData, setScheduleData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chartModal, setChartModal] = useState({ isOpen: false, sensorInfo: null });

  const handleSensorClick = (sensorInfo) => {
    setChartModal({
      isOpen: true,
      sensorInfo: { ...sensorInfo, unitId }
    });
  };

  const closeChartModal = () => {
    setChartModal({ isOpen: false, sensorInfo: null });
  };

  useEffect(() => {
    if (unitId) {
      joinUnit(unitId);
      return () => leaveUnit(unitId);
    }
  }, [unitId, joinUnit, leaveUnit]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [sensorsResponse, relaysResponse, scheduleResponse] = await Promise.all([
        hydroUnitsAPI.getSensors(unitId),
        hydroUnitsAPI.getRelays(unitId),
        hydroUnitsAPI.getSchedule(unitId)
      ]);

      setSensorData(sensorsResponse.data);
      setRelayData(relaysResponse.data);
      setScheduleData(scheduleResponse.data);
    } catch (err) {
      setError(apiUtils.handleError(err, `Failed to load data for ${unitId}`));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [unitId]);

  const handleRelayUpdate = async (relayType, newState) => {
    try {
      const updateData = { [relayType]: newState };
      const response = await hydroUnitsAPI.updateRelay(unitId, updateData);
      setRelayData(response.data);

      // Refresh schedule data to get updated control mode (manual)
      const scheduleResponse = await hydroUnitsAPI.getSchedule(unitId);
      setScheduleData(scheduleResponse.data);
    } catch (err) {
      console.error('Error updating relay:', err);
      throw new Error(apiUtils.handleError(err, 'Failed to update relay'));
    }
  };

  const handleTimeRangeUpdate = async (relayType, timeData) => {
    try {
      const scheduleUpdate = {
        ...scheduleData,
        [relayType]: timeData
      };
      const response = await hydroUnitsAPI.updateSchedule(unitId, scheduleUpdate);

      // Update with the response that includes the new control mode
      setScheduleData(response.data);
    } catch (err) {
      console.error('Error updating schedule:', err);
      throw new Error(apiUtils.handleError(err, 'Failed to update schedule'));
    }
  };

  const handlePumpCycleUpdate = async (pumpData) => {
    try {
      const scheduleUpdate = {
        ...scheduleData,
        pump_cycle: pumpData
      };
      const response = await hydroUnitsAPI.updateSchedule(unitId, scheduleUpdate);

      // Update with the response that includes the new control mode
      setScheduleData(response.data);
    } catch (err) {
      console.error('Error updating pump cycle:', err);
      throw new Error(apiUtils.handleError(err, 'Failed to update pump cycle'));
    }
  };

  const handleModeChange = async (relayType, newMode) => {
    try {
      const response = await hydroUnitsAPI.updateControlMode(unitId, relayType, newMode);
      // Update schedule data with the new control modes
      setScheduleData(prev => ({
        ...prev,
        control_modes: response.data.control_modes
      }));
    } catch (err) {
      console.error('Error changing control mode:', err);
      throw new Error(apiUtils.handleError(err, 'Failed to change control mode'));
    }
  };


  if (loading) {
    return (
      <LoadingContainer>
        <LoadingSpinner />
        Loading {unitId} data...
      </LoadingContainer>
    );
  }

  if (error) {
    return <ErrorMessage>{error}</ErrorMessage>;
  }

  const unitNames = {
    'DWC1': 'DWC System 1',
    'DWC2': 'DWC System 2',
    'DWC3': 'DWC System 3',
    'AERO': 'Aeroponic System',
    'TROUGH': 'Trough System'
  };

  return (
    <Container>
      {/* Hero Header */}
      <HeroHeader>
        <HeroContent>
          <HeroLeft>
            <HeroTitle>{unitNames[unitId] || unitId}</HeroTitle>
            <HeroSubtitle>Real-time sensor monitoring and control</HeroSubtitle>
          </HeroLeft>
          <HeroStats>
            <HeroStat>
              <HeroStatValue>{sensorData?.reservoir?.ph?.toFixed(1) || '--'}</HeroStatValue>
              <HeroStatLabel>pH Level</HeroStatLabel>
            </HeroStat>
            <HeroStat>
              <HeroStatValue>{sensorData?.reservoir?.water_level || '--'}%</HeroStatValue>
              <HeroStatLabel>Water Level</HeroStatLabel>
            </HeroStat>
            <HeroStat>
              <HeroStatValue>{sensorData?.reservoir?.tds || '--'}</HeroStatValue>
              <HeroStatLabel>TDS (ppm)</HeroStatLabel>
            </HeroStat>
          </HeroStats>
        </HeroContent>
      </HeroHeader>

      {/* Reservoir Sensors */}
      <Section>
        <SectionHeader>
          <SectionTitle>
            <span>🧪</span>
            Reservoir Sensors
          </SectionTitle>
          <SectionHint>Tap cards for charts</SectionHint>
        </SectionHeader>
        {sensorData?.reservoir && (
          <SensorGrid>
            <SensorCard
              title="pH Level"
              value={sensorData.reservoir.ph}
              unit=""
              timestamp={sensorData.timestamp}
              ranges={{
                warning: { min: 5.8, max: 7.2 },
                critical: { min: 5.0, max: 8.0 }
              }}
              icon="⚗️"
              sensorKey="ph"
              unitId={unitId}
              onClick={handleSensorClick}
            />
            <SensorCard
              title="TDS"
              value={sensorData.reservoir.tds}
              unit="ppm"
              timestamp={sensorData.timestamp}
              ranges={{
                warning: { min: 700, max: 1300 },
                critical: { min: 500, max: 1500 }
              }}
              icon="💎"
              sensorKey="tds"
              unitId={unitId}
              onClick={handleSensorClick}
            />
            <SensorCard
              title="Turbidity"
              value={sensorData.reservoir.turbidity}
              unit="NTU"
              timestamp={sensorData.timestamp}
              ranges={{
                warning: { min: 0, max: 15 },
                critical: { min: 0, max: 25 }
              }}
              icon="🌊"
              sensorKey="turbidity"
              unitId={unitId}
              onClick={handleSensorClick}
            />
            <SensorCard
              title="Water Temp"
              value={sensorData.reservoir.water_temp}
              unit="°C"
              timestamp={sensorData.timestamp}
              ranges={{
                warning: { min: 18, max: 26 },
                critical: { min: 15, max: 30 }
              }}
              icon="🌡️"
              sensorKey="water_temp"
              unitId={unitId}
              onClick={handleSensorClick}
            />
            <SensorCard
              title="Water Level"
              value={sensorData.reservoir.water_level}
              unit="%"
              timestamp={sensorData.timestamp}
              ranges={{
                warning: { min: 30, max: 100 },
                critical: { min: 20, max: 100 }
              }}
              icon="📊"
              sensorKey="water_level"
              unitId={unitId}
              onClick={handleSensorClick}
            />
          </SensorGrid>
        )}
      </Section>

      {/* Climate Sensors */}
      <Section>
        <SectionHeader>
          <SectionTitle>
            <span>🌡️</span>
            Climate Sensors
          </SectionTitle>
          <SectionHint>8 vertical levels</SectionHint>
        </SectionHeader>
        {sensorData?.climate && (
          <ClimateGrid>
            {Object.entries(sensorData.climate).map(([location, data]) => (
              <DHT22Card
                key={location}
                location={location}
                temperature={data.temp}
                humidity={data.humidity}
                timestamp={sensorData.timestamp}
                tempRanges={{
                  warning: { min: 20, max: 28 },
                  critical: { min: 15, max: 35 }
                }}
                humidityRanges={{
                  warning: { min: 50, max: 80 },
                  critical: { min: 30, max: 90 }
                }}
              />
            ))}
          </ClimateGrid>
        )}
      </Section>

      {/* Relay Controls */}
      <Section>
        <SectionHeader>
          <SectionTitle>
            <span>🎛️</span>
            Relay Controls
          </SectionTitle>
        </SectionHeader>
        {relayData?.relays && (
          <RelayGrid>
            <RelayControl
              label="Lights"
              icon="💡"
              relayType="lights"
              state={relayData.relays.lights}
              controlMode={scheduleData.control_modes?.lights || 'timer'}
              schedule={scheduleData.lights}
              onRelayToggle={(newState) => handleRelayUpdate('lights', newState)}
              onModeChange={(newMode) => handleModeChange('lights', newMode)}
              onScheduleUpdate={(timeData) => handleTimeRangeUpdate('lights', timeData)}
            />
            <RelayControl
              label="Fans"
              icon="🌀"
              relayType="fans"
              state={relayData.relays.fans}
              controlMode={scheduleData.control_modes?.fans || 'timer'}
              schedule={scheduleData.fans}
              onRelayToggle={(newState) => handleRelayUpdate('fans', newState)}
              onModeChange={(newMode) => handleModeChange('fans', newMode)}
              onScheduleUpdate={(timeData) => handleTimeRangeUpdate('fans', timeData)}
            />
            <PumpControl
              state={relayData.relays.pump}
              controlMode={scheduleData.control_modes?.pump || 'timer'}
              pumpCycle={scheduleData.pump_cycle}
              onRelayToggle={(newState) => handleRelayUpdate('pump', newState)}
              onModeChange={(newMode) => handleModeChange('pump', newMode)}
              onCycleUpdate={handlePumpCycleUpdate}
            />
          </RelayGrid>
        )}
      </Section>

      {/* Chart Modal */}
      <SensorChartModal
        isOpen={chartModal.isOpen}
        onClose={closeChartModal}
        sensorInfo={chartModal.sensorInfo}
      />
    </Container>
  );
};

export default HydroUnitDetail;