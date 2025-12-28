import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import api from '../services/api';

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

const SectionDescription = styled.p`
  color: ${props => props.theme.colors.textMuted};
  font-size: 0.85rem;
  margin-bottom: ${props => props.theme.spacing.md};
`;

const DangerZone = styled(Section)`
  border: 1px solid ${props => props.theme.colors.danger}30;
  background: ${props => props.theme.colors.danger}05;
`;

const DangerTitle = styled(SectionTitle)`
  color: ${props => props.theme.colors.danger};
`;

const Button = styled.button`
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  border: none;
  border-radius: ${props => props.theme.borderRadius.md};
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  transition: ${props => props.theme.transitions.fast};

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const PrimaryButton = styled(Button)`
  background: ${props => props.theme.colors.primary};
  color: white;
  &:hover:not(:disabled) { background: ${props => props.theme.colors.primaryHover}; }
`;

const DangerButton = styled(Button)`
  background: ${props => props.theme.colors.danger};
  color: white;
  &:hover:not(:disabled) { background: ${props => props.theme.colors.dangerHover}; }
`;

const RangesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: ${props => props.theme.spacing.md};
`;

const RangeCard = styled.div`
  background: ${props => props.theme.colors.background};
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.md};
  border: 1px solid ${props => props.theme.colors.border};
`;

const RangeTitle = styled.h3`
  font-size: 0.9rem;
  font-weight: 600;
  color: ${props => props.theme.colors.text};
  margin-bottom: ${props => props.theme.spacing.sm};
  display: flex;
  align-items: center;
  gap: 6px;
`;

const RangeRow = styled.div`
  display: grid;
  grid-template-columns: 80px 1fr 1fr;
  gap: ${props => props.theme.spacing.sm};
  align-items: center;
  margin-bottom: ${props => props.theme.spacing.xs};
`;

const RangeLabel = styled.span`
  font-size: 0.75rem;
  color: ${props => props.theme.colors.textMuted};
  text-transform: uppercase;
`;

const RangeInput = styled.input`
  padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.sm};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.sm};
  font-size: 0.85rem;
  background: ${props => props.theme.colors.surface};
  color: ${props => props.theme.colors.text};
  width: 100%;

  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary};
  }
`;

const StatusMessage = styled.div`
  padding: ${props => props.theme.spacing.sm};
  border-radius: ${props => props.theme.borderRadius.md};
  font-size: 0.85rem;
  margin-top: ${props => props.theme.spacing.sm};
  background: ${props => props.type === 'success'
    ? props.theme.colors.success + '15'
    : props.theme.colors.danger + '15'};
  color: ${props => props.type === 'success'
    ? props.theme.colors.success
    : props.theme.colors.danger};
  border: 1px solid ${props => props.type === 'success'
    ? props.theme.colors.success + '30'
    : props.theme.colors.danger + '30'};
`;

const ConfirmDialog = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const DialogBox = styled.div`
  background: ${props => props.theme.colors.surface};
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: ${props => props.theme.spacing.lg};
  max-width: 400px;
  box-shadow: ${props => props.theme.shadows.lg};
`;

const DialogTitle = styled.h3`
  font-size: 1.1rem;
  font-weight: 600;
  color: ${props => props.theme.colors.danger};
  margin-bottom: ${props => props.theme.spacing.sm};
`;

const DialogText = styled.p`
  color: ${props => props.theme.colors.textSecondary};
  font-size: 0.9rem;
  margin-bottom: ${props => props.theme.spacing.md};
`;

const DialogButtons = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.sm};
  justify-content: flex-end;
`;

const CancelButton = styled(Button)`
  background: ${props => props.theme.colors.background};
  color: ${props => props.theme.colors.text};
  border: 1px solid ${props => props.theme.colors.border};
  &:hover { background: ${props => props.theme.colors.surfaceHover}; }
