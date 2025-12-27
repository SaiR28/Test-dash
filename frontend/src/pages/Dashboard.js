import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { useSocket } from '../contexts/SocketContext';
import CircularProgress from '../components/CircularProgress';
import axios from 'axios';

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
`;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.lg};
`;

/* Hero Stats Section */
const HeroSection = styled.div`
  background: ${props => props.theme.colors.primaryGradient};
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: ${props => props.theme.spacing.lg};
  color: white;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: -50%;
    right: -20%;
    width: 300px;
    height: 300px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 50%;
  }

  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    padding: ${props => props.theme.spacing.md};
  }
`;

const HeroContent = styled.div`
  position: relative;
  z-index: 1;
`;

const HeroTitle = styled.h1`
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0;
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};

  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    font-size: 1.1rem;
  }
`;

const HeroSubtitle = styled.p`
  font-size: 0.8rem;
  opacity: 0.7;
  margin: 4px 0 0 0;
`;

const StatusBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.2);
  padding: 4px 12px;
  border-radius: ${props => props.theme.borderRadius.full};
  font-size: 0.75rem;
  font-weight: 600;
`;

const StatusDot = styled.span`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${props => props.online ? '#4ade80' : '#f87171'};
  animation: ${props => props.online ? pulse : 'none'} 2s ease-in-out infinite;
`;

const StatsGrid = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.xl};
  margin-top: ${props => props.theme.spacing.md};

  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    gap: ${props => props.theme.spacing.lg};
  }
`;

const HeroStat = styled.div`
  text-align: center;
`;

const HeroStatValue = styled.div`
  font-size: 1.75rem;
  font-weight: 800;
  line-height: 1;

  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    font-size: 1.5rem;
  }
`;

const HeroStatLabel = styled.div`
  font-size: 0.65rem;
  opacity: 0.6;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-top: 2px;
`;

/* Quick Stats Cards */
const QuickStatsRow = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: ${props => props.theme.spacing.md};

  @media (max-width: ${props => props.theme.breakpoints.md}) {
    grid-template-columns: 1fr;
  }
`;

const QuickStatCard = styled.div`
  background: ${props => props.theme.colors.surface};
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: ${props => props.theme.spacing.lg};
  border: 1px solid ${props => props.theme.colors.border};
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.lg};
  transition: ${props => props.theme.transitions.fast};

  &:hover {
    box-shadow: ${props => props.theme.shadows.md};
    border-color: ${props => props.theme.colors.primary}30;
  }
`;

const QuickStatInfo = styled.div`
  flex: 1;
`;

const QuickStatLabel = styled.div`
  font-size: 0.75rem;
  color: ${props => props.theme.colors.textMuted};
  text-transform: uppercase;
  font-weight: 600;
  letter-spacing: 0.03em;
  margin-bottom: 4px;
`;

const QuickStatValue = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: ${props => props.theme.colors.text};
`;

const QuickStatTrend = styled.span`
  font-size: 0.8rem;
  color: ${props => props.positive ? props.theme.colors.success : props.theme.colors.danger};
  font-weight: 600;
  margin-left: 8px;
`;

/* Section styling */
const Section = styled.section`
  background: ${props => props.theme.colors.surface};
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: ${props => props.theme.spacing.lg};
  border: 1px solid ${props => props.theme.colors.border};
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

const ViewAllLink = styled(Link)`
  font-size: 0.8rem;
  color: ${props => props.theme.colors.primary};
  text-decoration: none;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 4px;

  &:hover {
    text-decoration: underline;
  }
`;

/* Hydro Units Grid */
const UnitsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: ${props => props.theme.spacing.sm};

  @media (max-width: ${props => props.theme.breakpoints.xl}) {
    grid-template-columns: repeat(3, 1fr);
  }

  @media (max-width: ${props => props.theme.breakpoints.md}) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const UnitCard = styled(Link)`
  background: ${props => props.theme.colors.background};
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.md};
  text-decoration: none;
  border: 1px solid ${props => props.theme.colors.border};
  transition: ${props => props.theme.transitions.fast};
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: ${props => {
      if (props.status === 'critical') return props.theme.colors.danger;
      if (props.status === 'warning') return props.theme.colors.warning;
      if (props.status === 'offline') return props.theme.colors.offline;
      return props.theme.colors.success;
    }};
  }

  &:hover {
    border-color: ${props => props.theme.colors.primary}40;
    box-shadow: ${props => props.theme.shadows.md};
  }
