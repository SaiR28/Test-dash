import React, { useState } from 'react';
import styled from 'styled-components';

const Container = styled.div`
  background: ${props => props.theme.colors.surface};
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.md};
  box-shadow: ${props => props.theme.shadows.sm};
  margin-bottom: ${props => props.theme.spacing.sm};
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${props => props.theme.spacing.sm};
`;

const Label = styled.span`
  font-size: 0.9rem;
  font-weight: 600;
  color: ${props => props.theme.colors.text};
  display: flex;
  align-items: center;
  gap: 6px;
`;

const ModeSwitch = styled.div`
  display: flex;
  background: ${props => props.theme.colors.background};
  border-radius: 4px;
  padding: 2px;
`;

const ModeButton = styled.button`
  padding: 4px 10px;
  border: none;
  border-radius: 3px;
  font-size: 0.7rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  background: ${props => props.active
    ? (props.mode === 'manual' ? props.theme.colors.warning : props.theme.colors.primary)
    : 'transparent'};
  color: ${props => props.active ? '#fff' : props.theme.colors.textMuted};

  &:hover:not(:disabled) {
    background: ${props => props.active
      ? (props.mode === 'manual' ? props.theme.colors.warning : props.theme.colors.primary)
      : props.theme.colors.border};
  }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

const ControlBox = styled.div`
  padding: ${props => props.theme.spacing.sm};
  background: ${props => props.mode === 'manual'
    ? props.theme.colors.warning + '10'
    : props.theme.colors.primary + '10'};
  border-radius: ${props => props.theme.borderRadius.sm};
  border: 1px solid ${props => props.mode === 'manual'
    ? props.theme.colors.warning + '30'
    : props.theme.colors.primary + '30'};
`;

const ManualRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const StateLabel = styled.span`
  font-size: 0.85rem;
  font-weight: 600;
  color: ${props => props.state === 'ON'
    ? props.theme.colors.success
    : props.theme.colors.textMuted};
`;

const ToggleSwitch = styled.button`
  position: relative;
  width: 44px;
  height: 24px;
  background: ${props => props.isOn ? props.theme.colors.success : props.theme.colors.border};
  border-radius: 12px;
  border: none;
  cursor: pointer;
  transition: all 0.2s;

  &::after {
    content: '';
    position: absolute;
    top: 2px;
    left: ${props => props.isOn ? '22px' : '2px'};
    width: 20px;
    height: 20px;
    background: white;
    border-radius: 50%;
    transition: all 0.2s;
    box-shadow: 0 1px 3px rgba(0,0,0,0.2);
  }

  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

const TimerRow = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.sm};
  align-items: center;
`;

const TimeGroup = styled.div`
  flex: 1;
`;

const TimeLabel = styled.label`
  display: block;
  font-size: 0.65rem;
  color: ${props => props.theme.colors.textMuted};
  margin-bottom: 2px;
  text-transform: uppercase;
`;

const TimeInput = styled.input`
  width: 100%;
  padding: 6px 8px;
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 4px;
  font-size: 0.85rem;
  background: ${props => props.theme.colors.surface};
  color: ${props => props.theme.colors.text};

  &:focus {
    border-color: ${props => props.theme.colors.primary};
    outline: none;
  }
`;

const SaveBtn = styled.button`
  padding: 6px 12px;
  background: ${props => props.theme.colors.primary};
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  align-self: flex-end;
  margin-top: 14px;

  &:hover { background: ${props => props.theme.colors.primaryHover}; }
  &:disabled { background: ${props => props.theme.colors.textMuted}; cursor: not-allowed; }
`;

const RelayControl = ({
  label,
  icon,
  relayType,
  state,
  controlMode,
  schedule,
  onRelayToggle,
  onModeChange,
  onScheduleUpdate,
  disabled = false
}) => {
  const [loading, setLoading] = useState(false);
  const [modeLoading, setModeLoading] = useState(false);
  const [onTime, setOnTime] = useState(schedule?.on || '08:00');
  const [offTime, setOffTime] = useState(schedule?.off || '20:00');

  const isOn = state === 'ON';
  const hasChanges = onTime !== (schedule?.on || '08:00') || offTime !== (schedule?.off || '20:00');

  const handleToggle = async () => {
    if (disabled || loading) return;
    setLoading(true);
    try { await onRelayToggle(isOn ? 'OFF' : 'ON'); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleModeChange = async (newMode) => {
    if (disabled || modeLoading || newMode === controlMode) return;
    setModeLoading(true);
    try { await onModeChange(newMode); }
    catch (e) { console.error(e); }
    finally { setModeLoading(false); }
  };

  const handleSave = async () => {
    if (!hasChanges || loading) return;
    setLoading(true);
    try { await onScheduleUpdate({ on: onTime, off: offTime }); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  return (
    <Container>
      <Header>
        <Label>{icon} {label}</Label>
        <ModeSwitch>
          <ModeButton active={controlMode === 'manual'} mode="manual" onClick={() => handleModeChange('manual')} disabled={modeLoading}>
            Manual
          </ModeButton>
          <ModeButton active={controlMode === 'timer'} mode="timer" onClick={() => handleModeChange('timer')} disabled={modeLoading}>
            Timer
          </ModeButton>
        </ModeSwitch>
      </Header>

      <ControlBox mode={controlMode}>
        {controlMode === 'manual' ? (
          <ManualRow>
            <StateLabel state={state}>{state}</StateLabel>
            <ToggleSwitch isOn={isOn} onClick={handleToggle} disabled={disabled || loading} />
          </ManualRow>
        ) : (
          <>
            <TimerRow>
              <TimeGroup>
                <TimeLabel>On</TimeLabel>
                <TimeInput type="time" value={onTime} onChange={(e) => setOnTime(e.target.value)} disabled={loading} />
              </TimeGroup>
              <TimeGroup>
                <TimeLabel>Off</TimeLabel>
                <TimeInput type="time" value={offTime} onChange={(e) => setOffTime(e.target.value)} disabled={loading} />
              </TimeGroup>
            </TimerRow>
            <SaveBtn onClick={handleSave} disabled={!hasChanges || loading}>
              {loading ? '...' : 'Save'}
            </SaveBtn>
          </>
        )}
      </ControlBox>
    </Container>
  );
};

export default RelayControl;
