# 🤖 Utility Bot - AI-Powered ID Document Verification & Extraction System

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI_0.110+-009688.svg?style=flat&logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/Frontend-React_18-61DAFB.svg?style=flat&logo=react)](https://react.dev)
[![OpenCV](https://img.shields.io/badge/Vision-OpenCV_4.9+-5C3EE8.svg?style=flat&logo=opencv)](https://opencv.org)
[![Tesseract OCR](https://img.shields.io/badge/OCR-Tesseract_5.5-blue.svg?style=flat)](https://github.com/tesseract-ocr/tesseract)
[![Groq LPU](https://img.shields.io/badge/LLM-Groq_LPU_(Llama_3.3_70B)-F55036.svg?style=flat)](https://groq.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Utility Bot** is a high-performance, enterprise-grade identity verification system designed to extract, validate, and authenticate Indian government-issued identity documents (**Aadhaar Card**, **PAN Card**, and **Driving Licence**) with sub-second latency and bank-grade accuracy.

---

## 📑 Table of Contents
- [Architecture & Pipeline](#-architecture--pipeline)
- [Key Features & Innovations](#-key-features--innovations)
- [How It Works (Step-by-Step)](#-how-it-works-step-by-step)
- [30-Day Retention & Storage Architecture](#-30-day-retention--storage-architecture)
- [Fraud & Duplicate Card Detection](#-fraud--duplicate-card-detection)
- [Tech Stack](#-tech-stack)
- [API Reference](#-api-reference)
- [Getting Started](#-getting-started)

---

## 📊 Architecture & Pipeline

Utility Bot runs on a streamlined **2-Tier Architecture** connecting a **React 18 Light Dashboard** directly to an asynchronous **Python FastAPI Backend**:

```text
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                               STAGE 1: REACT 18 WEB CLIENT (:5173)                               │
│  • Clean Light Theme Dashboard                                                                   │
│  • Instant client-side MIME validation & thumbnail preview (URL.createObjectURL)                 │
└────────────────────────────────────────────────┬─────────────────────────────────────────────────┘
                                                 │ Direct HTTP POST (Multipart Image Form-Data)
                                                 ▼
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                             STAGE 2: PYTHON FASTAPI BACKEND (:8000)                              │
│  • In-Memory Buffer (RAM only - Zero permanent raw image saving on disk for data privacy)        │
│  • High-throughput async request handler at /extract                                             │
└────────────────────────────────────────────────┬─────────────────────────────────────────────────┘
                                                 │
                                                 ▼
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                         STAGE 3: OPENCV COMPUTER VISION PREPROCESSING                            │
│  • Laplacian Focus Variance Check (Var(∇²I) ≥ 100) - rejects blurred images                      │
│  • Glare Reduction: removes flash specular reflections from plastic laminated cards             │
│  • CLAHE Contrast: adaptive histogram equalization for faint watermarks and text                │
│  • Bilateral Denoising: preserves sharp font edges while removing camera sensor noise            │
└────────────────────────────────────────────────┬─────────────────────────────────────────────────┘
                                                 │ Cleaned High-Contrast Image Matrix
                                                 ▼
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                            STAGE 4: LOCAL SPATIAL TESSERACT OCR                                  │
│  • PSM Mode 11 (Sparse Text): captures multi-column layouts, photos, chips, and seals            │
│  • Extracts Word Tokens + 2D Coordinates (x, y, w, h) + Confidence Scores (%)                    │
│  • Generates Color-Coded Bounding Boxes (Green >75%, Orange 50-75%, Yellow <50%)                 │
└────────────────────────────────────────────────┬─────────────────────────────────────────────────┘
                                                 │ Raw Text + 2D Spatial Layout Tokens
                                                 ▼
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                          STAGE 5: PRE-LLM HEURISTIC DECISION GATE                                │
│  • Evaluates Indian ID signatures (UIDAI, Income Tax Department, Form 7)                         │
│  • Differentiates Front vs Back sides (Aadhaar Back, PAN Back, DL Back)                          │
└──────────────────┬──────────────────────────────────────────────────┬────────────────────────────┘
                   │                                                  │
                   │ ❌ Non-ID / Receipt Detected                      │ ✅ Valid ID Match (Front or Back)
                   ▼                                                  ▼
   ┌───────────────────────────────┐          ┌────────────────────────────────────────────────────┐
   │   ⚡ SHORT-CIRCUIT DECLINE    │          │            STAGE 6: GROQ AI REASONING              │
   │   • Skips Groq API entirely   │          │  • Model: llama-3.3-70b-versatile (~600 tokens/s)  │
   │   • 0 Cloud Tokens Burned     │          │  • Strict JSON Mode at temperature 0.0             │
   │   • Instant <0.2s rejection   │          │  • Auto-fallback to llama-3.1-8b-instant           │
   │   • Status: 'unsupported'     │          │  • Resolves bilingual Hindi/English PAN labels     │
   └───────────────┬───────────────┘          └───────────────────────┬────────────────────────────┘
                   │                                                  │
                   │                                                  │ Raw JSON Payload
                   │                                                  ▼
                   │                          ┌────────────────────────────────────────────────────┐
                   │                          │        STAGE 7: VALIDATION & PRIVACY LAYER         │
                   │                          │  • Aadhaar Masking: '3393 3245 7645' ➔ '********7645'│
                   │                          │  • Verhoeff Checksum: mathematical Aadhaar check   │
                   │                          │  • Duplicate Watermark Scanner (Duplicate/Sample)  │
                   │                          │  • Date ISO Normalization: 'DD/MM/YYYY' ➔ 'YYYY-MM-DD'│
                   │                          │  • PAN Regex & Tax Entity Check: [A-Z]{5}[0-9]{4}[A-Z]│
                   │                          └───────────────────────┬────────────────────────────┘
                   │                                                  │
                   └──────────────────────────┬───────────────────────┘
                                              │ Validated JSON + Base64 Visual Gallery (~60KB)
                                              ▼
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                            STAGE 8: 30-DAY RETENTION STORE & DASHBOARD                           │
│   ┌───────────────────────────────────────────────┐  ┌────────────────────────────────────────┐  │
│   │            30-DAY RETENTION STORE             │  │          REACT LIGHT DASHBOARD         │  │
│   │  • MongoDB / Local JSON storage               │  │  • Extracted Details Cards             │  │
│   │  • 30-Day TTL auto-expiry policy              │  │  • Document Photo Preview Thumbnail    │  │
│   │  • Stored Base64 photo thumbnail (~40KB)      │  │  • 3-Stage Visual Pipeline Gallery     │  │
│   │  • Storage usage meter & 1-click purge button │  │  • Structured JSON Viewer & Export     │  │
│   └───────────────────────────────────────────────┘  └────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## ⚡ Key Features & Innovations

1. **⚡ Sub-Second AI Extraction (< 1.2s)**:
   - Powered by **Groq LPU** running `llama-3.3-70b-versatile` at ~600 tokens/second.
   - Built-in multi-model auto-fallback (`llama-3.1-8b-instant`, `gpt-oss-120b`) ensures zero timeouts.

2. **💰 100% Free of Cost ($0.00)**:
   - OpenCV and Tesseract run locally with $0.00 compute costs.
   - Pre-LLM Decision Gate rejects non-IDs locally in 0.2s without spending cloud tokens.

3. **🔄 Intelligent Front & Back Side Handling**:
   - **🆔 Aadhaar Back**: Automatically extracts **Full Residential Address**, **C/O (Guardian/Spouse)**, **Pincode**, and **State**.
   - **💳 PAN Back**: Detects barcode/disclaimer side and displays a helpful prompt: *"Please flip card and upload FRONT side"*.
   - **🚗 DL Back**: Extracts **Authorised Vehicle Categories** (`LMV`, `MCWG`, `TRANS`) and permanent address.

4. **🛡️ Fake & Duplicate Card Detection**:
   - Scans for `DUPLICATE`, `DIGITAL CARD COPY`, `SAMPLE`, `SPECIMEN`, and `DUMMY` watermarks.
   - Verifies 12-digit Aadhaar numbers against the official **Verhoeff Dihedral Group Algorithm**.
   - Validates PAN 4th character tax entity codes (`P` = Individual, `C` = Company, `F` = Firm).

5. **⏳ 30-Day Auto-Retention Policy (TTL Storage)**:
   - Every verification entry is stamped with `expiresAt = createdAt + 30 days`.
   - Stored with an optimized **Base64 photo thumbnail (~40KB)**.
   - Auto-purges expired records to keep database storage clean and lightweight.

6. **🔒 Privacy by Design**:
   - Raw full-sized images are processed in RAM memory and **never written to the server's hard drive**.
   - Aadhaar numbers are automatically masked (`********7645`).

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend UI** | **React 18 + Vite + Tailwind CSS** | Clean Light Theme, drag-and-drop upload, visual pipeline, history drawer |
| **Backend API** | **Python FastAPI (Async)** | In-memory stream processing, CORS, REST endpoints |
| **Computer Vision** | **OpenCV 4.9+** | Blur detection (Laplacian variance), glare reduction, CLAHE contrast |
| **OCR Engine** | **Tesseract OCR (PSM 11)** | Spatial word tokenization, bounding box coordinates $(x, y, w, h)$, confidence % |
| **AI Extraction** | **Groq LPU (`llama-3.3-70b-versatile`)** | Semantic field extraction, bilingual Hindi/English label parsing |
| **Validation** | **Pydantic v2 + Regex** | Data typing, Aadhaar masking, Verhoeff checksum, ISO date normalization |
| **Storage** | **MongoDB / Local JSON Store** | 30-day TTL auto-retention, photo thumbnail persistence |

---

## 📡 API Reference

### 1. Document Extraction
* **Endpoint**: `POST /extract`
* **Content-Type**: `multipart/form-data`
* **Parameters**:
  * `file`: ID Document Image (`.jpg`, `.jpeg`, `.png`)
  * `model_name` *(optional)*: Groq model name (default: `llama-3.3-70b-versatile`)
  * `min_confidence` *(optional)*: OCR threshold (default: `25.0`)
  * `psm_mode` *(optional)*: Tesseract PSM mode (default: `11`)
  * `enable_glare` *(optional)*: Glare removal toggle (default: `true`)
  * `enable_clahe` *(optional)*: Contrast enhancement toggle (default: `true`)

**Response Example (Aadhaar Card)**:
```json
{
  "id": "doc_1724838421_a3f91b",
  "document_type": "aadhaar",
  "is_valid": true,
  "short_circuited": false,
  "is_duplicate_or_sample": false,
  "authenticity_status": "VERIFIED",
  "data": {
    "document_type": "aadhaar",
    "name": "S Kiruthikeyan",
    "date_of_birth": "2004-11-18",
    "gender": "Male",
    "aadhaar_number": "********7645",
    "address": null
  },
  "warnings": [],
  "ocr_confidence": 84.5,
  "images": {
    "original": "data:image/jpeg;base64,...",
    "preprocessed": "data:image/jpeg;base64,...",
    "annotated": "data:image/jpeg;base64,..."
  }
}
```

### 2. History & Storage Endpoints
* `GET /history`: List past verified applicant records (with 30-day retention).
* `GET /history/{id}`: Retrieve single verification record.
* `DELETE /history/{id}`: Delete record.
* `GET /storage/stats`: Returns storage usage (KB/MB), record count, and capacity percentage.
* `POST /storage/clean?force_all=false`: Purges expired records (>30 days).
* `GET /health`: Health check reporting Tesseract OCR and backend status.
* `GET /models`: Returns available Groq AI chat completion models.

---

## 🚀 Getting Started

### 1. Prerequisites
* **Python 3.9+**
* **Node.js 18+** & **npm**
* **Tesseract OCR 5.0+**
  * Windows: Download installer from [UB-Mannheim/tesseract](https://github.com/UB-Mannheim/tesseract/wiki) (Default: `C:\Program Files\Tesseract-OCR\tesseract.exe`)
  * Linux: `sudo apt install tesseract-ocr`
  * macOS: `brew install tesseract`

### 2. Configuration
Create a `.env` file in `python_service/.env`:
```env
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama-3.3-70b-versatile
```

### 3. Installation
```bash
# 1. Install Backend Dependencies
cd python_service
pip install -r requirements.txt

# 2. Install Frontend Dependencies
cd ../client
npm install
```

### 4. Run Development Servers (1-Click on Windows)
Simply double-click:
```powershell
run-dev.bat
```

Or run manually in separate terminals:
```bash
# Terminal 1: Python FastAPI Backend
cd python_service
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# Terminal 2: React Frontend Client
cd client
npm run dev
```

Open your browser at: **`http://localhost:5173`**

---

## 🐳 Docker Deployment

Run the entire stack with Docker Compose:
```bash
export GROQ_API_KEY="your_groq_api_key_here"
docker-compose up --build
```
* **React Client**: `http://localhost:5173`
* **FastAPI Docs**: `http://localhost:8000/docs`

---

## 📄 License
Distributed under the **MIT License**. See `LICENSE` for more information.