`;

const defaultRanges = {
  ph: { warning: { min: 5.8, max: 7.2 }, critical: { min: 5.0, max: 8.0 } },
  tds: { warning: { min: 700, max: 1300 }, critical: { min: 500, max: 1500 } },
  water_temp: { warning: { min: 18, max: 26 }, critical: { min: 15, max: 30 } },
  water_level: { warning: { min: 30, max: 100 }, critical: { min: 20, max: 100 } },
  room_temp: { warning: { min: 18, max: 30 }, critical: { min: 15, max: 35 } },
  humidity: { warning: { min: 40, max: 80 }, critical: { min: 30, max: 90 } },
  co2: { warning: { min: 300, max: 1200 }, critical: { min: 250, max: 1500 } }
};

const rangeLabels = {
  ph: { icon: '⚗️', name: 'pH Level', unit: '' },
  tds: { icon: '💎', name: 'TDS', unit: 'ppm' },
  water_temp: { icon: '🌡️', name: 'Water Temp', unit: '°C' },
  water_level: { icon: '📊', name: 'Water Level', unit: '%' },
  room_temp: { icon: '🏠', name: 'Room Temp', unit: '°C' },
  humidity: { icon: '💧', name: 'Humidity', unit: '%' },
  co2: { icon: '🌿', name: 'CO2', unit: 'ppm' }
};

const Settings = () => {
  const [ranges, setRanges] = useState(defaultRanges);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [clearLoading, setClearLoading] = useState(false);

  useEffect(() => {
    fetchRanges();
  }, []);

  const fetchRanges = async () => {
    try {
      const response = await api.get('/settings/ranges');
      if (response.data.ranges) {
        setRanges({ ...defaultRanges, ...response.data.ranges });
      }
    } catch (error) {
      console.log('Using default ranges');
    }
  };

  const handleRangeChange = (sensor, type, field, value) => {
    setRanges(prev => ({
      ...prev,
      [sensor]: {
        ...prev[sensor],
        [type]: {
          ...prev[sensor][type],
          [field]: parseFloat(value) || 0
        }
      }
    }));
  };

  const handleSaveRanges = async () => {
    setLoading(true);
    setStatus(null);
    try {
      await api.post('/settings/ranges', { ranges });
      setStatus({ type: 'success', message: 'Safe ranges saved successfully!' });
    } catch (error) {
      setStatus({ type: 'error', message: 'Failed to save ranges.' });
    } finally {
      setLoading(false);
    }
  };

  const handleClearDatabase = async () => {
    setClearLoading(true);
    try {
      await api.post('/settings/clear-data');
      setShowConfirm(false);
      setStatus({ type: 'success', message: 'Database cleared successfully!' });
    } catch (error) {
      setStatus({ type: 'error', message: 'Failed to clear database.' });
    } finally {
      setClearLoading(false);
    }
  };

  return (
    <Container>
      <Section>
        <SectionTitle>⚙️ Safe Ranges Configuration</SectionTitle>
        <SectionDescription>
          Configure warning and critical thresholds for all sensors. Values outside these ranges will trigger alerts.
        </SectionDescription>

        <RangesGrid>
          {Object.entries(ranges).map(([sensor, range]) => (
            <RangeCard key={sensor}>
              <RangeTitle>
                {rangeLabels[sensor]?.icon} {rangeLabels[sensor]?.name}
                {rangeLabels[sensor]?.unit && ` (${rangeLabels[sensor].unit})`}
              </RangeTitle>

              <RangeRow>
                <RangeLabel>Warning</RangeLabel>
                <RangeInput
                  type="number"
                  step="0.1"
                  value={range.warning.min}
                  onChange={(e) => handleRangeChange(sensor, 'warning', 'min', e.target.value)}
                  placeholder="Min"
                />
                <RangeInput
                  type="number"
                  step="0.1"
                  value={range.warning.max}
                  onChange={(e) => handleRangeChange(sensor, 'warning', 'max', e.target.value)}
                  placeholder="Max"
                />
              </RangeRow>

              <RangeRow>
                <RangeLabel>Critical</RangeLabel>
                <RangeInput
                  type="number"
                  step="0.1"
                  value={range.critical.min}
                  onChange={(e) => handleRangeChange(sensor, 'critical', 'min', e.target.value)}
                  placeholder="Min"
                />
                <RangeInput
                  type="number"
                  step="0.1"
                  value={range.critical.max}
                  onChange={(e) => handleRangeChange(sensor, 'critical', 'max', e.target.value)}
                  placeholder="Max"
                />
              </RangeRow>
            </RangeCard>
          ))}
        </RangesGrid>

        <PrimaryButton onClick={handleSaveRanges} disabled={loading} style={{ marginTop: '16px' }}>
          {loading ? 'Saving...' : 'Save Ranges'}
        </PrimaryButton>

        {status && <StatusMessage type={status.type}>{status.message}</StatusMessage>}
      </Section>

      <DangerZone>
        <DangerTitle>⚠️ Danger Zone</DangerTitle>
        <SectionDescription>
          Clear all sensor readings and historical data from the database. This action cannot be undone.
        </SectionDescription>
        <DangerButton onClick={() => setShowConfirm(true)}>
          Clear Database
        </DangerButton>
      </DangerZone>

      {showConfirm && (
        <ConfirmDialog onClick={() => setShowConfirm(false)}>
          <DialogBox onClick={(e) => e.stopPropagation()}>
            <DialogTitle>⚠️ Clear Database?</DialogTitle>
            <DialogText>
              This will permanently delete all sensor readings, relay states, and historical data.
              Unit configurations and schedules will be preserved. This action cannot be undone.
            </DialogText>
            <DialogButtons>
              <CancelButton onClick={() => setShowConfirm(false)}>Cancel</CancelButton>
              <DangerButton onClick={handleClearDatabase} disabled={clearLoading}>
                {clearLoading ? 'Clearing...' : 'Yes, Clear Data'}
              </DangerButton>
            </DialogButtons>
          </DialogBox>
        </ConfirmDialog>
      )}
    </Container>
  );
};

export default Settings;
