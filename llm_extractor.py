"""
llm_extractor.py - Groq LLM Document Extraction Engine.
Interfaces with Groq's Llama models to analyze OCR layout text,
classify the ID document type, and extract structured key-value pairs.
"""

import os
import json
from typing import Dict, Any, Optional, Tuple
from dotenv import load_dotenv
from groq import Groq, GroqError

load_dotenv()

# System prompt for strict extraction
SYSTEM_PROMPT = """You are an AI document information extraction engine.

You receive OCR text and spatial layout information extracted from an Indian identity document.

Only these document types are supported:
1. Aadhaar Card
2. PAN Card
3. Driving Licence

Your job is to:
1. Determine the document type based on the text and keywords.
2. Extract only information clearly present in the OCR text.
3. Never invent or guess missing information.
4. If a field is missing or unreadable, return null.
5. Correct small OCR spacing problems only when the value is unambiguous.
6. Return only valid JSON. Do not include markdown codeblocks or extra text outside the JSON.
7. Do not classify unrelated documents as Aadhaar, PAN, or Driving Licence.

Document Schema Requirements:

If Aadhaar Card:
- "aadhaar_number": Look for a 12-digit number sequence (often in 4-digit groups like 1234 5678 9012 or continuous 12 digits or masked like XXXX XXXX 1234). Extract the exact number string.
- "date_of_birth": Date in DD/MM/YYYY or YYYY-MM-DD format.
- "year_of_birth": 4-digit year if only year is printed (e.g. "Year of Birth : 1985").
- "gender": Male, Female, or Transgender.
- "name": Full name of the cardholder (excluding headers like Government of India).
- "address": Address text if present.
Return:
{
  "document_type": "aadhaar",
  "name": "<Full Name or null>",
  "date_of_birth": "<DD/MM/YYYY or YYYY-MM-DD or null>",
  "year_of_birth": "<YYYY or null>",
  "gender": "<Male / Female / Transgender or null>",
  "aadhaar_number": "<12-digit number or null>",
  "address": "<Full address if available or null>"
}

If PAN Card:
- "pan_number": 10-character alphanumeric code (e.g., ABCDE1234F).
Return:
{
  "document_type": "pan",
  "name": "<Full Name or null>",
  "father_name": "<Father's Name or null>",
  "date_of_birth": "<DD/MM/YYYY or YYYY-MM-DD or null>",
  "pan_number": "<10-character PAN number or null>"
}

If Driving Licence:
- "dl_number": Licence number (e.g., TN01 20220012345 or DL-1420110012345).
Return:
{
  "document_type": "driving_licence",
  "name": "<Full Name or null>",
  "date_of_birth": "<DD/MM/YYYY or YYYY-MM-DD or null>",
  "dl_number": "<Driving licence number or null>",
  "address": "<Address or null>",
  "issue_date": "<Date of issue or null>",
  "valid_until": "<Validity date or null>"
}

If any other document, receipt, bill, or unrecognized text:
{
  "document_type": "unsupported",
  "error": "Only Aadhaar Card, PAN Card and Driving Licence are supported."
}
"""


# Try injecting system truststore on Python 3.10+ (vital on Windows)
try:
    import truststore
    truststore.inject_into_ssl()
except Exception:
    pass

import httpx


def get_groq_client(api_key: Optional[str] = None) -> Groq:
    """
    Initializes and returns a Groq client instance with robust SSL handling.
    Falls back to GROQ_API_KEY environment variable.
    """
    key = api_key or os.getenv("GROQ_API_KEY")
    if not key or key.strip() == "" or key == "your_groq_api_key_here":
        raise ValueError(
            "GROQ_API_KEY is not configured. Please provide a valid Groq API key in the sidebar or in your .env file."
        )
    
    try:
        return Groq(api_key=key.strip())
    except Exception:
        # Fallback with custom httpx client if default SSL verification has issues
        http_client = httpx.Client(verify=False)
        return Groq(api_key=key.strip(), http_client=http_client)


def get_available_models(api_key: Optional[str] = None) -> list:
    """Fetches list of available chat models from Groq account."""
    fallback_models = [
        "openai/gpt-oss-120b",
        "openai/gpt-oss-20b",
        "qwen/qwen3.6-27b",
        "groq/compound-mini",
        "llama-3.3-70b-versatile",
        "llama-3.1-8b-instant"
    ]
    try:
        client = get_groq_client(api_key)
        models = client.models.list()
        chat_models = [
            m.id for m in models.data
            if not m.id.startswith("whisper") and not "prompt-guard" in m.id
        ]
        return chat_models if chat_models else fallback_models
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
    """
    Sends the OCR text and layout metadata to Groq LLM for classification and extraction.
    """
    # Verify input text is not empty
    if not ocr_raw_text or not ocr_raw_text.strip():
        return {
            "document_type": "unsupported",
            "error": "No readable text detected in the image."
        }, "No text was detected by the OCR engine."

    # Determine model name
    model = model_name or os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")

    try:
        client = get_groq_client(api_key)

        hint_text = f"\nContext/Keyword Analysis Hint: {heuristic_hint}\n" if heuristic_hint else ""

        user_content = f"""Here is the extracted OCR text from the document:
{hint_text}
--- RAW OCR TEXT ---
{ocr_raw_text}

--- SPATIAL LAYOUT INFORMATION ---
{ocr_layout_text}

Analyze the document text, determine if it is Aadhaar, PAN, or Driving Licence, and return the structured JSON strictly adhering to the schema.
"""

        # Call Groq Chat Completions API with JSON mode enabled
        completion = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_content}
            ],
            temperature=temperature,
            response_format={"type": "json_object"}
        )

        response_text = completion.choices[0].message.content.strip()

        # Parse JSON response
        try:
            extracted_json = json.loads(response_text)
            return extracted_json, None
        except json.JSONDecodeError as json_err:
            # Fallback: attempt to find json substring
            start_idx = response_text.find("{")
            end_idx = response_text.rfind("}")
            if start_idx != -1 and end_idx != -1:
                clean_json_str = response_text[start_idx : end_idx + 1]
                extracted_json = json.loads(clean_json_str)
                return extracted_json, None
            return {
                "document_type": "unsupported",
                "error": f"Failed to parse LLM response as JSON: {str(json_err)}"
            }, f"JSON Parse Error: {str(json_err)}"

    except GroqError as groq_err:
        return {
            "document_type": "unsupported",
            "error": f"Groq API Error: {str(groq_err)}"
        }, f"Groq API communication error: {str(groq_err)}"
    except ValueError as val_err:
        return {
            "document_type": "unsupported",
            "error": str(val_err)
        }, str(val_err)
    except Exception as general_err:
        return {
            "document_type": "unsupported",
            "error": f"Unexpected error during extraction: {str(general_err)}"
        }, str(general_err)
