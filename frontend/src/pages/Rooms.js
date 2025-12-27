import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import SensorCard from '../components/SensorCard';
import { roomAPI, apiUtils } from '../services/api';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.lg};
`;

/* Comparison Banner */
const ComparisonBanner = styled.div`
  background: ${props => props.theme.colors.primaryGradient};
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: ${props => props.theme.spacing.lg};
  color: white;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: ${props => props.theme.spacing.lg};

  @media (max-width: ${props => props.theme.breakpoints.md}) {
    grid-template-columns: 1fr;
    text-align: center;
  }
`;

const RoomTemp = styled.div`
  display: flex;
  flex-direction: column;
  align-items: ${props => props.align || 'flex-start'};

  @media (max-width: ${props => props.theme.breakpoints.md}) {
    align-items: center;
  }
`;

const RoomLabel = styled.span`
  font-size: 0.8rem;
  opacity: 0.8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const TempValue = styled.span`
  font-size: 2.5rem;
  font-weight: 800;
  line-height: 1;
`;

const TempUnit = styled.span`
  font-size: 1rem;
  opacity: 0.7;
`;

const DiffBox = styled.div`
  background: rgba(255,255,255,0.15);
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.lg};
  text-align: center;
`;

const DiffLabel = styled.div`
  font-size: 0.7rem;
  opacity: 0.8;
  text-transform: uppercase;
  margin-bottom: 4px;
`;

const DiffValue = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: ${props => props.value > 0 ? '#fbbf24' : props.value < 0 ? '#60a5fa' : 'white'};
`;

const RoomsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: ${props => props.theme.spacing.lg};

  @media (max-width: ${props => props.theme.breakpoints.lg}) {
    grid-template-columns: 1fr;
  }
`;

const RoomCard = styled.section`
  background: ${props => props.theme.colors.surface};
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: ${props => props.theme.spacing.lg};
  border: 1px solid ${props => props.theme.colors.border};
`;

const RoomHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  margin-bottom: ${props => props.theme.spacing.md};
`;

const RoomIcon = styled.span`
  font-size: 1.5rem;
`;

const RoomTitle = styled.h2`
  font-size: 1.1rem;
  font-weight: 700;
  color: ${props => props.theme.colors.text};
  margin: 0;
`;

const SensorGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: ${props => props.theme.spacing.sm};
`;

const Section = styled.section`
  background: ${props => props.theme.colors.surface};
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: ${props => props.theme.spacing.lg};
  border: 1px solid ${props => props.theme.colors.border};
`;

const SectionTitle = styled.h2`
  font-size: 1rem;
  font-weight: 700;
  color: ${props => props.theme.colors.text};
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  margin: 0 0 ${props => props.theme.spacing.md} 0;
`;

/* AC Schedule Styles */
const ScheduleContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.md};
`;

const GraphContainer = styled.div`
  background: ${props => props.theme.colors.background};
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.md};
  border: 1px solid ${props => props.theme.colors.border};
`;

const GraphWrapper = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.sm};
`;

const YAxis = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 8px 0;
  min-width: 35px;
`;

const YLabel = styled.span`
  font-size: 0.7rem;
  color: ${props => props.theme.colors.textMuted};
  text-align: right;
`;

const GraphArea = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const BarsContainer = styled.div`
  display: flex;
  align-items: flex-end;
  height: 200px;
  gap: 2px;
  padding: 8px 0;
  border-bottom: 2px solid ${props => props.theme.colors.border};
  position: relative;

  &::before {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    bottom: 50%;
    border-top: 1px dashed ${props => props.theme.colors.border};
  }
`;

const BarWrapper = styled.div`
  flex: 1;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  cursor: pointer;
  position: relative;

  &:hover > div:first-child {
    opacity: 1;
  }
`;

const TempTooltip = styled.div`
  position: absolute;
  top: -24px;
  background: ${props => props.theme.colors.text};
  color: ${props => props.theme.colors.surface};
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 600;
  opacity: 0;
  transition: opacity 0.15s;
  white-space: nowrap;
  z-index: 10;
`;

const Bar = styled.div`
  width: 80%;
  border-radius: 3px 3px 0 0;
  transition: height 0.15s ease, background 0.15s ease;
  min-height: 4px;
  background: ${props => {
    const temp = props.temp;
    if (temp <= 16) return '#3b82f6';
    if (temp <= 18) return '#06b6d4';
    if (temp <= 20) return '#10b981';
    if (temp <= 22) return '#84cc16';
    if (temp <= 24) return '#eab308';
    if (temp <= 26) return '#f97316';
    return '#ef4444';
  }};
  height: ${props => ((props.temp - 14) / 16) * 100}%;

  &:hover {
    filter: brightness(1.1);
    width: 90%;
  }
