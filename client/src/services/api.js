import axios from 'axios';

// Connect directly to Python FastAPI backend on port 8000 (with CORS enabled)
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 120000,
});

/**
 * Uploads ID document image directly to Python FastAPI backend.
 */
export const extractDocumentApi = async (file, settings = {}) => {
  const formData = new FormData();
  formData.append('file', file);

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
 * Retrieves extraction history list.
 */
export const getHistoryApi = async (params = {}) => {
  const queryParams = typeof params === 'object' ? params : { page: 1, limit: 50 };
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
 * Retrieves storage usage statistics (30-day retention).
 */
export const getStorageStatsApi = async () => {
  const response = await api.get('/storage/stats');
  return response.data;
};

/**
 * Triggers storage cleanup / purge.
 */
export const cleanStorageApi = async (forceAll = false) => {
  const response = await api.post(`/storage/clean?force_all=${forceAll}`);
  return response.data;
};
