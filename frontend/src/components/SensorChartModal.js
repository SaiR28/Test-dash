import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import axios from 'axios';

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: ${props => props.theme.spacing.md};
`;

const Modal = styled.div`
  background: ${props => props.theme.colors.surface};
  border-radius: ${props => props.theme.borderRadius.lg};
  width: 100%;
  max-width: 800px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: ${props => props.theme.shadows.lg};

  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    max-height: 95vh;
    border-radius: ${props => props.theme.borderRadius.md};
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${props => props.theme.spacing.md};
  border-bottom: 1px solid ${props => props.theme.colors.border};
`;

const Title = styled.h2`
  font-size: 1.1rem;
  font-weight: 600;
  color: ${props => props.theme.colors.text};
  margin: 0;
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  color: ${props => props.theme.colors.textMuted};
  cursor: pointer;
  padding: ${props => props.theme.spacing.xs};
  line-height: 1;

  &:hover {
    color: ${props => props.theme.colors.text};
  }
`;

const Content = styled.div`
  padding: ${props => props.theme.spacing.md};
  overflow-y: auto;
  flex: 1;
`;

const RangeSelector = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.xs};
  margin-bottom: ${props => props.theme.spacing.md};
  flex-wrap: wrap;
`;

const RangeButton = styled.button`
  padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.sm};
  border: 1px solid ${props => props.active
    ? props.theme.colors.primary
    : props.theme.colors.border};
  background: ${props => props.active
    ? props.theme.colors.primary
    : 'transparent'};
  color: ${props => props.active
    ? 'white'
    : props.theme.colors.text};
  border-radius: ${props => props.theme.borderRadius.md};
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: ${props => props.theme.transitions.fast};

  &:hover {
    border-color: ${props => props.theme.colors.primary};
  }
`;

const ChartContainer = styled.div`
  width: 100%;
  height: 300px;

  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    height: 250px;
  }
`;

const Stats = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: ${props => props.theme.spacing.sm};
  margin-top: ${props => props.theme.spacing.md};

  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const StatCard = styled.div`
  background: ${props => props.theme.colors.background};
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.sm};
  text-align: center;
`;

const StatLabel = styled.div`
  font-size: 0.7rem;
  color: ${props => props.theme.colors.textMuted};
  text-transform: uppercase;
  margin-bottom: 4px;
`;

const StatValue = styled.div`
  font-size: 1.1rem;
  font-weight: 700;
  color: ${props => props.theme.colors.text};
`;

const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 300px;
  color: ${props => props.theme.colors.textMuted};
`;

const NoDataMessage = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
  color: ${props => props.theme.colors.textMuted};
  text-align: center;
`;

const ranges = [
  { key: '5m', label: '5 Min' },
  { key: '15m', label: '15 Min' },
  { key: '30m', label: '30 Min' },
  { key: '1h', label: '1 Hour' },
  { key: '24h', label: '24 Hours' },
  { key: '7d', label: '7 Days' },
  { key: '30d', label: '30 Days' }
];

const sensorKeyMap = {
  'pH Level': 'ph',
  'TDS': 'tds',
  'Turbidity': 'turbidity',
  'Water Temperature': 'water_temp',
  'Water Temp': 'water_temp',
  'Water Level': 'water_level',
  'Temperature': 'temp',
  'Humidity': 'humidity',
  'Pressure': 'pressure',
  'IAQ': 'iaq',
  'CO2': 'co2'
};

