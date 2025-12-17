import axios from 'axios';

// In production (Docker), use /api prefix which nginx proxies to backend
// In development, use the proxy from package.json or direct URL
const API_BASE_URL = process.env.REACT_APP_API_URL ||
  (process.env.NODE_ENV === 'production' ? '/api' : '');

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error(`API Error: ${error.response?.status} ${error.config?.url}`, error.response?.data);
    return Promise.reject(error);
  }
);

// Hydro Units API
export const hydroUnitsAPI = {
  // Get sensor data for a unit
  getSensors: (unitId) => api.get(`/units/${unitId}/sensors`),

  // Get relay states for a unit
  getRelays: (unitId) => api.get(`/units/${unitId}/relays`),

  // Update relay state
  updateRelay: (unitId, relayData) => api.post(`/units/${unitId}/relay`, relayData),

  // Get schedule for a unit
  getSchedule: (unitId) => api.get(`/units/${unitId}/schedule`),

  // Update schedule for a unit
  updateSchedule: (unitId, scheduleData) => api.post(`/units/${unitId}/schedule`, scheduleData),

  // Update control mode for a specific relay (manual/timer)
  updateControlMode: (unitId, relay, mode) => api.post(`/units/${unitId}/control_mode`, { relay, mode }),
};

// Room Monitoring API
export const roomAPI = {
  // Get front room sensors
  getFrontSensors: () => api.get('/room/front/sensors'),

  // Get back room sensors
  getBackSensors: () => api.get('/room/back/sensors'),

  // Get AC schedule
  getACSchedule: () => api.get('/room/back/ac_schedule'),

  // Update AC schedule
  updateACSchedule: (scheduleData) => api.post('/room/back/ac_schedule', scheduleData),
};

// Camera API
export const cameraAPI = {
  // Get camera status for a unit
  getCameras: (unitId) => api.get(`/cameras/${unitId}`),

  // Get recent images from a specific camera
  getCameraImages: (cameraId, limit = 10) => api.get(`/cameras/${cameraId}/images?limit=${limit}`),

  // Upload camera image
  uploadImage: (cameraId, imageFile) => {
    const formData = new FormData();
    formData.append('image', imageFile);
    return api.post(`/cameras/${cameraId}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // Get latest images for a unit
  getLatestImages: (unitId) => api.get(`/units/${unitId}/cameras/latest`),
};

// Settings API
export const settingsAPI = {
  // Get safe ranges
  getRanges: () => api.get('/settings/ranges'),

  // Update safe ranges
  updateRanges: (ranges) => api.post('/settings/ranges', { ranges }),

  // Clear database
  clearData: () => api.post('/settings/clear-data'),
};

// Export API
export const exportAPI = {
  // Export sensor data as CSV
  exportSensorsCsv: (params) => api.get(`/export/sensors/csv?${params}`, { responseType: 'blob' }),

  // Export camera images as ZIP
  exportImagesZip: (params) => api.get(`/export/images/zip?${params}`, { responseType: 'blob' }),
};

// Get API base URL for direct image URLs
export const getApiBaseUrl = () => API_BASE_URL;

// Utility functions
export const apiUtils = {
  // Handle API errors
  handleError: (error, defaultMessage = 'An error occurred') => {
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    if (error.message) {
      return error.message;
    }
    return defaultMessage;
  },

  // Check if API is available
  healthCheck: async () => {
    try {
      await api.get('/health');
      return true;
    } catch (error) {
      return false;
    }
  },
};

export default api;