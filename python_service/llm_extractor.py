"""
llm_extractor.py - Groq LLM Document Extraction Engine.
Interfaces with Groq's models to analyze OCR layout text,
classify the ID document type (Front & Back), and extract structured key-value pairs.
"""

import os
import json
from typing import Dict, Any, Optional, Tuple
from dotenv import load_dotenv
from groq import Groq, GroqError

load_dotenv()

# Try injecting system truststore on Python 3.10+ (vital on Windows)
try:
    import truststore
    truststore.inject_into_ssl()
except Exception:
    pass

import httpx

# System prompt for strict extraction
SYSTEM_PROMPT = """You are an expert Indian Identity Document Information Extraction engine.

You receive OCR text and spatial layout information extracted from an Indian identity document.

Supported Document Types and Sides:
1. "aadhaar" (Front side of Aadhaar card)
2. "aadhaar_back" (Back side of Aadhaar card with Address, C/O, Pincode)
3. "pan" (Front side of PAN card with Name, Father's Name, DOB, PAN number)
4. "pan_back" (Back side of PAN card - barcode / disclaimer only)
5. "driving_licence" (Front side of Driving Licence)
6. "driving_licence_back" (Back side of Driving Licence with vehicle classes & address)

Rules:
1. Determine the exact document type and side.
2. Extract only information clearly present in the OCR text.
3. Never invent or guess missing information.
4. If a field is missing or unreadable, return null.
5. Return only valid JSON adhering strictly to the schema below.

Document Schema Requirements:

--- If Aadhaar Front ("aadhaar"):
{
  "document_type": "aadhaar",
  "name": "<Full Name or null>",
  "date_of_birth": "<DD/MM/YYYY or YYYY-MM-DD or null>",
  "year_of_birth": "<YYYY or null>",
  "gender": "<Male / Female / Transgender or null>",
  "aadhaar_number": "<12-digit number or null>",
  "address": "<Full address if present on front or null>"
}

--- If Aadhaar Back ("aadhaar_back"):
Extract full address, Care of (Father/Mother/Spouse name), 6-digit Pincode, and State.
{
  "document_type": "aadhaar_back",
  "care_of": "<C/O, S/O, D/O, W/O Guardian/Spouse Name or null>",
  "address": "<Complete full residential address string>",
  "pincode": "<6-digit postal code or null>",
  "state": "<State name or null>",
  "requires_front_side": true
}

--- If PAN Front ("pan"):
CRITICAL PAN CARD LAYOUT RULES:
- Line 1 Label: "नाम / Name"
- Line 2 Value: Cardholder Name (e.g., "S KIRUTHIKEYAN")
- Line 3 Label: "पिता का नाम / Father's Name"
- Line 4 Value: Father's Name (e.g., "SEVUGAPERUMAL"). The Father's Name is ALWAYS the real Indian person's name printed in capital letters directly below "Father's Name".
- ANTI-HALLUCINATION: NEVER output corrupted OCR artifacts or Hindi misreads such as "STRAEEX", "TAA", "wu at", "met", "hastakshar", "shri", "minor", "sign", "income", "tax", "dept", "govt".
- If the father name cannot be clearly read as a real English name, search the nearby lines for the actual printed name (e.g. SEVUGAPERUMAL) or return null.
- Line 5: Date of Birth in DD/MM/YYYY format (e.g. "18/11/2004"). Do not confuse '8' with '6'.
{
  "document_type": "pan",
  "name": "<Full Name of cardholder>",
  "father_name": "<Father's Name printed directly below the Father's Name label, e.g., SEVUGAPERUMAL>",
  "date_of_birth": "<DD/MM/YYYY or YYYY-MM-DD or null>",
  "pan_number": "<10-character PAN number e.g. ABCDE1234F or null>"
}

--- If PAN Back ("pan_back"):
Note: PAN back has no personal info, only NSDL/UTIITSL barcode or disclaimer.
{
  "document_type": "pan_back",
  "message": "PAN Card Back Side contains no personal details. Please flip the card and upload the FRONT side.",
  "requires_front_side": true
}

--- If Driving Licence Front ("driving_licence"):
{
  "document_type": "driving_licence",
  "name": "<Full Name or null>",
  "date_of_birth": "<DD/MM/YYYY or YYYY-MM-DD or null>",
  "dl_number": "<Driving licence number or null>",
  "address": "<Address or null>",
  "issue_date": "<Date of issue or null>",
  "valid_until": "<Validity date or null>"
}

--- If Driving Licence Back ("driving_licence_back"):
{
  "document_type": "driving_licence_back",
  "vehicle_classes": ["<LMV, MCWG, TRANS, etc.>"],
  "address": "<Address if present or null>",
  "badge_number": "<Badge number or null>",
  "requires_front_side": true
}

--- If any other document, receipt, bill, or unrecognized text:
{
  "document_type": "unsupported",
  "error": "Only Aadhaar Card, PAN Card and Driving Licence are supported."
}
"""


