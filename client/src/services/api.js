import axios from 'axios';

const API_BASE = '/api';

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 120000,
});

/**
 * Uploads ID document image to backend with configuration parameters.
 */
export const extractDocumentApi = async (file, settings = {}) => {
  const formData = new FormData();
  formData.append('file', file);

  Object.entries(settings).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      formData.append(key, value);
    }
  });

  const response = await api.post('/documents/extract', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};

/**
 * Retrieves extraction history list from MongoDB.
 */
export const getHistoryApi = async (page = 1, limit = 20, type = '') => {
  const params = { page, limit };
  if (type) params.type = type;
  const response = await api.get('/documents', { params });
  return response.data;
};

/**
 * Retrieves single extraction record by ID.
 */
export const getDocumentByIdApi = async (id) => {
  const response = await api.get(`/documents/${id}`);
  return response.data;
};

/**
 * Deletes extraction record by ID.
 */
export const deleteDocumentApi = async (id) => {
  const response = await api.delete(`/documents/${id}`);
  return response.data;
};

/**
 * Fetches available Groq models from backend.
 */
export const getModelsApi = async () => {
  const response = await api.get('/documents/models');
  return response.data;
};

/**
 * Checks system health status.
 */
export const getHealthApi = async () => {
  const response = await api.get('/health');
  return response.data;
};