`;

const XAxis = styled.div`
  display: flex;
  gap: 2px;
  padding-top: 8px;
`;

const XLabel = styled.span`
  flex: 1;
  text-align: center;
  font-size: 0.6rem;
  font-weight: 500;
  color: ${props => props.theme.colors.textMuted};
`;

const GraphLegend = styled.div`
  display: flex;
  justify-content: center;
  gap: ${props => props.theme.spacing.md};
  margin-top: ${props => props.theme.spacing.sm};
  flex-wrap: wrap;
`;

const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.7rem;
  color: ${props => props.theme.colors.textMuted};
`;

const LegendColor = styled.div`
  width: 12px;
  height: 12px;
  border-radius: 2px;
  background: ${props => props.color};
`;

/* Editable Table */
const EditTable = styled.div`
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 4px;
  margin-top: ${props => props.theme.spacing.md};

  @media (max-width: ${props => props.theme.breakpoints.lg}) {
    grid-template-columns: repeat(6, 1fr);
  }

  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    grid-template-columns: repeat(4, 1fr);
  }
`;

const EditCell = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 6px;
  background: ${props => props.theme.colors.surface};
  border-radius: ${props => props.theme.borderRadius.sm};
  border: 1px solid ${props => props.theme.colors.border};
`;

const CellHour = styled.span`
  font-size: 0.7rem;
  font-weight: 600;
  color: ${props => props.theme.colors.textMuted};
  margin-bottom: 4px;
`;

const TempInput = styled.input`
  width: 45px;
  padding: 4px;
  text-align: center;
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 4px;
  font-size: 0.85rem;
  font-weight: 600;
  background: ${props => {
    const temp = props.temp;
    if (temp <= 16) return '#3b82f620';
    if (temp <= 18) return '#06b6d420';
    if (temp <= 20) return '#10b98120';
    if (temp <= 22) return '#84cc1620';
    if (temp <= 24) return '#eab30820';
    return '#f9731620';
  }};
  color: ${props => props.theme.colors.text};

  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary};
  }

  &::-webkit-inner-spin-button,
  &::-webkit-outer-spin-button {
    opacity: 1;
  }
`;

const QuickSetRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  flex-wrap: wrap;
  padding: ${props => props.theme.spacing.md};
  background: ${props => props.theme.colors.background};
  border-radius: ${props => props.theme.borderRadius.md};
`;

const QuickSetLabel = styled.span`
  font-size: 0.85rem;
  font-weight: 600;
  color: ${props => props.theme.colors.textMuted};
`;

const QuickSetButton = styled.button`
  padding: 8px 16px;
  border-radius: ${props => props.theme.borderRadius.md};
  border: 1px solid ${props => props.theme.colors.border};
  background: ${props => props.theme.colors.surface};
  color: ${props => props.theme.colors.text};
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: ${props => props.theme.transitions.fast};

  &:hover {
    background: ${props => props.theme.colors.primary};
    border-color: ${props => props.theme.colors.primary};
    color: white;
  }
`;

const SaveRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.md};
  padding-top: ${props => props.theme.spacing.md};
  border-top: 1px solid ${props => props.theme.colors.border};
`;

const SaveButton = styled.button`
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.xl};
  background: ${props => props.theme.colors.success};
  color: white;
  border: none;
  border-radius: ${props => props.theme.borderRadius.md};
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: ${props => props.theme.transitions.fast};

  &:hover {
    opacity: 0.9;
  }

  &:disabled {
    background: ${props => props.theme.colors.textMuted};
    cursor: not-allowed;
  }
`;

const StatusMessage = styled.span`
  font-size: 0.85rem;
  color: ${props => props.type === 'success' ? props.theme.colors.success : props.theme.colors.danger};
  font-weight: 500;
`;

const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  color: ${props => props.theme.colors.textMuted};
`;

