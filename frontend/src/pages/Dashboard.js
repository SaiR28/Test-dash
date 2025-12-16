import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { useSocket } from '../contexts/SocketContext';
import axios from 'axios';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.lg};
`;

/* Header with live status */
const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: ${props => props.theme.colors.surface};
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: ${props => props.theme.spacing.lg};
  box-shadow: ${props => props.theme.shadows.md};
`;

const LiveBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  background: ${props => props.connected
    ? props.theme.colors.success + '15'
    : props.theme.colors.danger + '15'};
  padding: 10px 20px;
  border-radius: ${props => props.theme.borderRadius.full};
  border: 2px solid ${props => props.connected
    ? props.theme.colors.success
    : props.theme.colors.danger};
`;

const LiveDot = styled.span`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: ${props => props.connected
    ? props.theme.colors.success
    : props.theme.colors.danger};
  box-shadow: ${props => props.connected
    ? `0 0 10px ${props.theme.colors.success}`
    : 'none'};
  animation: ${props => props.connected ? 'pulse 2s infinite' : 'none'};

  @keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.7; transform: scale(0.9); }
  }
`;

const LiveText = styled.span`
  font-size: 1rem;
  font-weight: 700;
  color: ${props => props.connected
    ? props.theme.colors.success
    : props.theme.colors.danger};
`;

const RackCount = styled.div`
  text-align: right;
`;

const RackNumber = styled.div`
  font-size: 2.5rem;
  font-weight: 800;
  color: ${props => props.theme.colors.text};
  line-height: 1;
`;

const RackLabel = styled.div`
  font-size: 0.85rem;
  color: ${props => props.theme.colors.textMuted};
  font-weight: 500;
`;

/* Section styling */
const Section = styled.section`
  background: ${props => props.theme.colors.surface};
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: ${props => props.theme.spacing.lg};
  box-shadow: ${props => props.theme.shadows.md};
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${props => props.theme.spacing.md};
`;

const SectionTitle = styled.h2`
  font-size: 1.1rem;
  font-weight: 700;
  color: ${props => props.theme.colors.text};
  display: flex;
  align-items: center;
  gap: 8px;
`;

const SectionIcon = styled.span`
  font-size: 1.3rem;
`;

/* Hydro Units Grid */
const UnitsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: ${props => props.theme.spacing.md};
`;

const UnitCard = styled(Link)`
  background: linear-gradient(135deg,
    ${props => props.theme.colors.background} 0%,
    ${props => props.theme.colors.surface} 100%);
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: ${props => props.theme.spacing.md};
  text-decoration: none;
  border: 2px solid ${props => {
    if (props.status === 'critical') return props.theme.colors.danger;
    if (props.status === 'warning') return props.theme.colors.warning;
    return props.theme.colors.success + '50';
  }};
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 4px;
    height: 100%;
    background: ${props => {
      if (props.status === 'critical') return props.theme.colors.danger;
      if (props.status === 'warning') return props.theme.colors.warning;
      return props.theme.colors.success;
    }};
  }

  &:hover {
    transform: translateY(-4px);
    box-shadow: ${props => props.theme.shadows.lg};
    border-color: ${props => props.theme.colors.primary};
  }
`;

const UnitName = styled.div`
  font-size: 1.1rem;
  font-weight: 700;
  color: ${props => props.theme.colors.text};
  margin-bottom: ${props => props.theme.spacing.sm};
`;

const UnitStatus = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  padding: 3px 8px;
  border-radius: ${props => props.theme.borderRadius.full};
  margin-bottom: ${props => props.theme.spacing.sm};
  background: ${props => {
    if (props.status === 'critical') return props.theme.colors.danger + '20';
    if (props.status === 'warning') return props.theme.colors.warning + '20';
    return props.theme.colors.success + '20';
  }};
  color: ${props => {
    if (props.status === 'critical') return props.theme.colors.danger;
    if (props.status === 'warning') return props.theme.colors.warning;
    return props.theme.colors.success;
  }};
`;

const UnitMetrics = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.md};
`;

