const fs = require('fs');
const path = require('path');
const Document = require('../models/Document');
const { getIsConnected } = require('../config/db');

const DATA_DIR = path.join(__dirname, '../../data');
const HISTORY_FILE = path.join(DATA_DIR, 'history.json');

// Ensure data directory and file exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

if (!fs.existsSync(HISTORY_FILE)) {
  fs.writeFileSync(HISTORY_FILE, JSON.stringify([]), 'utf-8');
}

const readLocalHistory = () => {
  try {
    const raw = fs.readFileSync(HISTORY_FILE, 'utf-8');
    return JSON.parse(raw) || [];
  } catch (e) {
    return [];
  }
};

const writeLocalHistory = (data) => {
  try {
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error('[StorageService] Error writing to history.json:', e);
  }
};

/**
 * Saves extraction result either to MongoDB or fallback JSON store.
 */
exports.saveExtraction = async (docData) => {
  // If MongoDB is connected
  if (getIsConnected()) {
    try {
      const newDoc = new Document(docData);
      const saved = await newDoc.save();
      console.log(`[MongoDB] Saved extraction record ID: ${saved._id}`);
      return saved._id.toString();
    } catch (err) {
      console.warn(`[MongoDB] Save failed, falling back to local store: ${err.message}`);
    }
  }

  // Fallback local JSON storage
  const localList = readLocalHistory();
  const id = 'local_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
  const record = {
    _id: id,
    documentType: docData.documentType,
    isValid: docData.isValid,
    shortCircuited: docData.shortCircuited || false,
    data: docData.data || {},
    warnings: docData.warnings || [],
    ocrConfidence: docData.ocrConfidence || 0,
    qualityReport: docData.qualityReport || {},
    rawOcrText: docData.rawOcrText || '',
    originalFileName: docData.originalFileName || 'document.jpg',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  localList.unshift(record);
  // Keep last 100 records
  if (localList.length > 100) localList.pop();
  writeLocalHistory(localList);

  console.log(`[Storage] Saved extraction record to local history store ID: ${id}`);
  return id;
};

/**
 * Retrieves past extraction records.
 */
exports.getExtractions = async (query = {}, page = 1, limit = 50) => {
  if (getIsConnected()) {
    try {
      const documents = await Document.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit));

      const total = await Document.countDocuments(query);
      return { documents, total, page: parseInt(page), pages: Math.ceil(total / limit), source: 'mongodb' };
    } catch (err) {
      console.warn(`[MongoDB] Query failed, falling back to local store: ${err.message}`);
    }
  }

  // Local JSON fallback
  let localList = readLocalHistory();
  if (query.documentType) {
    localList = localList.filter((d) => d.documentType === query.documentType);
  }

  const total = localList.length;
  const start = (page - 1) * limit;
  const paginated = localList.slice(start, start + parseInt(limit));

  return {
    documents: paginated,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / limit) || 1,
    source: 'local_storage',
  };
};

/**
 * Retrieves a single extraction record by ID.
 */
exports.getExtractionById = async (id) => {
  if (getIsConnected()) {
    try {
      const doc = await Document.findById(id);
      if (doc) return doc;
    } catch (err) {}
  }

  const localList = readLocalHistory();
  return localList.find((d) => d._id === id) || null;
};

/**
 * Deletes extraction record by ID.
 */
exports.deleteExtraction = async (id) => {
  if (getIsConnected()) {
    try {
      const doc = await Document.findByIdAndDelete(id);
      if (doc) return true;
    } catch (err) {}
  }

  let localList = readLocalHistory();
  const initialLength = localList.length;
  localList = localList.filter((d) => d._id !== id);
  if (localList.length !== initialLength) {
    writeLocalHistory(localList);
    return true;
  }
  return false;
};