def get_groq_client(api_key: Optional[str] = None) -> Groq:
    """Initializes and returns a Groq client instance with robust SSL handling."""
    key = api_key or os.getenv("GROQ_API_KEY")
    if not key or key.strip() == "" or key == "your_groq_api_key_here":
        raise ValueError(
            "GROQ_API_KEY is not configured. Please provide a valid Groq API key."
        )
    
    try:
        return Groq(api_key=key.strip())
    except Exception:
        http_client = httpx.Client(verify=False)
        return Groq(api_key=key.strip(), http_client=http_client)


def get_available_models(api_key: Optional[str] = None) -> list:
    """Fetches list of available chat models from Groq account."""
    fallback_models = [
        "llama-3.3-70b-versatile",
        "openai/gpt-oss-120b",
        "qwen/qwen3.6-27b",
        "llama-3.1-8b-instant",
        "groq/compound-mini",
        "openai/gpt-oss-20b"
    ]
    try:
        client = get_groq_client(api_key)
        models = client.models.list()
        chat_models = [
            m.id for m in models.data
            if not m.id.startswith("whisper") and not "prompt-guard" in m.id
        ]
        # Prioritize high-speed models
        preferred = ["llama-3.3-70b-versatile", "openai/gpt-oss-120b", "qwen/qwen3.6-27b", "llama-3.1-8b-instant"]
        sorted_models = [m for m in preferred if m in chat_models] + [m for m in chat_models if m not in preferred]
        return sorted_models if sorted_models else fallback_models
    except Exception:
        return fallback_models


def extract_document_info(
    ocr_raw_text: str,
    ocr_layout_text: str,
    api_key: Optional[str] = None,
    model_name: Optional[str] = None,
    heuristic_hint: Optional[str] = None,
    temperature: float = 0.0
) -> Tuple[Dict[str, Any], Optional[str]]:
    """Sends the OCR text and layout metadata to Groq LLM for ultra-fast classification and extraction."""
    if not ocr_raw_text or not ocr_raw_text.strip():
        return {
            "document_type": "unsupported",
            "error": "No readable text detected in the image."
        }, "No text was detected by the OCR engine."

    # Default to ultra-fast 70B model for sub-second responses
    primary_model = model_name or os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
    models_to_try = [primary_model, "llama-3.1-8b-instant", "openai/gpt-oss-120b"]
    
    # Remove duplicates while preserving order
    models_to_try = list(dict.fromkeys(models_to_try))

    hint_text = f"\nContext/Keyword Analysis Hint: {heuristic_hint}\n" if heuristic_hint else ""

    # Truncate layout text if overly verbose to ensure sub-second response
    clean_layout = ocr_layout_text[:3000] if len(ocr_layout_text) > 3000 else ocr_layout_text

    user_content = f"""Here is the extracted OCR text from the document:
{hint_text}
--- RAW OCR TEXT ---
{ocr_raw_text[:2000]}

--- SPATIAL LAYOUT INFORMATION ---
{clean_layout}

Analyze the document text, determine if it is Front or Back of Aadhaar, PAN, or Driving Licence, and return structured JSON strictly adhering to the schema.
"""

    client = get_groq_client(api_key)
    last_error = None

    for model in models_to_try:
        try:
            completion = client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": user_content}
                ],
                temperature=temperature,
                response_format={"type": "json_object"},
                timeout=12.0
            )

            response_text = completion.choices[0].message.content.strip()

            try:
                extracted_json = json.loads(response_text)
                return extracted_json, None
            except json.JSONDecodeError as json_err:
                start_idx = response_text.find("{")
                end_idx = response_text.rfind("}")
                if start_idx != -1 and end_idx != -1:
                    clean_json_str = response_text[start_idx : end_idx + 1]
                    extracted_json = json.loads(clean_json_str)
                    return extracted_json, None
                last_error = f"JSON Parse Error with {model}: {str(json_err)}"

        except GroqError as groq_err:
            last_error = f"Groq Error with {model}: {str(groq_err)}"
            continue
        except Exception as e:
            last_error = f"Error with {model}: {str(e)}"
            continue

    return {
        "document_type": "unsupported",
        "error": f"Extraction failed after model fallbacks: {last_error}"
    }, last_error
