# 🤖 Utility Bot - AI-Powered ID Document Verification System

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI_0.110+-009688.svg?style=flat&logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/Frontend-React_18-61DAFB.svg?style=flat&logo=react)](https://react.dev)
[![OpenCV](https://img.shields.io/badge/Vision-OpenCV_4.9+-5C3EE8.svg?style=flat&logo=opencv)](https://opencv.org)
[![Tesseract OCR](https://img.shields.io/badge/OCR-Tesseract_5.5-blue.svg?style=flat)](https://github.com/tesseract-ocr/tesseract)
[![Groq LPU](https://img.shields.io/badge/LLM-Groq_LPU_(Llama_3.3_70B)-F55036.svg?style=flat)](https://groq.com)
[![MongoDB Atlas](https://img.shields.io/badge/Database-MongoDB_Atlas_Cloud-47A248.svg?style=flat&logo=mongodb)](https://www.mongodb.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Utility Bot** is an automated identity verification engine that extracts, validates, and authenticates Indian government ID cards (**Aadhaar Card**, **PAN Card**, and **Driving Licence**) in **< 1.2 seconds** with strict per-user privacy isolation and MongoDB Cloud persistence.

---

## 📊 Complete System Pipeline (Frontend + Backend in One Box)

```text
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                         UTILITY BOT UNIFIED ARCHITECTURE PIPELINE                                │
├──────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                  │
│  1. User Opens Browser (:5173)                                                                   │
│     └── Fixed in localStorage ➔ Device ID: "dev_mtcqjgy8_gr4nils"                                │
│              │                                                                                   │
│              ▼                                                                                   │
│  2. User Uploads Aadhaar / PAN / Driving Licence Photo (up to 48 MP / 10 MB)                      │
│     └── React attaches `X-Device-Id: dev_mtcqjgy8_gr4nils` to the multipart upload request       │
│              │                                                                                   │
│              ▼ (Direct HTTP POST to FastAPI Backend on Port 8000)                                 │
│  3. FastAPI Backend Extracts Data in RAM Memory                                                  │
│     ├── In-Memory Buffer (io.BytesIO - Zero raw images saved to hard disk for strict privacy)   │
│     ├── OpenCV Vision Preprocessing (Laplacian blur check ≥ 100, glare removal, CLAHE contrast) │
│     ├── Local Spatial Tesseract OCR (PSM 11 sparse text mode, word tokens + x,y,w,h coordinates) │
│     ├── Pre-LLM Decision Gate (UIDAI, Income Tax signatures) ──► Rejects Non-IDs in <0.2s ($0)  │
│     ├── Groq AI Reasoning Engine (Llama 3.3 70B on LPU, ~600 tokens/sec, strict JSON, temp 0.0) │
│     ├── Validation & Privacy Layer (Aadhaar masking ********7645, Verhoeff checksum, ISO dates) │
│     └── Compresses card photo into a lightweight ~40KB Base64 photo thumbnail                    │
│              │                                                                                   │
│              ▼                                                                                   │
│  4. Saved Directly to MongoDB Atlas (`utility_bot.verifications` & history.json)                 │
│     └── Stored with `deviceId: "dev_mtcqjgy8_gr4nils"` and `expiresAt: +30 days` (TTL Auto-Purge)│
│              │                                                                                   │
│              ▼                                                                                   │
│  5. User Clicks "Applicant History" Drawer                                                       │
│     └── MongoDB queries ONLY records matching `deviceId == "dev_mtcqjgy8_gr4nils"`               │
│         (Other users and browsers cannot see these documents!)                                   │
│                                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔤 Master Glossary of Full Forms

| Short Form | Full Form | Meaning & Purpose |
| :--- | :--- | :--- |
| **API** | **A**pplication **P**rogramming **I**nterface | Connects React frontend to Python backend over HTTP. |
| **MIME** | **M**ultipurpose **I**nternet **M**ail **E**xtensions | Standard internet file type indicator (`image/jpeg`, `image/png`). |
| **URL** | **U**niform **R**esource **L**ocator | Web address or object link (`http://localhost:5173`). |
| **RAM** | **R**andom **A**ccess **M**emory | Fast temporary memory where images are processed in-memory. |
| **I/O** | **I**nput / **O**utput | Reading and writing data streams. |
| **OpenCV** | **Open** Source **C**omputer **V**ision Library | Image processing library for blur check, glare removal, and contrast. |
| **BGR** | **B**lue, **G**reen, **R**ed | 3-channel color matrix format used by OpenCV. |
| **CLAHE** | **C**ontrast **L**imited **A**daptive **H**istogram **E**qualization | Tile-based contrast booster for faint, shadow-covered text. |
| **OCR** | **O**ptical **C**haracter **R**ecognition | Converts card image pixels into editable text. |
| **PSM** | **P**age **S**egmentation **M**ode | Layout detection mode in Tesseract (Mode 11 = Sparse Text). |
| **OEM** | **O**CR **E**ngine **M**ode | Neural network mode in Tesseract (Mode 3 = LSTM Engine). |
| **LLM** | **L**arge **L**anguage **M**odel | AI reasoning model (`Llama 3.3 70B`). |
| **LLaMA** | **L**arge **L**anguage **M**odel **M**eta **A**I | Meta's open-weights foundation AI model. |
| **LPU** | **L**anguage **P**rocessing **U**nit | Groq's custom high-speed hardware accelerator (~600 tokens/s). |
| **JSON** | **J**ava**S**cript **O**bject **N**otation | Structured lightweight data format used across APIs. |
| **ISO** | **I**nternational **O**rganization for **S**tandardization | Standard date format (`YYYY-MM-DD`). |
| **PII** | **P**ersonally **I**dentifiable **I**nformation | Sensitive personal data (masked for privacy). |
| **TTL** | **T**ime **T**o **L**ive | Automated expiration countdown (30-day retention). |
| **UIDAI** | **U**nique **I**dentification **A**uthority of **I**ndia | Official issuing authority of Aadhaar cards. |
| **PAN** | **P**ermanent **A**ccount **N**umber | 10-digit tax identifier issued by Income Tax Department. |
| **DL** | **D**riving **L**icence | Official motor vehicle permit. |
| **MP** | **M**ega**p**ixel | Resolution ($1\text{ MP} = 1,000,000\text{ pixels}$). |
| **KB / MB** | **K**ilo**b**yte / **M**ega**b**yte | Digital storage units ($1\text{ MB} = 1024\text{ KB}$). |

---

## ⚡ Key Highlights

1. **⚡ Fast AI Extraction (< 1.2s)**: Powered by `Llama 3.3 70B` on Groq LPU running at ~600 tokens/second.
2. **🔒 Strict Data Privacy**: Images are processed directly in RAM memory (`io.BytesIO`) — zero raw photos saved on server disk.
3. **🛡️ Real Device Privacy Isolation**: Fixed Device ID in `localStorage` ensures each applicant only sees their own verification history.
4. **🚨 Fake Card Detection**: Scans for `DUPLICATE / SAMPLE / SPECIMEN` watermarks and runs mathematical **Verhoeff checksums** on Aadhaar numbers.
5. **⏳ 30-Day Auto-Retention in MongoDB Atlas**: Stored in **MongoDB Atlas Cloud (`utility_bot.verifications`)** and `history.json` with a 30-day TTL auto-purge policy and compressed photo thumbnails (~40KB).

---

## 🚀 How to Run the App (Quickstart)

### 🌟 1-Click Startup (Windows)
Double-click:
```cmd
run-dev.bat
```

### 💻 Manual Startup (From Root Folder)
```powershell
# Start React Frontend (Port 5173)
npm run dev

# Start FastAPI Backend (Port 8000)
npm run server
```

Open your browser at: **[http://localhost:5173/](http://localhost:5173/)**

---

## 📄 License
Distributed under the **MIT License**.
