import React, { useState } from 'react';
import styled from 'styled-components';

const Container = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${props => props.theme.spacing.lg};
  background: ${props => props.theme.colors.surface};
  border-radius: ${props => props.theme.borderRadius.lg};
  box-shadow: ${props => props.theme.shadows.sm};
  margin-bottom: ${props => props.theme.spacing.md};
  position: relative;
  border: 2px solid ${props => {
    if (props.controlMode === 'manual') return props.theme.colors.warning;
    if (props.controlMode === 'timer') return props.theme.colors.primary;
    return 'transparent';
  }};
`;

const LabelContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.xs};
`;

const Label = styled.div`
  font-weight: 600;
  color: ${props => props.theme.colors.text};
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
`;

const ControlModeIndicator = styled.div`
  font-size: ${props => props.theme.fontSizes.xs};
  font-weight: 500;
  color: ${props => {
    if (props.mode === 'manual') return props.theme.colors.warning;
    if (props.mode === 'timer') return props.theme.colors.primary;
    return props.theme.colors.textMuted;
  }};
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const ModeIcon = styled.span`
  font-size: ${props => props.theme.fontSizes.xs};
`;

const ToggleContainer = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.md};
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

const StateText = styled.span`
  font-size: 0.875rem;
  font-weight: 600;
  color: ${props => props.state === 'ON'
    ? props.theme.colors.success
    : props.theme.colors.textMuted};
  text-transform: uppercase;
  min-width: 30px;
`;

const ToggleSwitch = styled.button`
  position: relative;
  width: 60px;
  height: 30px;
  background: ${props => props.isOn
    ? props.theme.colors.success
    : props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.full};
  transition: ${props => props.theme.transitions.default};
  border: none;
  cursor: pointer;
  outline: none;

  &:hover {
    background: ${props => props.isOn
      ? props.theme.colors.successHover
      : props.theme.colors.borderHover};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &::after {
    content: '';
    position: absolute;
    top: 2px;
    left: ${props => props.isOn ? '32px' : '2px'};
    width: 26px;
    height: 26px;
    background: white;
    border-radius: 50%;
    transition: ${props => props.theme.transitions.default};
    box-shadow: ${props => props.theme.shadows.sm};
  }
`;

const LoadingSpinner = styled.div`
  width: 16px;
  height: 16px;
  border: 2px solid ${props => props.theme.colors.border};
  border-top: 2px solid ${props => props.theme.colors.primary};
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const ToggleRelay = ({
  label,
  state,
  onChange,
  onModeChange,
  icon,
  disabled = false,
  controlMode = 'manual', // 'manual' or 'timer'
  scheduleInfo = null
}) => {
  const [loading, setLoading] = useState(false);
  const [modeLoading, setModeLoading] = useState(false);
  const isOn = state === 'ON';

  const handleToggle = async () => {
    if (disabled || loading) return;

    setLoading(true);
    try {
      const newState = isOn ? 'OFF' : 'ON';
      await onChange(newState);
    } catch (error) {
      console.error('Error toggling relay:', error);
    } finally {
      setLoading(false);
    }
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
    if (controlMode === 'timer') {
      return {
        icon: '⏰',
        text: 'Timer',
        detail: scheduleInfo ? `${scheduleInfo.on} - ${scheduleInfo.off}` : 'Scheduled'
      };
    }
    return {
      icon: '🎛️',
      text: 'Manual',
      detail: 'Override Active'
    };
  };

  const modeDisplay = getModeDisplay();

  return (
    <Container controlMode={controlMode}>
      <LabelContainer>
        <Label>
          {icon} {label}
        </Label>
        <ControlModeIndicator mode={controlMode}>
          <ModeIcon>{modeDisplay.icon}</ModeIcon>
          {modeDisplay.text}
          {modeDisplay.detail && ` • ${modeDisplay.detail}`}
        </ControlModeIndicator>
      </LabelContainer>
      <ToggleContainer>
        <ModeToggleButton
          mode={controlMode}
          onClick={handleModeToggle}
          disabled={disabled || modeLoading}
          title={`Switch to ${controlMode === 'manual' ? 'Timer' : 'Manual'} mode`}
        >
          {modeLoading ? '...' : controlMode === 'manual' ? '⏰ Timer' : '🎛️ Manual'}
        </ModeToggleButton>
        <StateText state={state}>{state}</StateText>
        {loading ? (
          <LoadingSpinner />
        ) : (
          <ToggleSwitch
            isOn={isOn}
            onClick={handleToggle}
            disabled={disabled}
            title={`Turn ${isOn ? 'OFF' : 'ON'} ${label}`}
          />
        )}
      </ToggleContainer>
    </Container>
  );
};

export default ToggleRelay;