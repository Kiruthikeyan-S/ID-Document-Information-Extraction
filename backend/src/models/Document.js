const mongoose = require('mongoose');

const DocumentSchema = new mongoose.Schema(
  {
    documentType: {
      type: String,
      required: true,
      enum: ['aadhaar', 'pan', 'driving_licence', 'unsupported'],
      index: true,
    },
    isValid: {
      type: Boolean,
      default: true,
    },
    shortCircuited: {
      type: Boolean,
      default: false,
      description: 'True if rejected early by the Pre-LLM Decision Gate',
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    warnings: {
      type: [String],
      default: [],
    },
    ocrConfidence: {
      type: Number,
      default: 0.0,
    },
    qualityReport: {
      blur_score: Number,
      is_blurry: Boolean,
      width: Number,
      height: Number,
      is_too_small: Boolean,
    },
    rawOcrText: {
      type: String,
      default: '',
    },
    originalFileName: {
      type: String,
      default: 'uploaded_document.jpg',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Document', DocumentSchema);
