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

const InputContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${props => props.theme.spacing.md};
  margin-bottom: ${props => props.theme.spacing.md};

  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    grid-template-columns: 1fr;
  }
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.sm};
`;

const InputLabel = styled.label`
  font-size: 0.875rem;
  font-weight: 500;
  color: ${props => props.theme.colors.textSecondary};
`;

const Input = styled.input`
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

const HelpText = styled.div`
  font-size: 0.75rem;
  color: ${props => props.theme.colors.textMuted};
  margin-top: ${props => props.theme.spacing.xs};
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

const PreviewContainer = styled.div`
  background: ${props => props.theme.colors.background};
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.md};
  margin-bottom: ${props => props.theme.spacing.md};
`;

const PreviewLabel = styled.div`
  font-size: 0.875rem;
  font-weight: 600;
  color: ${props => props.theme.colors.textSecondary};
  margin-bottom: ${props => props.theme.spacing.sm};
`;

const PreviewText = styled.div`
  font-size: 0.875rem;
  color: ${props => props.theme.colors.text};
`;

function formatDuration(seconds) {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
}

const PumpCycle = ({
  durationSec = 300,
  intervalSec = 3600,
  onUpdate,
  onModeChange,
  disabled = false,
  controlMode = 'timer'
}) => {
  const [duration, setDuration] = useState(durationSec);
  const [interval, setInterval] = useState(intervalSec);
  const [loading, setLoading] = useState(false);
  const [modeLoading, setModeLoading] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);

  const hasChanges = duration !== durationSec || interval !== intervalSec;

  const handleSave = async () => {
    if (!hasChanges || loading) return;

    setLoading(true);
    try {
      await onUpdate({
        on_duration_sec: duration,
        interval_sec: interval
      });
      setLastSaved(new Date());
    } catch (error) {
      console.error('Error updating pump cycle:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setDuration(durationSec);
    setInterval(intervalSec);
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
          💧 Pump Cycle Settings
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

      <InputContainer>
        <InputGroup>
          <InputLabel>On Duration (seconds)</InputLabel>
          <Input
            type="number"
            min="1"
            max="3600"
            value={duration}
            onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
            disabled={disabled || loading}
          />
          <HelpText>How long the pump runs (1-3600 seconds)</HelpText>
        </InputGroup>

        <InputGroup>
          <InputLabel>Interval (seconds)</InputLabel>
          <Input
            type="number"
            min="60"
            max="86400"
            value={interval}
            onChange={(e) => setInterval(parseInt(e.target.value) || 0)}
            disabled={disabled || loading}
          />
          <HelpText>Time between pump cycles (60-86400 seconds)</HelpText>
        </InputGroup>
      </InputContainer>

      <PreviewContainer>
        <PreviewLabel>Cycle Preview</PreviewLabel>
        <PreviewText>
          Pump will run for <strong>{formatDuration(duration)}</strong> every{' '}
          <strong>{formatDuration(interval)}</strong>
          {interval > 0 && duration > 0 && (
            <span>
              {' '}
              ({Math.round((duration / interval) * 100 * 100) / 100}% duty cycle)
            </span>
          )}
        </PreviewText>
      </PreviewContainer>

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
          disabled={!hasChanges || loading || duration <= 0 || interval < 60}
        >
          {loading ? 'Saving...' : 'Save Cycle'}
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

export default PumpCycle;