const Rooms = () => {
  const [frontData, setFrontData] = useState(null);
  const [backData, setBackData] = useState(null);
  const [acSchedule, setAcSchedule] = useState({});
  const [localSchedule, setLocalSchedule] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [frontResponse, backResponse, scheduleResponse] = await Promise.all([
        roomAPI.getFrontSensors(),
        roomAPI.getBackSensors(),
        roomAPI.getACSchedule()
      ]);

      setFrontData(frontResponse.data);
      setBackData(backResponse.data);
      const schedule = scheduleResponse.data.ac_schedule || {};
      setAcSchedule(schedule);
      setLocalSchedule(schedule);
    } catch (err) {
      console.error('Failed to load room data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // No auto-refresh to avoid interrupting AC schedule editing
  }, []);

  const handleBarInteraction = (hour, e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const height = rect.height;
    const percentage = 1 - (y / height);
    const temp = Math.round(14 + (percentage * 16));
    const clampedTemp = Math.max(16, Math.min(30, temp));
    setLocalSchedule(prev => ({ ...prev, [hour]: clampedTemp }));
  };

  const handleMouseDown = (hour, e) => {
    setIsDragging(true);
    handleBarInteraction(hour, e);
  };

  const handleMouseMove = (hour, e) => {
    if (isDragging) {
      handleBarInteraction(hour, e);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, []);

  const setAllHoursTo = (temp) => {
    const newSchedule = {};
    for (let i = 0; i < 24; i++) {
      newSchedule[i.toString().padStart(2, '0')] = temp;
    }
    setLocalSchedule(newSchedule);
  };

  const handleTempInputChange = (hour, value) => {
    const temp = parseInt(value) || 18;
    const clampedTemp = Math.max(16, Math.min(30, temp));
    setLocalSchedule(prev => ({ ...prev, [hour]: clampedTemp }));
  };

  const handleSaveSchedule = async () => {
    try {
      setSaving(true);
      await roomAPI.updateACSchedule({ ac_schedule: localSchedule });
      setAcSchedule(localSchedule);
      setStatus({ type: 'success', message: 'Schedule saved!' });
      setTimeout(() => setStatus(null), 3000);
    } catch (err) {
      setStatus({ type: 'error', message: apiUtils.handleError(err, 'Failed to save') });
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = JSON.stringify(acSchedule) !== JSON.stringify(localSchedule);

  if (loading) {
    return <LoadingContainer>Loading room data...</LoadingContainer>;
  }

  const frontTemp = frontData?.bme?.temp;
  const backTemp = backData?.bme?.temp;
  const tempDiff = frontTemp && backTemp ? (frontTemp - backTemp).toFixed(1) : null;

  return (
    <Container>
      {/* Temperature Comparison Banner */}
      <ComparisonBanner>
        <RoomTemp align="flex-start">
          <RoomLabel>Environment Front</RoomLabel>
          <TempValue>
            {frontTemp?.toFixed(1) ?? '--'}
            <TempUnit>°C</TempUnit>
          </TempValue>
        </RoomTemp>

        <DiffBox>
          <DiffLabel>Difference</DiffLabel>
          <DiffValue value={parseFloat(tempDiff)}>
            {tempDiff ? (tempDiff > 0 ? `+${tempDiff}` : tempDiff) : '--'}°C
          </DiffValue>
        </DiffBox>

        <RoomTemp align="flex-end">
          <RoomLabel>Environment Back (AC)</RoomLabel>
          <TempValue>
            {backTemp?.toFixed(1) ?? '--'}
            <TempUnit>°C</TempUnit>
          </TempValue>
        </RoomTemp>
      </ComparisonBanner>

      {/* Room Sensors */}
      <RoomsGrid>
        <RoomCard>
          <RoomHeader>
            <RoomIcon>🌡️</RoomIcon>
            <RoomTitle>Environment Front</RoomTitle>
          </RoomHeader>
          {frontData && (
            <SensorGrid>
              <SensorCard title="Temp" value={frontData.bme?.temp} unit="°C" icon="🌡️"
                timestamp={frontData.timestamp}
                ranges={{ warning: { min: 18, max: 30 }, critical: { min: 15, max: 35 } }} />
              <SensorCard title="Humidity" value={frontData.bme?.humidity} unit="%" icon="💧"
                timestamp={frontData.timestamp}
                ranges={{ warning: { min: 40, max: 80 }, critical: { min: 30, max: 90 } }} />
              <SensorCard title="IAQ" value={frontData.bme?.iaq} unit="" icon="🌬️"
                timestamp={frontData.timestamp}
                ranges={{ warning: { min: 0, max: 200 }, critical: { min: 0, max: 300 } }} />
              <SensorCard title="CO2" value={frontData.co2} unit="ppm" icon="🌿"
                timestamp={frontData.timestamp}
                ranges={{ warning: { min: 300, max: 1200 }, critical: { min: 250, max: 1500 } }} />
            </SensorGrid>
          )}
        </RoomCard>

        <RoomCard>
          <RoomHeader>
            <RoomIcon>❄️</RoomIcon>
            <RoomTitle>Environment Back (AC)</RoomTitle>
          </RoomHeader>
          {backData && (
            <SensorGrid>
              <SensorCard title="Temp" value={backData.bme?.temp} unit="°C" icon="🌡️"
                timestamp={backData.timestamp}
                ranges={{ warning: { min: 18, max: 30 }, critical: { min: 15, max: 35 } }} />
              <SensorCard title="Humidity" value={backData.bme?.humidity} unit="%" icon="💧"
                timestamp={backData.timestamp}
                ranges={{ warning: { min: 40, max: 80 }, critical: { min: 30, max: 90 } }} />
              <SensorCard title="IAQ" value={backData.bme?.iaq} unit="" icon="🌬️"
                timestamp={backData.timestamp}
                ranges={{ warning: { min: 0, max: 200 }, critical: { min: 0, max: 300 } }} />
              <SensorCard title="CO2" value={backData.co2} unit="ppm" icon="🌿"
                timestamp={backData.timestamp}
                ranges={{ warning: { min: 300, max: 1200 }, critical: { min: 250, max: 1500 } }} />
              <SensorCard title="AC Set" value={backData.ac?.current_set_temp ?? 18} unit="°C" icon="❄️"
                timestamp={backData.timestamp}
                ranges={{ warning: { min: 16, max: 26 }, critical: { min: 14, max: 30 } }} />
            </SensorGrid>
          )}
        </RoomCard>
      </RoomsGrid>

      {/* AC Schedule */}
      <Section>
        <SectionTitle>
          <span>❄️</span>
          AC Schedule
        </SectionTitle>

        <ScheduleContainer>
          {/* Quick Set */}
          <QuickSetRow>
            <QuickSetLabel>Set all hours to:</QuickSetLabel>
            {[16, 18, 20, 22, 24].map(temp => (
              <QuickSetButton key={temp} onClick={() => setAllHoursTo(temp)}>
                {temp}°C
              </QuickSetButton>
            ))}
          </QuickSetRow>

          {/* Visual Graph Overview */}
          <GraphContainer>
            <GraphWrapper>
              <YAxis>
                <YLabel>30°</YLabel>
                <YLabel>22°</YLabel>
                <YLabel>14°</YLabel>
              </YAxis>
              <GraphArea>
                <BarsContainer>
                  {Array.from({ length: 24 }, (_, i) => {
                    const hour = i.toString().padStart(2, '0');
                    const temp = localSchedule[hour] ?? 18;
                    return (
                      <BarWrapper key={hour}>
                        <TempTooltip>{hour}:00 - {temp}°C</TempTooltip>
                        <Bar temp={temp} />
                      </BarWrapper>
                    );
                  })}
                </BarsContainer>
                <XAxis>
                  {Array.from({ length: 24 }, (_, i) => (
                    <XLabel key={i}>{i}</XLabel>
                  ))}
                </XAxis>
              </GraphArea>
            </GraphWrapper>
          </GraphContainer>

          {/* Editable Temperature Table */}
          <EditTable>
            {Array.from({ length: 24 }, (_, i) => {
              const hour = i.toString().padStart(2, '0');
              const temp = localSchedule[hour] ?? 18;
              return (
                <EditCell key={hour}>
                  <CellHour>{hour}:00</CellHour>
                  <TempInput
                    type="number"
                    min="16"
                    max="30"
                    value={temp}
                    temp={temp}
                    onChange={(e) => handleTempInputChange(hour, e.target.value)}
                  />
                </EditCell>
              );
            })}
          </EditTable>

          {/* Save */}
          <SaveRow>
            <SaveButton onClick={handleSaveSchedule} disabled={!hasChanges || saving}>
              {saving ? 'Saving...' : 'Save Schedule'}
            </SaveButton>
            {status && <StatusMessage type={status.type}>{status.message}</StatusMessage>}
            {hasChanges && !status && (
              <StatusMessage type="warning" style={{ color: '#f59e0b' }}>
                Unsaved changes
              </StatusMessage>
            )}
          </SaveRow>
        </ScheduleContainer>
      </Section>
    </Container>
  );
};

export default Rooms;
