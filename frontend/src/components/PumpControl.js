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

const InputRow = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.sm};
  margin-bottom: ${props => props.theme.spacing.xs};
`;

const InputGroup = styled.div`
  flex: 1;
`;

const InputLabel = styled.label`
  display: block;
  font-size: 0.65rem;
  color: ${props => props.theme.colors.textMuted};
  margin-bottom: 2px;
  text-transform: uppercase;
`;

const Input = styled.input`
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

const Preview = styled.div`
  font-size: 0.7rem;
  color: ${props => props.theme.colors.textSecondary};
  background: ${props => props.theme.colors.background};
  padding: 6px 8px;
  border-radius: 4px;
  margin-bottom: ${props => props.theme.spacing.xs};
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

  &:hover { background: ${props => props.theme.colors.primaryHover}; }
  &:disabled { background: ${props => props.theme.colors.textMuted}; cursor: not-allowed; }
`;

function formatDuration(seconds) {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
}

const PumpControl = ({
  state,
  controlMode,
  pumpCycle,
  onRelayToggle,
  onModeChange,
  onCycleUpdate,
  disabled = false
}) => {
  const [loading, setLoading] = useState(false);
  const [modeLoading, setModeLoading] = useState(false);
  const [duration, setDuration] = useState(pumpCycle?.on_duration_sec || 300);
  const [interval, setIntervalVal] = useState(pumpCycle?.interval_sec || 3600);

  const isOn = state === 'ON';
  const hasChanges = duration !== (pumpCycle?.on_duration_sec || 300) ||
                     interval !== (pumpCycle?.interval_sec || 3600);

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
    try { await onCycleUpdate({ on_duration_sec: duration, interval_sec: interval }); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  return (
    <Container>
      <Header>
        <Label>💧 Pump</Label>
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
            <InputRow>
              <InputGroup>
                <InputLabel>Duration (s)</InputLabel>
                <Input
                  type="number"
                  min="1"
                  max="3600"
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
                  disabled={loading}
                />
              </InputGroup>
              <InputGroup>
                <InputLabel>Interval (s)</InputLabel>
                <Input
                  type="number"
                  min="60"
                  max="86400"
                  value={interval}
                  onChange={(e) => setIntervalVal(parseInt(e.target.value) || 0)}
                  disabled={loading}
                />
              </InputGroup>
            </InputRow>
            <Preview>
              Runs {formatDuration(duration)} every {formatDuration(interval)}
            </Preview>
            <SaveBtn onClick={handleSave} disabled={!hasChanges || loading || duration <= 0 || interval < 60}>
              {loading ? '...' : 'Save'}
            </SaveBtn>
          </>
        )}
      </ControlBox>
    </Container>
  );
};

export default PumpControl;
