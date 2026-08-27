const express = require('express');
const multer = require('multer');
const {
  extractDocument,
  getDocuments,
  getDocumentById,
  deleteDocument,
  getModels,
} = require('../controllers/documentController');

const router = express.Router();

// Memory storage for multer so we can stream buffer directly to Python microservice
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 15 * 1024 * 1024, // 15 MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPG, JPEG, PNG) are allowed.'), false);
    }
  },
});

// Routes
router.post('/extract', upload.single('file'), extractDocument);
router.get('/', getDocuments);
router.get('/models', getModels);
router.get('/:id', getDocumentById);
router.delete('/:id', deleteDocument);

module.exports = router;
