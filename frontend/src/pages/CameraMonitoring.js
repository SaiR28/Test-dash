import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import CameraGrid from '../components/CameraGrid';
import axios from 'axios';
import { useSocket } from '../contexts/SocketContext';

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

  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    padding: ${props => props.theme.spacing.sm};
    border-radius: ${props => props.theme.borderRadius.sm};
  }
`;

const SectionTitle = styled.h2`
  font-size: 0.85rem;
  font-weight: 600;
  color: ${props => props.theme.colors.textSecondary};
  margin-bottom: ${props => props.theme.spacing.sm};
  text-transform: uppercase;
  letter-spacing: 0.03em;
`;

const StatusGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: ${props => props.theme.spacing.sm};
  margin-bottom: ${props => props.theme.spacing.md};

  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    grid-template-columns: repeat(4, 1fr);
    gap: ${props => props.theme.spacing.xs};
  }
`;

const StatusCard = styled.div`
  background: ${props => props.theme.colors.background};
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.sm};
  text-align: center;
  border-left: 3px solid ${props => {
    if (props.type === 'online') return props.theme.colors.success;
    if (props.type === 'warning') return props.theme.colors.warning;
    if (props.type === 'offline') return props.theme.colors.danger;
    return props.theme.colors.border;
  }};

  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    padding: ${props => props.theme.spacing.xs};
  }
`;

const StatusNumber = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: ${props => {
    if (props.type === 'online') return props.theme.colors.success;
    if (props.type === 'warning') return props.theme.colors.warning;
    if (props.type === 'offline') return props.theme.colors.danger;
    return props.theme.colors.text;
  }};

  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    font-size: 1.1rem;
  }
`;

const StatusLabel = styled.div`
  font-size: 0.7rem;
  color: ${props => props.theme.colors.textMuted};
  text-transform: uppercase;
  font-weight: 500;
`;

const UnitSelector = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.sm};
  flex-wrap: nowrap;

  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    gap: ${props => props.theme.spacing.xs};
  }
`;

const UnitButton = styled.button`
  background: ${props => props.active
    ? props.theme.colors.primary
    : props.theme.colors.background};
  color: ${props => props.active
    ? 'white'
    : props.theme.colors.text};
  border: 1px solid ${props => props.active
    ? props.theme.colors.primary
    : props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  transition: ${props => props.theme.transitions.fast};
  flex: 1;
  min-width: 0;

  &:hover {
    border-color: ${props => props.theme.colors.primary};
    background: ${props => props.active
      ? props.theme.colors.primary
      : props.theme.colors.surfaceHover};
  }

  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.sm};
    font-size: 0.75rem;
  }
`;

const NoUnitSelected = styled.div`
  text-align: center;
  padding: ${props => props.theme.spacing.lg};
  color: ${props => props.theme.colors.textMuted};
  font-size: 0.9rem;
`;

const LatestUploadSection = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.md};
  align-items: flex-start;

  @media (max-width: 600px) {
    flex-direction: column;
  }
`;

const LatestImageContainer = styled.div`
  flex: 0 0 200px;
  height: 150px;
  border-radius: ${props => props.theme.borderRadius.md};
  overflow: hidden;
  background: ${props => props.theme.colors.background};
  border: 2px solid ${props => props.theme.colors.primary};

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  @media (max-width: 600px) {
    flex: none;
    width: 100%;
    height: 180px;
  }
`;

const LatestImageInfo = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.xs};
`;

const LatestImageLabel = styled.div`
  font-size: 0.75rem;
  color: ${props => props.theme.colors.textMuted};
  text-transform: uppercase;
`;

const LatestImageValue = styled.div`
  font-size: 0.9rem;
  color: ${props => props.theme.colors.text};
  font-weight: 500;
`;

const LiveBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: ${props => props.theme.colors.danger};
  color: white;
  padding: 2px 8px;
  border-radius: ${props => props.theme.borderRadius.sm};
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;

  &::before {
    content: '';
    width: 6px;
    height: 6px;
    background: white;
    border-radius: 50%;
    animation: pulse 1s infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`;

const NoImagePlaceholder = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: ${props => props.theme.colors.textMuted};
  font-size: 0.8rem;
`;

const HYDRO_UNITS = ['DWC1', 'DWC2', 'DWC3', 'AERO', 'TROUGH'];

const CameraMonitoring = () => {
  const [selectedUnit, setSelectedUnit] = useState('');
  const [overallStatus, setOverallStatus] = useState({
    online: 0,
    warning: 0,
    offline: 0,
    total: 0
  });
  const { latestCameraImage } = useSocket();
  const [displayedImage, setDisplayedImage] = useState(null);

  // Fetch initial latest image on mount
  useEffect(() => {
    const fetchLatestImage = async () => {
      try {
        const response = await axios.get('/cameras/latest');
        setDisplayedImage(response.data);
      } catch (error) {
        console.log('No existing camera images');
      }
    };
    fetchLatestImage();
  }, []);

  // Update displayed image when new one arrives via WebSocket
  useEffect(() => {
    if (latestCameraImage) {
      setDisplayedImage(latestCameraImage);
    }
  }, [latestCameraImage]);

  useEffect(() => {
    fetchOverallStatus();
    const interval = setInterval(fetchOverallStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchOverallStatus = async () => {
    try {
      const response = await axios.get('/cameras/status');
      const data = response.data;

      let online = 0, warning = 0, offline = 0, total = 0;

      Object.values(data.units || {}).forEach(cameras => {
        cameras.forEach(camera => {
          total++;
          if (camera.status === 'online') online++;
          else if (camera.status === 'warning') warning++;
          else offline++;
        });
      });

      setOverallStatus({ online, warning, offline, total });
    } catch (error) {
      console.error('Error fetching camera status:', error);
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp * 1000);
    return date.toLocaleString();
  };

  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return null;
    // In production, use relative URL; in dev, prepend backend URL
    if (process.env.NODE_ENV === 'production') {
      return imageUrl;
    }
    return `http://localhost:5000${imageUrl}`;
  };

  return (
    <Container>
      <Section>
        <SectionTitle><LiveBadge>Live</LiveBadge> Latest Upload</SectionTitle>
        <LatestUploadSection>
          <LatestImageContainer>
            {displayedImage ? (
              <img
                src={getImageUrl(displayedImage.image_url)}
                alt={`Camera ${displayedImage.camera_id}`}
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            ) : (
              <NoImagePlaceholder>No images yet</NoImagePlaceholder>
            )}
          </LatestImageContainer>
          <LatestImageInfo>
            <div>
              <LatestImageLabel>Camera</LatestImageLabel>
              <LatestImageValue>{displayedImage?.camera_id || 'N/A'}</LatestImageValue>
            </div>
            <div>
              <LatestImageLabel>Unit</LatestImageLabel>
              <LatestImageValue>{displayedImage?.unit_id || 'N/A'}</LatestImageValue>
            </div>
            <div>
              <LatestImageLabel>Position</LatestImageLabel>
              <LatestImageValue>
                {displayedImage ? `Level ${displayedImage.level}, Position ${displayedImage.position}` : 'N/A'}
              </LatestImageValue>
            </div>
            <div>
              <LatestImageLabel>Uploaded</LatestImageLabel>
              <LatestImageValue>{formatTimestamp(displayedImage?.timestamp)}</LatestImageValue>
            </div>
          </LatestImageInfo>
        </LatestUploadSection>
      </Section>

      <Section>
        <SectionTitle>Camera Status</SectionTitle>
        <StatusGrid>
          <StatusCard type="online">
            <StatusNumber type="online">{overallStatus.online}</StatusNumber>
            <StatusLabel>Online</StatusLabel>
          </StatusCard>
          <StatusCard type="warning">
            <StatusNumber type="warning">{overallStatus.warning}</StatusNumber>
            <StatusLabel>Warning</StatusLabel>
          </StatusCard>
          <StatusCard type="offline">
            <StatusNumber type="offline">{overallStatus.offline}</StatusNumber>
            <StatusLabel>Offline</StatusLabel>
          </StatusCard>
          <StatusCard>
            <StatusNumber>{overallStatus.total}</StatusNumber>
            <StatusLabel>Total</StatusLabel>
          </StatusCard>
        </StatusGrid>

        <SectionTitle>🎛️ Select Unit</SectionTitle>
        <UnitSelector>
          {HYDRO_UNITS.map(unit => (
            <UnitButton
              key={unit}
              active={selectedUnit === unit}
              onClick={() => setSelectedUnit(unit)}
            >
              {unit}
            </UnitButton>
          ))}
        </UnitSelector>
      </Section>

      <Section>
        <SectionTitle>📷 Camera Feeds</SectionTitle>
        {selectedUnit ? (
          <CameraGrid unitId={selectedUnit} />
        ) : (
          <NoUnitSelected>
            Select a hydroponic unit above to view its cameras
          </NoUnitSelected>
        )}
      </Section>
    </Container>
  );
};

export default CameraMonitoring;
