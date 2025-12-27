import React from 'react';
import styled from 'styled-components';

const Container = styled.div`
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
`;

const SVG = styled.svg`
  transform: rotate(-90deg);
`;

const CircleBackground = styled.circle`
  fill: none;
  stroke: ${props => props.theme.colors.border};
  stroke-width: ${props => props.strokeWidth};
`;

const CircleProgress = styled.circle`
  fill: none;
  stroke: ${props => props.color || props.theme.colors.primary};
  stroke-width: ${props => props.strokeWidth};
  stroke-linecap: round;
  transition: stroke-dashoffset 0.5s ease;
`;

const ValueContainer = styled.div`
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

const Value = styled.span`
  font-size: ${props => props.fontSize || '1.25rem'};
  font-weight: 700;
  color: ${props => props.theme.colors.text};
  line-height: 1;
`;

const Label = styled.span`
  font-size: 0.6rem;
  color: ${props => props.theme.colors.textMuted};
  text-transform: uppercase;
  font-weight: 500;
  margin-top: 2px;
`;

const CircularProgress = ({
  value = 0,
  max = 100,
  size = 80,
  strokeWidth = 6,
  color,
  label,
  displayValue,
  fontSize
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const percent = Math.min(Math.max(value / max, 0), 1);
  const offset = circumference - percent * circumference;

  return (
    <Container>
      <SVG width={size} height={size}>
        <CircleBackground
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
        />
        <CircleProgress
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          color={color}
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: offset
          }}
        />
      </SVG>
      <ValueContainer>
        <Value fontSize={fontSize}>{displayValue ?? value}</Value>
        {label && <Label>{label}</Label>}
      </ValueContainer>
    </Container>
  );
};

export default CircularProgress;