const UnitMetric = styled.div`
  display: flex;
  flex-direction: column;
`;

const MetricValue = styled.span`
  font-size: 1.25rem;
  font-weight: 700;
  color: ${props => props.theme.colors.text};
`;

const MetricLabel = styled.span`
  font-size: 0.65rem;
  color: ${props => props.theme.colors.textMuted};
  text-transform: uppercase;
  font-weight: 500;
`;

/* Room Cards */
const RoomGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: ${props => props.theme.spacing.md};
`;

const RoomCard = styled.div`
  background: linear-gradient(135deg,
    ${props => props.theme.colors.background} 0%,
    ${props => props.theme.colors.surface} 100%);
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: ${props => props.theme.spacing.md};
  border: 1px solid ${props => props.theme.colors.border};
`;

const RoomHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: ${props => props.theme.spacing.md};
  padding-bottom: ${props => props.theme.spacing.sm};
  border-bottom: 1px solid ${props => props.theme.colors.border};
`;

const RoomIcon = styled.span`
  font-size: 1.2rem;
`;

const RoomName = styled.span`
  font-size: 1rem;
  font-weight: 600;
  color: ${props => props.theme.colors.text};
`;

const RoomMetrics = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: ${props => props.theme.spacing.sm};
`;

const RoomMetric = styled.div`
  display: flex;
  flex-direction: column;
  padding: ${props => props.theme.spacing.sm};
  background: ${props => props.theme.colors.surface};
  border-radius: ${props => props.theme.borderRadius.md};
`;

const RoomMetricValue = styled.span`
  font-size: 1.5rem;
  font-weight: 700;
  color: ${props => props.theme.colors.text};
`;

const RoomMetricLabel = styled.span`
  font-size: 0.7rem;
  color: ${props => props.theme.colors.textMuted};
  text-transform: uppercase;
  font-weight: 500;
`;

const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  color: ${props => props.theme.colors.textMuted};
  font-size: 1rem;
`;

const hydroUnits = [
  { id: 'DWC1', name: 'DWC 1' },
  { id: 'DWC2', name: 'DWC 2' },
  { id: 'NFT', name: 'NFT' },
  { id: 'AERO', name: 'Aeroponic' },
  { id: 'TROUGH', name: 'Trough' }
];

function getUnitStatus(data) {
  if (!data?.reservoir) return 'offline';
  const { reservoir } = data;
  if (reservoir.ph < 5.5 || reservoir.ph > 7.5 || reservoir.water_level < 20) return 'critical';
  if (reservoir.ph < 6.0 || reservoir.ph > 7.0 || reservoir.water_level < 50) return 'warning';
  return 'normal';
}

