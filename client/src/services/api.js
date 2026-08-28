import axios from 'axios';

// Connect directly to Python FastAPI backend on port 8000 (with CORS enabled)
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * Generates or retrieves a persistent Unique Device ID for user isolation.
 */
export const getDeviceId = () => {
  let deviceId = localStorage.getItem('utility_bot_device_id');
  if (!deviceId) {
    deviceId = `dev_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem('utility_bot_device_id', deviceId);
  }
  return deviceId;
};

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 120000,
});

// Attach Device ID to EVERY outgoing request for strict user data privacy
api.interceptors.request.use((config) => {
  const deviceId = getDeviceId();
  config.headers['X-Device-Id'] = deviceId;
  return config;
});

/**
 * Uploads ID document image directly to Python FastAPI backend.
 */
export const extractDocumentApi = async (file, settings = {}) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('deviceId', getDeviceId());

  Object.entries(settings).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      formData.append(key, value);
    }
  });

  const response = await api.post('/extract', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};

/**
 * Retrieves extraction history list for the active device.
 */
export const getHistoryApi = async (params = {}) => {
  const queryParams = typeof params === 'object' ? params : { page: 1, limit: 50 };
  queryParams.deviceId = getDeviceId();
  const response = await api.get('/history', { params: queryParams });
  return response.data;
};

/**
 * Retrieves single extraction record by ID.
 */
export const getDocumentByIdApi = async (id) => {
  const response = await api.get(`/history/${id}`);
  return response.data;
};

/**
 * Deletes extraction record by ID.
 */
export const deleteDocumentApi = async (id) => {
  const response = await api.delete(`/history/${id}`);
  return response.data;
};

export const deleteHistoryApi = deleteDocumentApi;

/**
 * Fetches available Groq models from Python FastAPI backend.
 */
export const getModelsApi = async () => {
  const response = await api.get('/models');
  return response.data;
};

/**
 * Checks system health status.
 */
export const getHealthApi = async () => {
  const response = await api.get('/health');
  return response.data;
};

/**
 * Retrieves storage usage statistics (30-day retention) for active device.
 */
export const getStorageStatsApi = async () => {
  const response = await api.get('/storage/stats');
  return response.data;
};

/**
 * Triggers storage cleanup / purge for active device.
 */
export const cleanStorageApi = async (forceAll = false) => {
  const response = await api.post(`/storage/clean?force_all=${forceAll}`);
  return response.data;
};
