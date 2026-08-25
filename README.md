# AI-Powered ID Card Information Extraction System

An intelligent document information extraction pipeline built with **Python**, **OpenCV**, **Tesseract OCR**, and **Groq LLM API** (`Llama 3.3 / 3.1`). The system accurately processes Indian identity documents (**Aadhaar Card**, **PAN Card**, and **Driving Licence**), detects text bounding boxes with confidence scores, extracts key entity fields via LLM reasoning, validates data formats with Pydantic & Regex, and returns clean, structured JSON.

---

## 🚀 Architecture & Pipeline

```text
Upload Image (JPG / JPEG / PNG)
              │
              ▼
   Image Quality & Blur Check (Laplacian Variance)
              │
              ▼
   OpenCV Preprocessing (Grayscale, CLAHE Contrast, Denoise)
              │
              ▼
   Tesseract OCR (pytesseract.image_to_data)
   - Words, Bounding Boxes (x, y, w, h), Confidence Scores
              │
              ▼
   Spatial Layout Assembly (TEXT + POSITION Coordinates)
              │
              ▼
   Groq LLM Engine (Llama 3.3 / 3.1)
   - Classify Document Type (Aadhaar / PAN / Driving Licence / Unsupported)
   - Structured JSON Field Extraction
              │
              ▼
   Validation & Sanitization Layer
   - PAN Regex Check (AAAAA9999A)
   - Aadhaar 12-Digit Check & Privacy Masking (********1234)
   - Date Normalization (YYYY-MM-DD)
   - Driving Licence State/Format Validation
              │
              ▼
   Streamlit Interactive Dashboard & JSON Download
```

---

## 📋 Supported Document Types & Extracted Schemas

### 1. Aadhaar Card
```json
{
  "document_type": "aadhaar",
  "name": "Suresh Kumar",
  "date_of_birth": "2002-08-15",
  "year_of_birth": null,
  "gender": "Male",
  "aadhaar_number": "********9012",
  "address": "22 Anna Nagar, Chennai, Tamil Nadu 600040"
}
```

### 2. PAN Card
```json
{
  "document_type": "pan",
  "name": "Suresh Kumar",
  "father_name": "Ramesh Kumar",
  "date_of_birth": "2002-08-15",
  "pan_number": "ABCDE1234F"
}
```

### 3. Driving Licence
```json
{
  "document_type": "driving_licence",
  "name": "Suresh Kumar",
  "date_of_birth": "2002-08-15",
  "dl_number": "TN01 20220012345",
  "address": "Chennai, Tamil Nadu",
  "issue_date": "2022-06-10",
  "valid_until": "2042-06-09"
}
```

### 4. Unsupported Document
```json
{
  "document_type": "unsupported",
  "error": "Only Aadhaar Card, PAN Card and Driving Licence are supported."
}
```

---

## 🛠️ Installation & Setup

### 1. Prerequisites
- **Python 3.9+** installed on your system.
- **Tesseract OCR Engine**:
  - **Windows**: Download and install the official installer from [UB-Mannheim/tesseract](https://github.com/UB-Mannheim/tesseract/wiki). Default install path is `C:\Program Files\Tesseract-OCR\tesseract.exe`.
  - **Ubuntu / Debian**: `sudo apt update && sudo apt install -y tesseract-ocr`
  - **macOS**: `brew install tesseract`

### 2. Clone / Navigate to Project Directory
```bash
cd "f:\document  of csrd"
```

### 3. Create & Activate Virtual Environment
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Linux / macOS
python3 -m venv venv
source venv/bin/activate
```

### 4. Install Dependencies
```bash
pip install -r requirements.txt
```

### 5. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Edit `.env` and provide your **Groq API Key**:
```ini
GROQ_API_KEY=gsk_your_actual_groq_api_key_here
GROQ_MODEL=llama-3.3-70b-versatile
# Optional on Windows if Tesseract is not in your system PATH:
TESSERACT_CMD=C:\Program Files\Tesseract-OCR\tesseract.exe
```

*(You can also provide the Groq API key directly in the Streamlit sidebar during runtime).*

---

## ▶️ Running the Application

Launch the Streamlit web dashboard:
```bash
streamlit run app.py
```

Open your browser at `http://localhost:8501`.

---

## 📂 Project Structure

```text
id-document-extractor/
│
├── app.py                     # Streamlit frontend & interactive dashboard
├── preprocessing.py           # OpenCV image enhancement, CLAHE, denoising & blur check
├── ocr_engine.py              # Tesseract image_to_data bounding boxes & spatial formatting
├── llm_extractor.py           # Groq LLM API integration with strict system prompt
├── document_classifier.py     # Heuristic and regex document classifier
├── validation.py              # Post-extraction validation, PAN/Aadhaar checks & date normalization
├── schemas.py                 # Pydantic data models for structured outputs
├── utils.py                   # Image conversions, temporary file handling, safe logging
├── requirements.txt           # Python package dependencies
├── .env.example               # Configuration template
├── .gitignore                 # Git ignore rules for privacy & temporary files
└── README.md                  # Complete documentation
```

---

## 🔒 Privacy & Security

- **In-Memory Processing**: Uploaded documents are processed entirely in memory and not permanently saved to disk.
- **Aadhaar Masking**: Aadhaar numbers are masked by default (`********1234`) in outputs to safeguard cardholder PII.
- **Safe Logging**: Logs are filtered to avoid logging unmasked sensitive identity numbers.
- **Strict Anti-Hallucination**: The Groq LLM prompt explicitly prohibits guessing missing data fields.

---

## 🧪 Testing Modules

You can run automated tests across the validation and schema pipelines:
```bash
python test_pipeline.py
```