const Dashboard = () => {
  const [hydroUnitsData, setHydroUnitsData] = useState({});
  const [roomData, setRoomData] = useState({ front: null, back: null });
  const [loading, setLoading] = useState(true);
  const { connected } = useSocket();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const hydroPromises = hydroUnits.map(async (unit) => {
          const response = await axios.get(`/units/${unit.id}/sensors`);
          return { unitId: unit.id, data: response.data };
        });

        const [hydroResults, frontResponse, backResponse] = await Promise.all([
          Promise.all(hydroPromises),
          axios.get('/room/front/sensors'),
          axios.get('/room/back/sensors')
        ]);

        const hydroData = {};
        hydroResults.forEach(({ unitId, data }) => {
          hydroData[unitId] = data;
        });
        setHydroUnitsData(hydroData);

        setRoomData({
          front: frontResponse.data,
          back: backResponse.data
        });

      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <LoadingContainer>Loading dashboard...</LoadingContainer>;
  }

  const unitsOnline = Object.keys(hydroUnitsData).length;

  return (
    <Container>
      {/* Header */}
      <Header>
        <LiveBadge connected={connected}>
          <LiveDot connected={connected} />
          <LiveText connected={connected}>
            {connected ? 'System Online' : 'Offline'}
          </LiveText>
        </LiveBadge>
        <RackCount>
          <RackNumber>{unitsOnline}/{hydroUnits.length}</RackNumber>
          <RackLabel>Racks Active</RackLabel>
        </RackCount>
      </Header>

      {/* Hydroponic Units */}
      <Section>
        <SectionHeader>
          <SectionTitle>
            <SectionIcon>🌱</SectionIcon>
            Hydroponic Units
          </SectionTitle>
        </SectionHeader>
        <UnitsGrid>
          {hydroUnits.map((unit) => {
            const data = hydroUnitsData[unit.id];
            const status = getUnitStatus(data);

            return (
              <UnitCard key={unit.id} to={`/hydro-units/${unit.id}`} status={status}>
                <UnitName>{unit.name}</UnitName>
                <UnitStatus status={status}>
                  {status === 'normal' ? '● Healthy' : status === 'warning' ? '● Warning' : '● Critical'}
                </UnitStatus>
                <UnitMetrics>
                  <UnitMetric>
                    <MetricValue>{data?.reservoir?.ph?.toFixed(1) || '-'}</MetricValue>
                    <MetricLabel>pH</MetricLabel>
                  </UnitMetric>
                  <UnitMetric>
                    <MetricValue>{data?.reservoir?.water_level || '-'}%</MetricValue>
                    <MetricLabel>Water</MetricLabel>
                  </UnitMetric>
                </UnitMetrics>
              </UnitCard>
            );
          })}
        </UnitsGrid>
      </Section>

      {/* Environment */}
      <Section>
        <SectionHeader>
          <SectionTitle>
            <SectionIcon>🌡️</SectionIcon>
            Environment
          </SectionTitle>
        </SectionHeader>
        <RoomGrid>
          {/* Front Room */}
          <RoomCard>
            <RoomHeader>
              <RoomIcon>🏠</RoomIcon>
              <RoomName>Front Room</RoomName>
            </RoomHeader>
            <RoomMetrics>
              <RoomMetric>
                <RoomMetricValue>{roomData.front?.bme?.temp?.toFixed(1) || '-'}°</RoomMetricValue>
                <RoomMetricLabel>Temperature</RoomMetricLabel>
              </RoomMetric>
              <RoomMetric>
                <RoomMetricValue>{roomData.front?.bme?.humidity?.toFixed(0) || '-'}%</RoomMetricValue>
                <RoomMetricLabel>Humidity</RoomMetricLabel>
              </RoomMetric>
              <RoomMetric>
                <RoomMetricValue>{roomData.front?.co2 || '-'}</RoomMetricValue>
                <RoomMetricLabel>CO2 (ppm)</RoomMetricLabel>
              </RoomMetric>
            </RoomMetrics>
          </RoomCard>

          {/* Back Room */}
          <RoomCard>
            <RoomHeader>
              <RoomIcon>🏢</RoomIcon>
              <RoomName>Back Room</RoomName>
            </RoomHeader>
            <RoomMetrics>
              <RoomMetric>
                <RoomMetricValue>{roomData.back?.bme?.temp?.toFixed(1) || '-'}°</RoomMetricValue>
                <RoomMetricLabel>Temperature</RoomMetricLabel>
              </RoomMetric>
              <RoomMetric>
                <RoomMetricValue>{roomData.back?.bme?.humidity?.toFixed(0) || '-'}%</RoomMetricValue>
                <RoomMetricLabel>Humidity</RoomMetricLabel>
              </RoomMetric>
              <RoomMetric>
                <RoomMetricValue>{roomData.back?.co2 || '-'}</RoomMetricValue>
                <RoomMetricLabel>CO2 (ppm)</RoomMetricLabel>
              </RoomMetric>
              <RoomMetric>
                <RoomMetricValue>{roomData.back?.ac?.current_set_temp || '-'}°</RoomMetricValue>
                <RoomMetricLabel>AC Set</RoomMetricLabel>
              </RoomMetric>
            </RoomMetrics>
          </RoomCard>
        </RoomGrid>
      </Section>
    </Container>
  );
};

export default Dashboard;
