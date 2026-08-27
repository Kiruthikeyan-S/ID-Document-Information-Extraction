# AI-Powered ID Card Information Extraction System (MERN + FastAPI Architecture)

A full-stack enterprise document extraction platform built with the **MERN Stack (MongoDB, Express.js, React, Node.js)** and a high-performance **Python FastAPI Microservice** leveraging **OpenCV, Tesseract OCR, and Groq LLM API** (`Llama 3.3 / GPT-OSS 120B`).

---

## 🚀 Architecture & Pipeline

```text
[ React Frontend (Vite) ]
          │
          │ Multipart File Upload
          ▼
[ Express.js API Gateway (:5000) ]
          │
          │ HTTP Stream Proxy
          ▼
[ Python FastAPI Microservice (:8000) ]
          │
          ├─► [ 1. Image Quality Check ] (Laplacian Variance Focus Metric)
          │
          ├─► [ 2. OpenCV Preprocessing ] (Grayscale, Glare Reducer, CLAHE Contrast)
          │
          ├─► [ 3. Tesseract OCR (PSM 11/3) ] (Bounding Boxes, Coordinates, Confidence)
          │
          └─► [ 4. PRE-LLM DECISION GATE ] ──(If non-ID document / receipt)──► [ ⚡ Short-Circuit Decline ]
                       │ (If Aadhaar / PAN / DL match)
                       ▼
              [ 5. Groq LLM Inference ] (Structured JSON extraction)
                       │
                       ▼
              [ 6. Pydantic Validation & Masking ] (Aadhaar: ********1234, PAN: AAAAA9999A)
                       │
                       ▼
          [ Return JSON + Base64 Visual Pipeline Images ]
                       │
          ┌────────────┴────────────┐
          ▼                         ▼
  [ MongoDB Database ]     [ React Visual Dashboard ]
  (Extraction History)     (Cards, Gallery, JSON Export)
```

---

## ⚡ Key Highlights & Innovations

1. **Pre-LLM Decision Gate (Cost & Latency Optimization)**:
   - Evaluates OCR text signatures *before* invoking Groq LLM.
   - Non-ID documents (e.g. receipts, invoices, random photos) are rejected cheaply by the local decision gate, **saving 100% of LLM API costs and execution latency**.
2. **Modular Microservice Architecture**:
   - Keeps Python's mature vision and OCR ecosystem (OpenCV, Tesseract, Pydantic) intact inside an isolated FastAPI service.
   - Express.js manages client routing, multipart streaming, and MongoDB history persistence.
3. **Interactive React Dashboard**:
   - Side-by-side Visual Pipeline gallery (Original, Preprocessed, Bounding Box overlay).
   - Extracted field cards with masked Aadhaar compliance.
   - MongoDB Extraction History drawer with search and one-click recall.
4. **Privacy-by-Design**:
   - Images are processed in-memory. Raw document images are never persisted to MongoDB.

---

## 📂 Project Structure

```text
ID-Document-Information-Extraction/
│
├── python_service/             # FastAPI Microservice
│   ├── main.py                 # FastAPI endpoints (POST /extract, GET /health, GET /models)
│   ├── preprocessing.py        # OpenCV enhancement & glare reduction
│   ├── ocr_engine.py           # Tesseract OCR & bounding boxes
│   ├── llm_extractor.py        # Groq API integration (Llama / GPT-OSS 120B)
│   ├── document_classifier.py  # Heuristic & Regex decision gate
│   ├── validation.py           # Pydantic & Regex post-validation
│   ├── schemas.py              # Data models
│   ├── utils.py                # Image & Base64 encoders
│   ├── requirements.txt        # Python dependencies
│   ├── .env                    # Python service secrets
│   └── Dockerfile
│
├── backend/                    # Express.js API Gateway
│   ├── src/
│   │   ├── config/db.js        # MongoDB Mongoose connection
│   │   ├── models/Document.js  # Extraction History Schema
│   │   ├── controllers/        # Proxy & CRUD controllers
│   │   ├── routes/             # /api/documents routes
│   │   └── server.js           # Server entrypoint
│   ├── package.json
│   ├── .env
│   └── Dockerfile
│
├── client/                     # React Frontend (Vite + Tailwind CSS)
│   ├── src/
│   │   ├── components/         # UploadZone, ResultsView, VisualPipeline, HistoryDrawer, etc.
│   │   ├── services/api.js     # Axios API service
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   ├── vite.config.js
│   └── Dockerfile
│
├── docker-compose.yml          # 4-Service container orchestration
├── run-dev.bat                 # One-click Windows dev runner
└── README.md
```

---

## 🛠️ Quick Start (Local Development)

### 1. Prerequisites
- **Node.js 18+** & **npm**
- **Python 3.9+** & **Tesseract OCR** (Default path: `C:\Program Files\Tesseract-OCR\tesseract.exe`)
- **MongoDB** (Optional for local development; system runs in standalone mode if MongoDB is offline)

### 2. Install Dependencies
```bash
# Python Service
cd python_service
pip install -r requirements.txt

# Express Backend
cd ../backend
npm install

# React Client
cd ../client
npm install
```

### 3. Run all services with 1-Click
On Windows:
```powershell
.\run-dev.bat
```

Or run each service manually in separate terminals:
```bash
# Terminal 1: Python FastAPI
cd python_service && python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# Terminal 2: Express Backend
cd backend && npm start

# Terminal 3: React Frontend
cd client && npm run dev
```

Open your browser at **`http://localhost:3000`**.

---

## 🐳 Running with Docker Compose

Run the entire 4-container stack (MongoDB + Python FastAPI + Express + React):
```bash
docker-compose up --build
```

Access:
- **React Frontend**: `http://localhost:3000`
- **Express Backend API**: `http://localhost:5000`
- **Python FastAPI Docs**: `http://localhost:8000/docs`