function formatTimestamp(timestamp, rangeType) {
  const date = new Date(timestamp * 1000);

  if (rangeType === '5m' || rangeType === '15m') {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } else if (rangeType === '30m' || rangeType === '1h') {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (rangeType === '24h') {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (rangeType === '7d') {
    return date.toLocaleDateString([], { weekday: 'short', hour: '2-digit' });
  } else {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
}

const CustomTooltip = ({ active, payload, label, unit }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div style={{
        background: 'rgba(0, 0, 0, 0.8)',
        padding: '8px 12px',
        borderRadius: '4px',
        color: 'white',
        fontSize: '0.85rem'
      }}>
        <div style={{ marginBottom: '4px' }}>
          {new Date(data.timestamp * 1000).toLocaleString()}
        </div>
        <div style={{ fontWeight: 'bold' }}>
          {data.value !== null ? `${data.value} ${unit}` : 'No data'}
        </div>
        {data.min !== undefined && (
          <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>
            Range: {data.min} - {data.max} {unit}
          </div>
        )}
      </div>
    );
  }
  return null;
};

const SensorChartModal = ({ isOpen, onClose, sensorInfo, isRoom = false }) => {
  const [selectedRange, setSelectedRange] = useState('1h');
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ min: null, max: null, avg: null, current: null });

  useEffect(() => {
    if (isOpen && sensorInfo) {
      fetchChartData();
    }
  }, [isOpen, sensorInfo, selectedRange]);

  const fetchChartData = async () => {
    if (!sensorInfo) return;

    setLoading(true);
    try {
      const sensorKey = sensorInfo.sensorKey || sensorKeyMap[sensorInfo.title] || 'ph';
      const endpoint = isRoom
        ? `/room/${sensorInfo.unitId}/sensors/history`
        : `/units/${sensorInfo.unitId}/sensors/history`;

      const response = await axios.get(endpoint, {
        params: {
          sensor: sensorKey,
          range: selectedRange
        }
      });

      const data = response.data.data || [];
      setChartData(data);

      // Calculate stats
      if (data.length > 0) {
        const values = data.filter(d => d.value !== null).map(d => d.value);
        if (values.length > 0) {
          setStats({
            min: Math.min(...values).toFixed(1),
            max: Math.max(...values).toFixed(1),
            avg: (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1),
            current: values[values.length - 1].toFixed(1)
          });
        } else {
          setStats({ min: null, max: null, avg: null, current: null });
        }
      } else {
        setStats({ min: null, max: null, avg: null, current: null });
      }
    } catch (error) {
      console.error('Error fetching chart data:', error);
      setChartData([]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const unit = sensorInfo?.unit || '';

  return (
    <Overlay onClick={onClose}>
      <Modal onClick={e => e.stopPropagation()}>
        <Header>
          <Title>
            📈 {sensorInfo?.title} History
          </Title>
          <CloseButton onClick={onClose}>&times;</CloseButton>
        </Header>
        <Content>
          <RangeSelector>
            {ranges.map(range => (
              <RangeButton
                key={range.key}
                active={selectedRange === range.key}
                onClick={() => setSelectedRange(range.key)}
              >
                {range.label}
              </RangeButton>
            ))}
          </RangeSelector>

          <ChartContainer>
            {loading ? (
              <LoadingContainer>Loading chart data...</LoadingContainer>
            ) : chartData.length === 0 ? (
              <NoDataMessage>
                <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📊</div>
                <div>No data available for this time range</div>
              </NoDataMessage>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#059669" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#059669" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                  <XAxis
                    dataKey="timestamp"
                    tickFormatter={(ts) => formatTimestamp(ts, selectedRange)}
                    stroke="#9CA3AF"
                    fontSize={11}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    stroke="#9CA3AF"
                    fontSize={11}
                    domain={['dataMin - 1', 'dataMax + 1']}
                  />
                  <Tooltip content={<CustomTooltip unit={unit} />} />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#059669"
                    strokeWidth={2}
                    fill="url(#colorValue)"
                    dot={false}
                    activeDot={{ r: 4, fill: '#059669' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </ChartContainer>

          {!loading && chartData.length > 0 && (
            <Stats>
              <StatCard>
                <StatLabel>Current</StatLabel>
                <StatValue>{stats.current ?? '--'} {unit}</StatValue>
              </StatCard>
              <StatCard>
                <StatLabel>Average</StatLabel>
                <StatValue>{stats.avg ?? '--'} {unit}</StatValue>
              </StatCard>
              <StatCard>
                <StatLabel>Minimum</StatLabel>
                <StatValue>{stats.min ?? '--'} {unit}</StatValue>
              </StatCard>
              <StatCard>
                <StatLabel>Maximum</StatLabel>
                <StatValue>{stats.max ?? '--'} {unit}</StatValue>
              </StatCard>
            </Stats>
          )}
        </Content>
      </Modal>
    </Overlay>
  );
};

export default SensorChartModal;
