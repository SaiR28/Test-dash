import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { hydroUnitsAPI } from '../services/api';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.md};
`;

const UnitsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
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

const UnitHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${props => props.theme.spacing.sm};
`;

const UnitIcon = styled.span`
  font-size: 1.5rem;
`;

const UnitName = styled.div`
  font-size: 1.1rem;
  font-weight: 700;
  color: ${props => props.theme.colors.text};
`;

const UnitType = styled.div`
  font-size: 0.75rem;
  color: ${props => props.theme.colors.textMuted};
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
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: ${props => props.theme.spacing.sm};
`;

const Metric = styled.div`
  display: flex;
  flex-direction: column;
`;

const MetricValue = styled.span`
  font-size: 1.1rem;
  font-weight: 700;
  color: ${props => props.theme.colors.text};
`;

const MetricLabel = styled.span`
  font-size: 0.65rem;
  color: ${props => props.theme.colors.textMuted};
  text-transform: uppercase;
  font-weight: 500;
`;

const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  color: ${props => props.theme.colors.textMuted};
`;

const hydroUnits = [
  { id: 'DWC1', name: 'DWC 1', type: 'Deep Water Culture', icon: '💧' },
  { id: 'DWC2', name: 'DWC 2', type: 'Deep Water Culture', icon: '💧' },
  { id: 'NFT', name: 'NFT', type: 'Nutrient Film Technique', icon: '🌊' },
  { id: 'AERO', name: 'Aeroponic', type: 'Aeroponic System', icon: '💨' },
  { id: 'TROUGH', name: 'Trough', type: 'Trough Based System', icon: '🔄' }
];

function getUnitStatus(data) {
  if (!data?.reservoir) return 'offline';
  const { reservoir } = data;
  if (reservoir.ph < 5.5 || reservoir.ph > 7.5 || reservoir.water_level < 20) return 'critical';
  if (reservoir.ph < 6.0 || reservoir.ph > 7.0 || reservoir.water_level < 50) return 'warning';
  return 'normal';
}

const HydroUnits = () => {
  const [unitsData, setUnitsData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const promises = hydroUnits.map(async (unit) => {
          const response = await hydroUnitsAPI.getSensors(unit.id);
          return { unitId: unit.id, data: response.data };
        });

        const results = await Promise.all(promises);
        const data = {};
        results.forEach(({ unitId, data: unitData }) => {
          data[unitId] = unitData;
        });
        setUnitsData(data);
      } catch (error) {
        console.error('Error fetching units data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <LoadingContainer>Loading units...</LoadingContainer>;
  }

  return (
    <Container>
      <UnitsGrid>
        {hydroUnits.map((unit) => {
          const data = unitsData[unit.id];
          const status = getUnitStatus(data);

          return (
            <UnitCard key={unit.id} to={`/hydro-units/${unit.id}`} status={status}>
              <UnitHeader>
                <UnitIcon>{unit.icon}</UnitIcon>
                <UnitStatus status={status}>
                  {status === 'normal' ? '● Healthy' : status === 'warning' ? '● Warning' : '● Critical'}
                </UnitStatus>
              </UnitHeader>
              <UnitName>{unit.name}</UnitName>
              <UnitType>{unit.type}</UnitType>
              <UnitMetrics>
                <Metric>
                  <MetricValue>{data?.reservoir?.ph?.toFixed(1) || '-'}</MetricValue>
                  <MetricLabel>pH</MetricLabel>
                </Metric>
                <Metric>
                  <MetricValue>{data?.reservoir?.tds || '-'}</MetricValue>
                  <MetricLabel>TDS</MetricLabel>
                </Metric>
                <Metric>
                  <MetricValue>{data?.reservoir?.water_temp?.toFixed(0) || '-'}°</MetricValue>
                  <MetricLabel>Temp</MetricLabel>
                </Metric>
                <Metric>
                  <MetricValue>{data?.reservoir?.water_level || '-'}%</MetricValue>
                  <MetricLabel>Level</MetricLabel>
                </Metric>
              </UnitMetrics>
            </UnitCard>
          );
        })}
      </UnitsGrid>
    </Container>
  );
};

export default HydroUnits;
