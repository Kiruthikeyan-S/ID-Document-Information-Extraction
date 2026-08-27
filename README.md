# AI-Powered ID Card Information Extraction System (React + FastAPI Architecture)

A modern full-stack document extraction platform built with a **React 18 Frontend** and a high-performance **Python FastAPI Backend** leveraging **OpenCV, Tesseract OCR, Pre-LLM Decision Gate, and Groq LLM API** (`openai/gpt-oss-120b` / `Llama 3.3`).

---

## 🚀 Architecture & Pipeline

```text
[ React Frontend (Vite :5173) ]
          │
          │ Direct HTTP Multipart Upload
          ▼
[ Python FastAPI Backend (:8000) ]
          │
          ├─► [ 1. Image Quality Check ] (Laplacian Variance Focus Metric)
          │
          ├─► [ 2. OpenCV Preprocessing ] (Grayscale, Glare Reducer, CLAHE Contrast)
          │
          ├─► [ 3. Tesseract OCR (PSM 11) ] (Word Coordinates, Bounding Boxes, Confidence)
          │
          └─► [ 4. PRE-LLM DECISION GATE ] ──(If non-ID / receipt)──► [ ⚡ Short-Circuit Decline ]
                       │ (If Aadhaar / PAN / DL match)
                       ▼
              [ 5. Groq LLM Inference ] (Structured JSON extraction)
                       │
                       ▼
              [ 6. Pydantic Validation & Masking ] (Aadhaar: ********7645, PAN: ABCDE1234F)
                       │
                       ▼
          [ Return JSON + Base64 Visual Gallery (~60KB) ]
                       │
          ┌────────────┴────────────┐
          ▼                         ▼
  [ History Store ]         [ React Light Dashboard ]
  (FastAPI Persistence)     (Cards, Gallery, JSON Export)
```

---

## ⚡ Key Highlights & Innovations

1. **Direct React ➔ FastAPI Architecture**:
   - Clean, lightweight 2-tier design with zero intermediate proxy bottlenecks.
   - Built-in history persistence and REST API.
2. **Pre-LLM Decision Gate (Cost & Latency Optimization)**:
   - Evaluates OCR text signatures *before* calling Groq LLM.
   - Non-ID documents (e.g. receipts, invoices) are rejected locally in $<0.5$s, **saving 100% of LLM API costs**.
3. **Interactive Light Theme Dashboard**:
   - Side-by-side Visual Pipeline gallery (Original, Preprocessed, Bounding Box overlay).
   - Extracted field cards with masked Aadhaar compliance.
   - Persistent History Drawer with search and one-click recall.
4. **Privacy-by-Design**:
   - Images are processed in-memory. Raw document images are never saved to disk.

---

## 📂 Project Structure

```text
ID-Document-Information-Extraction/
│
├── python_service/             # FastAPI Backend Service
│   ├── main.py                 # REST endpoints (/extract, /history, /models, /health)
│   ├── storage.py              # Persistent history storage
│   ├── preprocessing.py        # OpenCV enhancement & glare reduction
│   ├── ocr_engine.py           # Tesseract OCR & bounding boxes
│   ├── llm_extractor.py        # Groq API integration (Llama / GPT-OSS 120b)
│   ├── document_classifier.py  # Heuristic & regex decision gate
│   ├── validation.py           # Pydantic & regex post-validation
│   ├── schemas.py              # Data models
│   ├── utils.py                # Image & Base64 encoders
│   ├── requirements.txt        # Python dependencies
│   ├── .env                    # Python service secrets
│   └── Dockerfile
│
├── client/                     # React Frontend (Vite + Tailwind CSS)
│   ├── src/
│   │   ├── components/         # UploadZone, ResultsView, VisualPipeline, HistoryDrawer, etc.
│   │   ├── services/api.js     # Axios API client
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   ├── vite.config.js
│   └── Dockerfile
│
├── docker-compose.yml          # Container orchestration (FastAPI + React)
├── run-dev.bat                 # One-click Windows dev runner
└── README.md
```

---

## 🛠️ Quick Start (Local Development)

### 1. Prerequisites
* **Node.js 18+** & **npm**
* **Python 3.9+** & **Tesseract OCR** (Default path: `C:\Program Files\Tesseract-OCR\tesseract.exe`)

### 2. Install Dependencies
```bash
# Python Backend
cd python_service
pip install -r requirements.txt

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
# Terminal 1: Python FastAPI Backend
cd python_service && python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# Terminal 2: React Frontend Client
cd client && npm run dev
```

Open your browser at **`http://localhost:5173`**.
