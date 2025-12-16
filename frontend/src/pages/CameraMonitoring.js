import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import CameraGrid from '../components/CameraGrid';
import axios from 'axios';

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

const StatusGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: ${props => props.theme.spacing.sm};
  margin-bottom: ${props => props.theme.spacing.md};
`;

const StatusCard = styled.div`
  background: ${props => props.theme.colors.background};
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.sm};
  text-align: center;
  border-left: 3px solid ${props => {
    if (props.type === 'online') return props.theme.colors.success;
    if (props.type === 'warning') return props.theme.colors.warning;
    if (props.type === 'offline') return props.theme.colors.danger;
    return props.theme.colors.border;
  }};
`;

const StatusNumber = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: ${props => {
    if (props.type === 'online') return props.theme.colors.success;
    if (props.type === 'warning') return props.theme.colors.warning;
    if (props.type === 'offline') return props.theme.colors.danger;
    return props.theme.colors.text;
  }};
`;

const StatusLabel = styled.div`
  font-size: 0.7rem;
  color: ${props => props.theme.colors.textMuted};
  text-transform: uppercase;
  font-weight: 500;
`;

const UnitSelector = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.sm};
  flex-wrap: wrap;
`;

const UnitButton = styled.button`
  background: ${props => props.active
    ? props.theme.colors.primary
    : props.theme.colors.background};
  color: ${props => props.active
    ? 'white'
    : props.theme.colors.text};
  border: 1px solid ${props => props.active
    ? props.theme.colors.primary
    : props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  transition: ${props => props.theme.transitions.fast};

  &:hover {
    border-color: ${props => props.theme.colors.primary};
    background: ${props => props.active
      ? props.theme.colors.primary
      : props.theme.colors.surfaceHover};
  }
`;

const NoUnitSelected = styled.div`
  text-align: center;
  padding: ${props => props.theme.spacing.lg};
  color: ${props => props.theme.colors.textMuted};
  font-size: 0.9rem;
`;

const HYDRO_UNITS = ['DWC1', 'DWC2', 'NFT', 'AERO', 'TROUGH'];

const CameraMonitoring = () => {
  const [selectedUnit, setSelectedUnit] = useState('');
  const [overallStatus, setOverallStatus] = useState({
    online: 0,
    warning: 0,
    offline: 0,
    total: 0
  });

  useEffect(() => {
    fetchOverallStatus();
    const interval = setInterval(fetchOverallStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchOverallStatus = async () => {
    try {
      const response = await axios.get('/cameras/status');
      const data = response.data;

      let online = 0, warning = 0, offline = 0, total = 0;

      Object.values(data.units || {}).forEach(cameras => {
        cameras.forEach(camera => {
          total++;
          if (camera.status === 'online') online++;
          else if (camera.status === 'warning') warning++;
          else offline++;
        });
      });

      setOverallStatus({ online, warning, offline, total });
    } catch (error) {
      console.error('Error fetching camera status:', error);
    }
  };

  return (
    <Container>
      <Section>
        <SectionTitle>📊 Camera Status</SectionTitle>
        <StatusGrid>
          <StatusCard type="online">
            <StatusNumber type="online">{overallStatus.online}</StatusNumber>
            <StatusLabel>Online</StatusLabel>
          </StatusCard>
          <StatusCard type="warning">
            <StatusNumber type="warning">{overallStatus.warning}</StatusNumber>
            <StatusLabel>Warning</StatusLabel>
          </StatusCard>
          <StatusCard type="offline">
            <StatusNumber type="offline">{overallStatus.offline}</StatusNumber>
            <StatusLabel>Offline</StatusLabel>
          </StatusCard>
          <StatusCard>
            <StatusNumber>{overallStatus.total}</StatusNumber>
            <StatusLabel>Total</StatusLabel>
          </StatusCard>
        </StatusGrid>

        <SectionTitle>🎛️ Select Unit</SectionTitle>
        <UnitSelector>
          {HYDRO_UNITS.map(unit => (
            <UnitButton
              key={unit}
              active={selectedUnit === unit}
              onClick={() => setSelectedUnit(unit)}
            >
              {unit}
            </UnitButton>
          ))}
        </UnitSelector>
      </Section>

      <Section>
        <SectionTitle>📷 Camera Feeds</SectionTitle>
        {selectedUnit ? (
          <CameraGrid unitId={selectedUnit} />
        ) : (
          <NoUnitSelected>
            Select a hydroponic unit above to view its cameras
          </NoUnitSelected>
        )}
      </Section>
    </Container>
  );
};

export default CameraMonitoring;
