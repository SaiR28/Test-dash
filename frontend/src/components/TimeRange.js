import React, { useState } from 'react';
import styled from 'styled-components';

const Container = styled.div`
  background: ${props => props.theme.colors.surface};
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: ${props => props.theme.spacing.lg};
  box-shadow: ${props => props.theme.shadows.sm};
  margin-bottom: ${props => props.theme.spacing.md};
  border: 2px solid ${props => {
    if (props.controlMode === 'manual') return props.theme.colors.warning;
    if (props.controlMode === 'timer') return props.theme.colors.primary;
    return 'transparent';
  }};
  position: relative;
`;

const LabelContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${props => props.theme.spacing.md};
`;

const Label = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  color: ${props => props.theme.colors.text};
  margin: 0;
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
`;

const ControlModeStatus = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  font-size: ${props => props.theme.fontSizes.xs};
  font-weight: 500;
  color: ${props => {
    if (props.controlMode === 'manual') return props.theme.colors.warning;
    if (props.controlMode === 'timer') return props.theme.colors.primary;
    return props.theme.colors.textMuted;
  }};
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const TimeInputContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${props => props.theme.spacing.md};
  margin-bottom: ${props => props.theme.spacing.md};

  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    grid-template-columns: 1fr;
  }
`;

const TimeInputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.sm};
`;

const TimeLabel = styled.label`
  font-size: 0.875rem;
  font-weight: 500;
  color: ${props => props.theme.colors.textSecondary};
`;

const TimeInput = styled.input`
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.md};
  font-size: 1rem;
  background: ${props => props.theme.colors.surface};
  color: ${props => props.theme.colors.text};
  transition: ${props => props.theme.transitions.default};

  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary};
    box-shadow: 0 0 0 3px ${props => props.theme.colors.primary}20;
  }

  &:disabled {
    background: ${props => props.theme.colors.background};
    color: ${props => props.theme.colors.textMuted};
    cursor: not-allowed;
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.sm};
  justify-content: flex-end;
`;

const Button = styled.button`
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.lg};
  border-radius: ${props => props.theme.borderRadius.md};
  font-weight: 600;
  font-size: 0.875rem;
  transition: ${props => props.theme.transitions.default};
  cursor: pointer;

  ${props => props.variant === 'primary' && `
    background: ${props.theme.colors.primary};
    color: ${props.theme.colors.textInverse};
    border: none;

    &:hover {
      background: ${props.theme.colors.primaryHover};
    }

    &:disabled {
      background: ${props.theme.colors.textMuted};
      cursor: not-allowed;
    }
  `}

  ${props => props.variant === 'secondary' && `
    background: transparent;
    color: ${props.theme.colors.textSecondary};
    border: 1px solid ${props.theme.colors.border};

    &:hover {
      background: ${props.theme.colors.surfaceHover};
    }
  `}
`;

const StatusMessage = styled.div`
  font-size: 0.875rem;
  color: ${props => props.type === 'success'
    ? props.theme.colors.success
    : props.theme.colors.textMuted};
  margin-top: ${props => props.theme.spacing.sm};
`;

const ModeToggleButton = styled.button`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.sm};
  border-radius: ${props => props.theme.borderRadius.md};
  font-size: ${props => props.theme.fontSizes.xs};
  font-weight: 600;
  cursor: pointer;
  transition: ${props => props.theme.transitions.default};
  border: 1px solid ${props => props.mode === 'manual'
    ? props.theme.colors.warning
    : props.theme.colors.primary};
  background: ${props => props.mode === 'manual'
    ? props.theme.colors.warning + '15'
    : props.theme.colors.primary + '15'};
  color: ${props => props.mode === 'manual'
    ? props.theme.colors.warning
    : props.theme.colors.primary};

  &:hover {
    background: ${props => props.mode === 'manual'
      ? props.theme.colors.warning + '30'
      : props.theme.colors.primary + '30'};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const TimeRange = ({
  label,
  on,
  off,
  onUpdate,
  onModeChange,
  icon,
  disabled = false,
  controlMode = 'timer'
}) => {
  const [onTime, setOnTime] = useState(on || '08:00');
  const [offTime, setOffTime] = useState(off || '20:00');
  const [loading, setLoading] = useState(false);
  const [modeLoading, setModeLoading] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);

  const hasChanges = onTime !== on || offTime !== off;

  const handleSave = async () => {
    if (!hasChanges || loading) return;

    setLoading(true);
    try {
      await onUpdate({ on: onTime, off: offTime });
      setLastSaved(new Date());
    } catch (error) {
      console.error('Error updating time range:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setOnTime(on || '08:00');
    setOffTime(off || '20:00');
  };

  const handleModeToggle = async () => {
    if (disabled || modeLoading || !onModeChange) return;

    setModeLoading(true);
    try {
      const newMode = controlMode === 'manual' ? 'timer' : 'manual';
      await onModeChange(newMode);
    } catch (error) {
      console.error('Error changing mode:', error);
    } finally {
      setModeLoading(false);
    }
  };

  const getModeDisplay = () => {
    if (controlMode === 'manual') {
      return {
        icon: '🎛️',
        text: 'Manual Override Active'
      };
    }
    return {
      icon: '⏰',
      text: 'Timer Control Active'
    };
  };

  const modeDisplay = getModeDisplay();

  return (
    <Container controlMode={controlMode}>
      <LabelContainer>
        <Label>
          {icon} {label} Schedule
        </Label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ModeToggleButton
            mode={controlMode}
            onClick={handleModeToggle}
            disabled={disabled || modeLoading}
            title={`Switch to ${controlMode === 'manual' ? 'Timer' : 'Manual'} mode`}
          >
            {modeLoading ? '...' : controlMode === 'manual' ? '⏰ Timer' : '🎛️ Manual'}
          </ModeToggleButton>
          <ControlModeStatus controlMode={controlMode}>
            {modeDisplay.icon} {modeDisplay.text}
          </ControlModeStatus>
        </div>
      </LabelContainer>

      <TimeInputContainer>
        <TimeInputGroup>
          <TimeLabel>Turn On At</TimeLabel>
          <TimeInput
            type="time"
            value={onTime}
            onChange={(e) => setOnTime(e.target.value)}
            disabled={disabled || loading}
          />
        </TimeInputGroup>

        <TimeInputGroup>
          <TimeLabel>Turn Off At</TimeLabel>
          <TimeInput
            type="time"
            value={offTime}
            onChange={(e) => setOffTime(e.target.value)}
            disabled={disabled || loading}
          />
        </TimeInputGroup>
      </TimeInputContainer>

      <ButtonContainer>
        {hasChanges && (
          <Button
            variant="secondary"
            onClick={handleReset}
            disabled={loading}
          >
            Reset
          </Button>
        )}
        <Button
          variant="primary"
          onClick={handleSave}
          disabled={!hasChanges || loading}
        >
          {loading ? 'Saving...' : 'Save Schedule'}
        </Button>
      </ButtonContainer>

      {lastSaved && (
        <StatusMessage type="success">
          Saved at {lastSaved.toLocaleTimeString()}
        </StatusMessage>
      )}
    </Container>
  );
};

export default TimeRange;