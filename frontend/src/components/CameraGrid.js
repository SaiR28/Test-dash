import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import IoTStatusIndicator from './IoTStatusIndicator';
import axios from 'axios';

const CameraContainer = styled.div`
  width: 100%;
`;

const CameraHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${props => props.theme.spacing.md};

  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    margin-bottom: ${props => props.theme.spacing.sm};
  }
`;

const CameraTitle = styled.h2`
  font-size: 1rem;
  font-weight: 600;
  color: ${props => props.theme.colors.text};
  margin: 0;
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};

  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    font-size: 0.9rem;
  }
`;

const CameraCount = styled.span`
  font-size: ${props => props.theme.fontSizes.sm};
  color: ${props => props.theme.colors.textSecondary};
  background: ${props => props.theme.colors.background};
  padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.sm};
  border-radius: ${props => props.theme.borderRadius.full};
`;

const CameraGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: ${props => props.theme.spacing.md};
  max-width: 100%;

  @media (max-width: ${props => props.theme.breakpoints.lg}) {
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  }

  @media (max-width: ${props => props.theme.breakpoints.md}) {
    grid-template-columns: repeat(2, 1fr);
    gap: ${props => props.theme.spacing.sm};
  }

  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    grid-template-columns: repeat(2, 1fr);
    gap: ${props => props.theme.spacing.xs};
  }
`;

const CameraCard = styled.div`
  background: ${props => props.theme.colors.background};
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.sm};
  border: 2px solid ${props => props.hasImage
    ? props.theme.colors.success
    : props.theme.colors.border};
  transition: ${props => props.theme.transitions.default};
  display: flex;
  flex-direction: column;
  height: fit-content;

  &:hover {
    border-color: ${props => props.theme.colors.primary};
    transform: translateY(-2px);
    box-shadow: ${props => props.theme.shadows.md};
  }

  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    padding: ${props => props.theme.spacing.xs};
    border-width: 1px;
  }
`;

const CameraCardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${props => props.theme.spacing.xs};

  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    margin-bottom: 4px;
  }
`;

const CameraName = styled.h4`
  font-size: ${props => props.theme.fontSizes.sm};
  font-weight: ${props => props.theme.fontWeights.semibold};
  color: ${props => props.theme.colors.text};
  margin: 0;

  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    font-size: 0.7rem;
  }
`;

const CameraImageContainer = styled.div`
  width: 100%;
  aspect-ratio: 4/3;
  background: ${props => props.theme.colors.surfaceHover};
  border-radius: ${props => props.theme.borderRadius.sm};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: ${props => props.theme.spacing.xs};
  overflow: hidden;
  position: relative;
  min-height: 120px;

  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    min-height: 80px;
    border-radius: 4px;
  }
`;

const CameraImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: ${props => props.theme.borderRadius.sm};
`;

const PlaceholderText = styled.div`
  color: ${props => props.theme.colors.textMuted};
  font-size: ${props => props.theme.fontSizes.sm};
  text-align: center;
`;

const ImageTimestamp = styled.div`
  position: absolute;
  bottom: 2px;
  right: 2px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 2px 4px;
  border-radius: 2px;
  font-size: 0.6rem;

  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    font-size: 0.5rem;
    padding: 1px 3px;
  }
`;

const CameraInfo = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: ${props => props.theme.fontSizes.xs};
  color: ${props => props.theme.colors.textMuted};

  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    font-size: 0.6rem;
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
  }
`;

const LoadingMessage = styled.div`
  text-align: center;
  padding: ${props => props.theme.spacing.xl};
  color: ${props => props.theme.colors.textSecondary};
`;

const ErrorMessage = styled.div`
  background: ${props => props.theme.colors.danger}10;
  color: ${props => props.theme.colors.danger};
  padding: ${props => props.theme.spacing.md};
  border-radius: ${props => props.theme.borderRadius.md};
  border: 1px solid ${props => props.theme.colors.danger}30;
  margin-bottom: ${props => props.theme.spacing.md};
  font-size: ${props => props.theme.fontSizes.sm};