`;

const UnitHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${props => props.theme.spacing.sm};
`;

const UnitName = styled.div`
  font-size: 0.9rem;
  font-weight: 700;
  color: ${props => props.theme.colors.text};
`;

const UnitStatusBadge = styled.span`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${props => {
    if (props.status === 'critical') return props.theme.colors.danger;
    if (props.status === 'warning') return props.theme.colors.warning;
    if (props.status === 'offline') return props.theme.colors.offline;
    return props.theme.colors.success;
  }};
`;

const UnitMetrics = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: ${props => props.theme.spacing.xs};
`;

const UnitMetric = styled.div`
  display: flex;
  align-items: baseline;
  gap: 3px;
`;

const MetricValue = styled.span`
  font-size: 1rem;
  font-weight: 700;
  color: ${props => props.theme.colors.text};
`;

const MetricLabel = styled.span`
  font-size: 0.6rem;
  color: ${props => props.theme.colors.textMuted};
  text-transform: uppercase;
`;

const MetricUnit = styled.span`
  font-size: 0.65rem;
  color: ${props => props.theme.colors.textMuted};
  font-weight: 500;
  margin-left: 1px;
`;

const UnitTimestamp = styled.div`
  font-size: 0.6rem;
  color: ${props => props.theme.colors.textMuted};
  margin-top: ${props => props.theme.spacing.xs};
  padding-top: ${props => props.theme.spacing.xs};
  border-top: 1px solid ${props => props.theme.colors.border};
`;

/* Environment Cards */
const EnvGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: ${props => props.theme.spacing.sm};

  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    grid-template-columns: 1fr;
  }
`;

const EnvCard = styled.div`
  background: ${props => props.theme.colors.background};
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.md};
  border: 1px solid ${props => props.theme.colors.border};
`;

const EnvHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  margin-bottom: ${props => props.theme.spacing.sm};
`;

const EnvIcon = styled.span`
  font-size: 1rem;
`;

const EnvName = styled.span`
  font-size: 0.85rem;
  font-weight: 600;
  color: ${props => props.theme.colors.text};
`;

const EnvMetrics = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${props => props.theme.spacing.md};
`;

const EnvMetric = styled.div`
  display: flex;
  align-items: baseline;
  gap: 3px;
`;

const EnvValue = styled.span`
  font-size: 1.25rem;
  font-weight: 700;
  color: ${props => props.theme.colors.text};
`;

const EnvUnit = styled.span`
  font-size: 0.6rem;
  color: ${props => props.theme.colors.textMuted};
  text-transform: uppercase;
`;

