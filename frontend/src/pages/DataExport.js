import React, { useState } from 'react';
import styled from 'styled-components';
import { exportAPI } from '../services/api';

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
  margin: 0 0 ${props => props.theme.spacing.md} 0;
  font-size: 0.85rem;
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: ${props => props.theme.spacing.md};
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.xs};
`;

const Label = styled.label`
  font-weight: 600;
  color: ${props => props.theme.colors.text};
  font-size: 0.8rem;
`;

const Select = styled.select`
  padding: ${props => props.theme.spacing.sm};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.md};
  font-size: 0.85rem;
  background: ${props => props.theme.colors.background};
  color: ${props => props.theme.colors.text};
  transition: ${props => props.theme.transitions.fast};

  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary};
  }
`;

const Input = styled.input`
  padding: ${props => props.theme.spacing.sm};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.md};
  font-size: 0.85rem;
  background: ${props => props.theme.colors.background};
  color: ${props => props.theme.colors.text};
  transition: ${props => props.theme.transitions.fast};

  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary};
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.sm};
  margin-top: ${props => props.theme.spacing.sm};
`;

const ExportButton = styled.button`
  background: ${props => {
    if (props.variant === 'primary') return props.theme.colors.primary;
    if (props.variant === 'success') return props.theme.colors.success;
    return props.theme.colors.textSecondary;
  }};
  color: white;
  border: none;
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  border-radius: ${props => props.theme.borderRadius.md};
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  transition: ${props => props.theme.transitions.fast};
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};

  &:hover {
    opacity: 0.9;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const LoadingSpinner = styled.div`
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const StatusMessage = styled.div`
  margin-top: ${props => props.theme.spacing.sm};
  padding: ${props => props.theme.spacing.sm};
  border-radius: ${props => props.theme.borderRadius.md};
  font-size: 0.85rem;
  background: ${props => {
    if (props.type === 'success') return `${props.theme.colors.success}15`;
    if (props.type === 'error') return `${props.theme.colors.danger}15`;
    return `${props.theme.colors.primary}15`;
  }};
  color: ${props => {
    if (props.type === 'success') return props.theme.colors.success;
    if (props.type === 'error') return props.theme.colors.danger;
    return props.theme.colors.primary;
  }};
  border: 1px solid ${props => {
    if (props.type === 'success') return `${props.theme.colors.success}30`;
    if (props.type === 'error') return `${props.theme.colors.danger}30`;
    return `${props.theme.colors.primary}30`;
  }};
`;

const HYDRO_UNITS = ['ALL', 'DWC1', 'DWC2', 'NFT', 'AERO', 'TROUGH'];
const DATE_RANGES = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'last7days', label: 'Last 7 Days' },
  { value: 'last30days', label: 'Last 30 Days' },
  { value: 'thismonth', label: 'This Month' },
  { value: 'lastmonth', label: 'Last Month' },
  { value: 'custom', label: 'Custom Range' }
];

const DataExport = () => {
  const [csvUnit, setCsvUnit] = useState('ALL');
  const [csvDateRange, setCsvDateRange] = useState('last7days');
  const [csvStartDate, setCsvStartDate] = useState('');
  const [csvEndDate, setCsvEndDate] = useState('');
  const [csvLoading, setCsvLoading] = useState(false);
  const [csvStatus, setCsvStatus] = useState(null);

  const [zipUnit, setZipUnit] = useState('ALL');
  const [zipDateRange, setZipDateRange] = useState('last7days');
  const [zipStartDate, setZipStartDate] = useState('');
  const [zipEndDate, setZipEndDate] = useState('');
  const [zipLoading, setZipLoading] = useState(false);
  const [zipStatus, setZipStatus] = useState(null);

  const handleCsvExport = async () => {
    setCsvLoading(true);
    setCsvStatus(null);

    try {
      const params = new URLSearchParams({
        unit: csvUnit,
        range: csvDateRange,
        ...(csvDateRange === 'custom' && {
          startDate: csvStartDate,
          endDate: csvEndDate
        })
      });

      const response = await exportAPI.exportSensorsCsv(params.toString());

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `sensor-data-${csvUnit}-${csvDateRange}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setCsvStatus({ type: 'success', message: 'CSV downloaded successfully!' });
    } catch (error) {
      setCsvStatus({ type: 'error', message: 'Failed to export CSV data.' });
      console.error('CSV export error:', error);
    } finally {
      setCsvLoading(false);
    }
  };

  const handleZipExport = async () => {
    setZipLoading(true);
    setZipStatus(null);

    try {
      const params = new URLSearchParams({
        unit: zipUnit,
        range: zipDateRange,
        ...(zipDateRange === 'custom' && {
          startDate: zipStartDate,
          endDate: zipEndDate
        })
      });

      const response = await exportAPI.exportImagesZip(params.toString());

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `camera-images-${zipUnit}-${zipDateRange}.zip`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setZipStatus({ type: 'success', message: 'ZIP downloaded successfully!' });
    } catch (error) {
      setZipStatus({ type: 'error', message: 'Failed to export camera images.' });
      console.error('ZIP export error:', error);
    } finally {
      setZipLoading(false);
    }
  };

  return (
    <Container>
      <Section>
        <SectionTitle>📈 Sensor Data Export (CSV)</SectionTitle>
        <SectionDescription>
          Export sensor readings including pH, TDS, temperature, humidity, and water levels.
        </SectionDescription>

        <FormGrid>
          <FormGroup>
            <Label>Unit</Label>
            <Select value={csvUnit} onChange={(e) => setCsvUnit(e.target.value)}>
              {HYDRO_UNITS.map(unit => (
                <option key={unit} value={unit}>
                  {unit === 'ALL' ? 'All Units' : unit}
                </option>
              ))}
            </Select>
          </FormGroup>

          <FormGroup>
            <Label>Date Range</Label>
            <Select value={csvDateRange} onChange={(e) => setCsvDateRange(e.target.value)}>
              {DATE_RANGES.map(range => (
                <option key={range.value} value={range.value}>{range.label}</option>
              ))}
            </Select>
          </FormGroup>

          {csvDateRange === 'custom' && (
            <>
              <FormGroup>
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={csvStartDate}
                  onChange={(e) => setCsvStartDate(e.target.value)}
                />
              </FormGroup>
              <FormGroup>
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={csvEndDate}
                  onChange={(e) => setCsvEndDate(e.target.value)}
                />
              </FormGroup>
            </>
          )}
        </FormGrid>

        <ButtonContainer>
          <ExportButton
            variant="primary"
            onClick={handleCsvExport}
            disabled={csvLoading || (csvDateRange === 'custom' && (!csvStartDate || !csvEndDate))}
          >
            {csvLoading ? <LoadingSpinner /> : '📥'}
            {csvLoading ? 'Exporting...' : 'Export CSV'}
          </ExportButton>
        </ButtonContainer>

        {csvStatus && (
          <StatusMessage type={csvStatus.type}>{csvStatus.message}</StatusMessage>
        )}
      </Section>

      <Section>
        <SectionTitle>📷 Camera Images Export (ZIP)</SectionTitle>
        <SectionDescription>
          Export camera images as a ZIP archive organized by unit and date.
        </SectionDescription>

        <FormGrid>
          <FormGroup>
            <Label>Unit</Label>
            <Select value={zipUnit} onChange={(e) => setZipUnit(e.target.value)}>
              {HYDRO_UNITS.map(unit => (
                <option key={unit} value={unit}>
                  {unit === 'ALL' ? 'All Units' : unit}
                </option>
              ))}
            </Select>
          </FormGroup>

          <FormGroup>
            <Label>Date Range</Label>
            <Select value={zipDateRange} onChange={(e) => setZipDateRange(e.target.value)}>
              {DATE_RANGES.map(range => (
                <option key={range.value} value={range.value}>{range.label}</option>
              ))}
            </Select>
          </FormGroup>

          {zipDateRange === 'custom' && (
            <>
              <FormGroup>
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={zipStartDate}
                  onChange={(e) => setZipStartDate(e.target.value)}
                />
              </FormGroup>
              <FormGroup>
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={zipEndDate}
                  onChange={(e) => setZipEndDate(e.target.value)}
                />
              </FormGroup>
            </>
          )}
        </FormGrid>

        <ButtonContainer>
          <ExportButton
            variant="success"
            onClick={handleZipExport}
            disabled={zipLoading || (zipDateRange === 'custom' && (!zipStartDate || !zipEndDate))}
          >
            {zipLoading ? <LoadingSpinner /> : '📦'}
            {zipLoading ? 'Exporting...' : 'Export ZIP'}
          </ExportButton>
        </ButtonContainer>

        {zipStatus && (
          <StatusMessage type={zipStatus.type}>{zipStatus.message}</StatusMessage>
        )}
      </Section>
    </Container>
  );
};

export default DataExport;