`;

function formatTimestamp(timestamp) {
  if (!timestamp) return 'Never';
  return new Date(timestamp * 1000).toLocaleString();
}

function getCameraStatus(timestamp) {
  if (!timestamp) return 'offline';

  const now = Math.floor(Date.now() / 1000);
  const timeDiff = now - timestamp;

  if (timeDiff <= 300) return 'online'; // 5 minutes
  if (timeDiff <= 900) return 'warning'; // 15 minutes
  return 'offline';
}

const CameraGridComponent = ({ unitId }) => {
  const [cameras, setCameras] = useState([]);
  const [cameraImages, setCameraImages] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCameras();
    fetchLatestImages();

    // Poll for camera updates every 30 seconds
    const interval = setInterval(() => {
      fetchCameras();
      fetchLatestImages();
    }, 30000);

    return () => clearInterval(interval);
  }, [unitId]);

  const fetchCameras = async () => {
    try {
      const response = await axios.get(`/cameras/${unitId}`);
      setCameras(response.data.cameras || []);
    } catch (err) {
      console.error('Error fetching cameras:', err);
      setError('Failed to load camera data');
    }
  };

  const fetchLatestImages = async () => {
    try {
      const response = await axios.get(`/units/${unitId}/cameras/latest`);
      setCameraImages(response.data.camera_grid || {});
      setLoading(false);
    } catch (err) {
      console.error('Error fetching images:', err);
      setError('Failed to load camera images');
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingMessage>Loading cameras...</LoadingMessage>;
  }

  if (error) {
    return <ErrorMessage>{error}</ErrorMessage>;
  }

  // Generate camera grid based on available cameras
  const allCameras = [];
  Object.keys(cameraImages).forEach(level => {
    Object.keys(cameraImages[level]).forEach(pos => {
      const camera = cameraImages[level][pos];
      allCameras.push({
        ...camera,
        level: level,
        position: pos
      });
    });
  });

  // If no camera images, show cameras from status
  if (allCameras.length === 0 && cameras.length > 0) {
    cameras.forEach(camera => {
      allCameras.push({
        camera_id: camera.camera_id,
        timestamp: camera.last_image_timestamp,
        image_url: null,
        level: 'Unknown',
        position: 'Unknown'
      });
    });
  }

  return (
    <CameraContainer>
      <CameraHeader>
        <CameraTitle>📷 Camera Monitoring</CameraTitle>
        <CameraCount>{allCameras.length} cameras</CameraCount>
      </CameraHeader>

      {allCameras.length === 0 ? (
        <PlaceholderText>No cameras detected for this unit</PlaceholderText>
      ) : (
        <CameraGrid>
          {allCameras.map((camera, index) => (
            <CameraCard key={camera.camera_id || index} hasImage={!!camera.image_url}>
              <CameraCardHeader>
                <CameraName>{camera.camera_id || `Camera ${index + 1}`}</CameraName>
                <IoTStatusIndicator
                  unitId={camera.camera_id}
                  timestamp={camera.timestamp}
                  compact={true}
                />
              </CameraCardHeader>

              <CameraImageContainer>
                {camera.image_url ? (
                  <>
                    <CameraImage
                      src={`http://localhost:5000${camera.image_url}`}
                      alt={`Camera ${camera.camera_id}`}
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                    <ImageTimestamp>
                      {formatTimestamp(camera.timestamp)}
                    </ImageTimestamp>
                  </>
                ) : (
                  <PlaceholderText>
                    📷<br />
                    No image<br />
                    available
                  </PlaceholderText>
                )}
              </CameraImageContainer>

              <CameraInfo>
                <span>Level: {camera.level}</span>
                <span>Status: {getCameraStatus(camera.timestamp)}</span>
              </CameraInfo>
            </CameraCard>
          ))}
        </CameraGrid>
      )}
    </CameraContainer>
  );
};

export default CameraGridComponent;