const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  color: ${props => props.theme.colors.textMuted};
`;

const hydroUnits = [
  { id: 'DWC1', name: 'DWC 1' },
  { id: 'DWC2', name: 'DWC 2' },
  { id: 'DWC3', name: 'DWC 3' },
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

function formatTimestampAge(timestamp) {
  if (!timestamp) return 'No data';
  const now = Math.floor(Date.now() / 1000);
  const diff = now - timestamp;
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
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

  // Calculate averages from all units
  const phValues = hydroUnits
    .map(u => hydroUnitsData[u.id]?.reservoir?.ph)
    .filter(ph => ph !== undefined && ph !== null);
  const avgPh = phValues.length > 0
    ? (phValues.reduce((a, b) => a + b, 0) / phValues.length).toFixed(1)
    : '--';

  const tdsValues = hydroUnits
    .map(u => hydroUnitsData[u.id]?.reservoir?.tds)
    .filter(tds => tds !== undefined && tds !== null);
  const avgTds = tdsValues.length > 0
    ? Math.round(tdsValues.reduce((a, b) => a + b, 0) / tdsValues.length)
    : '--';

  const waterLevels = hydroUnits
    .map(u => hydroUnitsData[u.id]?.reservoir?.water_level)
    .filter(wl => wl !== undefined && wl !== null);
  const avgWaterLevel = waterLevels.length > 0
    ? Math.round(waterLevels.reduce((a, b) => a + b, 0) / waterLevels.length)
    : 0;

  // Room averages
  const temps = [roomData.front?.bme?.temp, roomData.back?.bme?.temp].filter(t => t !== undefined && t !== null);
  const avgTemp = temps.length > 0
    ? (temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(1)
    : '--';

  const humidities = [roomData.front?.bme?.humidity, roomData.back?.bme?.humidity].filter(h => h !== undefined && h !== null);
  const avgHumidity = humidities.length > 0
    ? Math.round(humidities.reduce((a, b) => a + b, 0) / humidities.length)
    : '--';

  return (
    <Container>
      {/* Hero Section */}
      <HeroSection>
        <HeroContent>
          <HeroTitle>
            NeuralKissan Farm
            <StatusBadge>
              <StatusDot online={connected} />
              {connected ? 'Online' : 'Offline'}
            </StatusBadge>
          </HeroTitle>
          <HeroSubtitle>Real-time monitoring of your hydroponic systems</HeroSubtitle>

          <StatsGrid>
            <HeroStat>
              <HeroStatValue>{avgTemp}°</HeroStatValue>
              <HeroStatLabel>Avg Temp</HeroStatLabel>
            </HeroStat>
            <HeroStat>
              <HeroStatValue>{avgHumidity}%</HeroStatValue>
              <HeroStatLabel>Avg Humidity</HeroStatLabel>
            </HeroStat>
            <HeroStat>
              <HeroStatValue>{avgPh}</HeroStatValue>
              <HeroStatLabel>Avg pH</HeroStatLabel>
            </HeroStat>
            <HeroStat>
              <HeroStatValue>{avgTds}</HeroStatValue>
              <HeroStatLabel>Avg TDS</HeroStatLabel>
            </HeroStat>
          </StatsGrid>
        </HeroContent>
      </HeroSection>

      {/* Quick Stats with Circular Progress */}
      <QuickStatsRow>
        <QuickStatCard>
          <CircularProgress
            value={avgWaterLevel}
            max={100}
            size={70}
            strokeWidth={6}
            color="#4895EF"
            displayValue={`${avgWaterLevel}%`}
            fontSize="1rem"
          />
          <QuickStatInfo>
            <QuickStatLabel>Water Level</QuickStatLabel>
            <QuickStatValue>
              {avgWaterLevel}%
              {avgWaterLevel >= 50 && <QuickStatTrend positive>Good</QuickStatTrend>}
              {avgWaterLevel < 50 && avgWaterLevel >= 30 && <QuickStatTrend>Low</QuickStatTrend>}
              {avgWaterLevel < 30 && <QuickStatTrend>Critical</QuickStatTrend>}
            </QuickStatValue>
          </QuickStatInfo>
        </QuickStatCard>

        <QuickStatCard>
          <CircularProgress
            value={parseFloat(avgPh) || 0}
            max={14}
            size={70}
            strokeWidth={6}
            color="#40916C"
            displayValue={avgPh}
            fontSize="1rem"
          />
          <QuickStatInfo>
            <QuickStatLabel>pH Level</QuickStatLabel>
            <QuickStatValue>
              {avgPh}
              {avgPh !== '--' && parseFloat(avgPh) >= 5.8 && parseFloat(avgPh) <= 7.0 && <QuickStatTrend positive>Optimal</QuickStatTrend>}
            </QuickStatValue>
          </QuickStatInfo>
        </QuickStatCard>

        <QuickStatCard>
          <CircularProgress
            value={avgTds !== '--' ? Math.min(avgTds / 15, 100) : 0}
            max={100}
            size={70}
            strokeWidth={6}
            color="#7209B7"
            displayValue={avgTds}
            fontSize="1rem"
          />
          <QuickStatInfo>
            <QuickStatLabel>TDS (ppm)</QuickStatLabel>
            <QuickStatValue>
              {avgTds}
              {avgTds !== '--' && avgTds >= 700 && avgTds <= 1200 && <QuickStatTrend positive>Optimal</QuickStatTrend>}
            </QuickStatValue>
          </QuickStatInfo>
        </QuickStatCard>
      </QuickStatsRow>

      {/* Hydroponic Units */}
      <Section>
        <SectionHeader>
          <SectionTitle>
            <span>🧪</span>
            Hydroponic Units
          </SectionTitle>
          <ViewAllLink to="/hydro-units">
            View All →
          </ViewAllLink>
        </SectionHeader>
        <UnitsGrid>
          {hydroUnits.map((unit) => {
            const data = hydroUnitsData[unit.id];
            const status = getUnitStatus(data);

            return (
              <UnitCard key={unit.id} to={`/hydro-units/${unit.id}`} status={status}>
                <UnitHeader>
                  <UnitName>{unit.name}</UnitName>
                  <UnitStatusBadge status={status} />
                </UnitHeader>
                <UnitMetrics>
                  <UnitMetric>
                    <MetricValue>{data?.reservoir?.ph?.toFixed(1) || '--'}</MetricValue>
                    <MetricLabel>pH</MetricLabel>
                  </UnitMetric>
                  <UnitMetric>
                    <MetricValue>{data?.reservoir?.tds || '--'}</MetricValue>
                    <MetricLabel>TDS</MetricLabel>
                  </UnitMetric>
                  <UnitMetric>
                    <MetricValue>{data?.reservoir?.water_temp?.toFixed(1) || '--'}°</MetricValue>
                    <MetricLabel>Temp</MetricLabel>
                  </UnitMetric>
                  <UnitMetric>
                    <MetricValue>{data?.reservoir?.water_level || '--'}%</MetricValue>
                    <MetricLabel>H2O</MetricLabel>
                  </UnitMetric>
                </UnitMetrics>
                <UnitTimestamp>{formatTimestampAge(data?.timestamp)}</UnitTimestamp>
              </UnitCard>
            );
          })}
        </UnitsGrid>
      </Section>

      {/* Environment */}
      <Section>
        <SectionHeader>
          <SectionTitle>
            <span>🌤️</span>
            Environment
          </SectionTitle>
        </SectionHeader>
        <EnvGrid>
          <EnvCard>
            <EnvHeader>
              <EnvIcon>🌡️</EnvIcon>
              <EnvName>Front Room</EnvName>
            </EnvHeader>
            <EnvMetrics>
              <EnvMetric>
                <EnvValue>{roomData.front?.bme?.temp?.toFixed(1) || '--'}°</EnvValue>
                <EnvUnit>temp</EnvUnit>
              </EnvMetric>
              <EnvMetric>
                <EnvValue>{roomData.front?.bme?.humidity?.toFixed(0) || '--'}%</EnvValue>
                <EnvUnit>humidity</EnvUnit>
              </EnvMetric>
              <EnvMetric>
                <EnvValue>{roomData.front?.co2 || '--'}</EnvValue>
                <EnvUnit>co2</EnvUnit>
              </EnvMetric>
            </EnvMetrics>
          </EnvCard>

          <EnvCard>
            <EnvHeader>
              <EnvIcon>❄️</EnvIcon>
              <EnvName>Back Room</EnvName>
            </EnvHeader>
            <EnvMetrics>
              <EnvMetric>
                <EnvValue>{roomData.back?.bme?.temp?.toFixed(1) || '--'}°</EnvValue>
                <EnvUnit>temp</EnvUnit>
              </EnvMetric>
              <EnvMetric>
                <EnvValue>{roomData.back?.bme?.humidity?.toFixed(0) || '--'}%</EnvValue>
                <EnvUnit>humidity</EnvUnit>
              </EnvMetric>
              <EnvMetric>
                <EnvValue>{roomData.back?.co2 || '--'}</EnvValue>
                <EnvUnit>co2</EnvUnit>
              </EnvMetric>
              <EnvMetric>
                <EnvValue>{roomData.back?.ac?.current_set_temp ?? 18}°</EnvValue>
                <EnvUnit>ac set</EnvUnit>
              </EnvMetric>
            </EnvMetrics>
          </EnvCard>
        </EnvGrid>
      </Section>
    </Container>
  );
};

export default Dashboard;
