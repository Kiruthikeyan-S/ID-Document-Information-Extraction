const axios = require('axios');
const FormData = require('form-data');
const {
  saveExtraction,
  getExtractions,
  getExtractionById,
  deleteExtraction,
} = require('../services/storageService');
const { getIsConnected } = require('../config/db');

const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000';

/**
 * Extracts information from an uploaded ID document image.
 * Proxies upload to Python FastAPI service, evaluates result, and saves to database.
 */
exports.extractDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded.' });
    }

    const formData = new FormData();
    formData.append('file', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });

    // Append optional parameters if provided by client
    const {
      min_confidence,
      psm_mode,
      enable_glare,
      enable_clahe,
      enable_denoise,
      enable_threshold,
      threshold_method,
      model_name,
      groq_api_key,
    } = req.body;

    if (min_confidence !== undefined) formData.append('min_confidence', String(min_confidence));
    if (psm_mode !== undefined) formData.append('psm_mode', String(psm_mode));
    if (enable_glare !== undefined) formData.append('enable_glare', String(enable_glare));
    if (enable_clahe !== undefined) formData.append('enable_clahe', String(enable_clahe));
    if (enable_denoise !== undefined) formData.append('enable_denoise', String(enable_denoise));
    if (enable_threshold !== undefined) formData.append('enable_threshold', String(enable_threshold));
    if (threshold_method !== undefined) formData.append('threshold_method', String(threshold_method));
    if (model_name) formData.append('model_name', model_name);
    if (groq_api_key) formData.append('groq_api_key', groq_api_key);

    console.log(`[Express] Forwarding document '${req.file.originalname}' to Python FastAPI service at ${PYTHON_SERVICE_URL}/extract...`);

    // Call Python FastAPI microservice
    const pythonResponse = await axios.post(`${PYTHON_SERVICE_URL}/extract`, formData, {
      headers: {
        ...formData.getHeaders(),
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      timeout: 120000,
    });

    const result = pythonResponse.data;

    // Persist extraction record
    const savedDocId = await saveExtraction({
      documentType: result.document_type || 'unsupported',
      isValid: result.is_valid !== undefined ? result.is_valid : true,
      shortCircuited: result.short_circuited || false,
      data: result.data || {},
      warnings: result.warnings || [],
      ocrConfidence: result.ocr_confidence || 0.0,
      qualityReport: result.quality_report || {},
      rawOcrText: result.raw_ocr_text || '',
      originalFileName: req.file.originalname,
    });

    return res.status(200).json({
      ...result,
      _id: savedDocId,
    });
  } catch (error) {
    console.error('[Express] Extraction Error:', error.response?.data || error.message);
    const statusCode = error.response?.status || 500;
    const errorMessage = error.response?.data?.detail || error.message || 'Failed to extract document information.';
    return res.status(statusCode).json({ error: errorMessage });
  }
};

/**
 * Retrieves past document extractions history.
 */
exports.getDocuments = async (req, res) => {
  try {
    const { limit = 50, page = 1, type } = req.query;
    const query = type ? { documentType: type } : {};

    const historyData = await getExtractions(query, page, limit);

    return res.status(200).json({
      ...historyData,
      database_connected: getIsConnected(),
    });
  } catch (error) {
    console.error('[Express] Get Documents Error:', error.message);
    return res.status(500).json({ error: 'Failed to retrieve document history.' });
  }
};

/**
 * Retrieves single document details by ID.
 */
exports.getDocumentById = async (req, res) => {
  try {
    const doc = await getExtractionById(req.params.id);
    if (!doc) {
      return res.status(404).json({ error: 'Document not found.' });
    }
    return res.status(200).json(doc);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Deletes document record by ID.
 */
exports.deleteDocument = async (req, res) => {
  try {
    const success = await deleteExtraction(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Document not found.' });
    }
    return res.status(200).json({ message: 'Document deleted successfully.', id: req.params.id });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Proxies available Groq models from Python service.
 */
exports.getModels = async (req, res) => {
  try {
    const pythonResponse = await axios.get(`${PYTHON_SERVICE_URL}/models`, {
      params: req.query,
      timeout: 5000,
    });
    return res.status(200).json(pythonResponse.data);
  } catch (error) {
    return res.status(200).json({
      status: 'fallback',
      models: [
        'openai/gpt-oss-120b',
        'openai/gpt-oss-20b',
        'qwen/qwen3.6-27b',
        'groq/compound-mini',
        'llama-3.3-70b-versatile',
      ],
    });
  }
};
