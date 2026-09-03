"""
main.py - FastAPI Microservice for ID Card Information Extraction.
Exposes REST endpoints for image preprocessing, OCR, Decision Gate check,
Groq LLM extraction, and Pydantic validation.
"""

import io
import os
from typing import Optional
from fastapi import FastAPI, File, UploadFile, Form, HTTPException, Header, Query
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
import numpy as np
from dotenv import load_dotenv

load_dotenv()

from schemas import FinalExtractionResult, UnsupportedDocumentData
from preprocessing import assess_image_quality, preprocess_id_card
from ocr_engine import extract_ocr_data, draw_bounding_boxes, check_tesseract_available
from document_classifier import classify_document_heuristics
from llm_extractor import extract_document_info, get_available_models
from validation import validate_and_clean_extraction
from utils import pil_to_cv2, cv2_to_base64, logger
from storage import (
    save_confirmed_record, 
    save_rejected_record, 
    confirm_or_update_extraction,
    get_history, 
    get_failed_history,
    get_extraction_by_id, 
    delete_extraction_by_id, 
    get_storage_stats, 
    clean_storage
)

app = FastAPI(
    title="Utility Bot - Verification Document API",
    version="3.0.0",
    description="Utility Bot backend providing Aadhaar, PAN, and Driving Licence verification with 30-day auto-retention, photo storage, and Device ID isolation."
)

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check():
    """Health check endpoint reporting Tesseract & service status."""
    tess_available, tess_msg = check_tesseract_available()
    return {
        "status": "healthy",
        "service": "utility_bot_backend",
        "tesseract_available": tess_available,
        "tesseract_message": tess_msg
    }


@app.get("/models")
def list_models(api_key: Optional[str] = None):
    """Retrieves available Groq chat completion models."""
    try:
        models = get_available_models(api_key)
        return {"status": "success", "models": models}
    except Exception as e:
        return {"status": "error", "message": str(e), "models": ["llama-3.3-70b-versatile", "openai/gpt-oss-120b", "llama-3.1-8b-instant"]}


@app.get("/history")
def list_history(
    limit: int = 50, 
    page: int = 1, 
    type: Optional[str] = None,
    x_device_id: Optional[str] = Header(None, alias="X-Device-Id"),
    deviceId: Optional[str] = Query(None)
):
    """Retrieves stored verification records with 30-day auto-retention filtered by Device ID."""
    active_device = x_device_id or deviceId
    return get_history(limit=limit, page=page, doc_type=type, device_id=active_device)


@app.get("/failed-history")
def list_failed_history(
    limit: int = 50, 
    page: int = 1, 
    x_device_id: Optional[str] = Header(None, alias="X-Device-Id"),
    deviceId: Optional[str] = Query(None)
):
    """Retrieves failed/rejected records stored in dedicated failed_verifications collection."""
    active_device = x_device_id or deviceId
    return get_failed_history(limit=limit, page=page, device_id=active_device)


@app.get("/history/{doc_id}")
def get_single_history(
    doc_id: str,
    x_device_id: Optional[str] = Header(None, alias="X-Device-Id")
):
    """Retrieves single extraction record by ID."""
    doc = get_extraction_by_id(doc_id, device_id=x_device_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc


@app.delete("/history/{doc_id}")
def delete_single_history(
    doc_id: str,
    x_device_id: Optional[str] = Header(None, alias="X-Device-Id")
):
    """Deletes extraction record by ID."""
    success = delete_extraction_by_id(doc_id, device_id=x_device_id)
    if not success:
        raise HTTPException(status_code=404, detail="Document not found")
    return {"message": "Document deleted successfully", "id": doc_id}


@app.get("/storage/stats")
def storage_stats(
    x_device_id: Optional[str] = Header(None, alias="X-Device-Id")
):
    """Returns database and local storage capacity metrics (30-day retention)."""
    return get_storage_stats(device_id=x_device_id)


@app.post("/storage/clean")
def trigger_storage_cleanup(
    force_all: bool = False,
    x_device_id: Optional[str] = Header(None, alias="X-Device-Id")
):
    """Cleans expired records or purges verification storage."""
    return clean_storage(device_id=x_device_id, force_all=force_all)


@app.post("/confirm-result")
def confirm_result_endpoint(
    payload: dict,
    x_device_id: Optional[str] = Header(None, alias="X-Device-Id")
):
    """
    Called when user clicks '✓ Correct'.
    Stores image, extracted data, date, time with IMG000001 in database and History.
    """
    active_device = x_device_id or payload.get("deviceId") or "default_client"
    image_id = save_confirmed_record(
        result_dict=payload,
        original_filename=payload.get("originalFileName", "document.jpg"),
        thumbnail_image=payload.get("image") or payload.get("thumbnail"),
        device_id=active_device
    )
    return {
        "status": "Success",
        "imageId": image_id,
        "message": f"Record successfully confirmed and saved as {image_id}"
    }


@app.post("/reject-result")
def reject_result_endpoint(
    payload: dict,
    x_device_id: Optional[str] = Header(None, alias="X-Device-Id")
):
    """
    Called when user clicks '✗ Wrong'.
    Stores image, date, time with FAIL000001 in database (HIDDEN from History page).
    """
    active_device = x_device_id or payload.get("deviceId") or "default_client"
    failed_id = save_rejected_record(
        original_filename=payload.get("originalFileName", "document.jpg"),
        thumbnail_image=payload.get("image") or payload.get("thumbnail"),
        error_message=payload.get("error", "User clicked Wrong (Extraction inaccurate)"),
        device_id=active_device
    )
    return {
        "status": "Failed",
        "failedId": failed_id,
        "message": f"Failed upload logged internally as {failed_id}"
    }


@app.post("/extract", response_model=FinalExtractionResult)
async def extract_document(
    file: UploadFile = File(...),
    min_confidence: float = Form(25.0),
    psm_mode: int = Form(11),
    enable_glare: bool = Form(True),
    enable_clahe: bool = Form(True),
    enable_denoise: bool = Form(True),
    enable_threshold: bool = Form(False),
    threshold_method: str = Form("otsu"),
    model_name: Optional[str] = Form(None),
    groq_api_key: Optional[str] = Form(None),
    deviceId: Optional[str] = Form(None),
    x_device_id: Optional[str] = Header(None, alias="X-Device-Id")
):
    """
    Main extraction pipeline endpoint with Pre-LLM Decision Gate.
    Stores successful uploads as IMG000001 (shown in History) 
    and failed uploads as FAIL000001 (hidden from client History).
    """
    active_device = x_device_id or deviceId or "default_client"

    # 1. Validate file format
    if not file.content_type.startswith("image/"):
        save_failed_extraction(
            original_filename=file.filename or "unknown.file",
            error_message="Uploaded file is not a valid image format.",
            device_id=active_device
        )
        raise HTTPException(status_code=400, detail="Uploaded file must be a valid image (JPG, JPEG, PNG).")

    try:
        contents = await file.read()
        pil_image = Image.open(io.BytesIO(contents))
        if pil_image.mode not in ("RGB", "L"):
            pil_image = pil_image.convert("RGB")
        cv2_orig = pil_to_cv2(pil_image)
    except Exception as e:
        save_failed_extraction(
            original_filename=file.filename or "corrupted.jpg",
            error_message=f"Failed to decode image: {str(e)}",
            device_id=active_device
        )
        raise HTTPException(status_code=400, detail=f"Failed to decode image: {str(e)}")

    # 2. Image Quality & Blur Check
    quality_report = assess_image_quality(cv2_orig)

    # 3. OpenCV Preprocessing
    cv2_preprocessed = preprocess_id_card(
        cv2_orig,
        enable_resize=True,
        enable_clahe=enable_clahe,
        enable_denoise=enable_denoise,
        enable_glare_reduction=enable_glare,
        enable_threshold=enable_threshold,
        threshold_method=threshold_method
    )

    # 4. Tesseract OCR with Bounding Boxes (Free & Local)
    try:
        ocr_result = extract_ocr_data(
            cv2_preprocessed,
            min_confidence=min_confidence,
            psm_mode=psm_mode
        )
        cv2_annotated = draw_bounding_boxes(cv2_orig, ocr_result, show_confidence=True)
    except Exception as e:
        logger.error(f"OCR Error: {e}")
        save_failed_extraction(
            original_filename=file.filename or "document.jpg",
            thumbnail_image=cv2_to_base64(cv2_orig, quality=60),
            error_message=f"OCR Engine error: {str(e)}",
            device_id=active_device
        )
        raise HTTPException(status_code=500, detail=f"OCR Processing failed: {str(e)}")

    # Encode images for visual pipeline
    pipeline_images = {
        "original": cv2_to_base64(cv2_orig, quality=80),
        "preprocessed": cv2_to_base64(cv2_preprocessed, quality=80),
        "annotated": cv2_to_base64(cv2_annotated, quality=85)
    }

    # If no readable text was detected at all
    if ocr_result.word_count == 0 or not ocr_result.raw_text.strip():
        unsupported = UnsupportedDocumentData(
            document_type="unsupported",
            error="No readable text detected in the image. Please verify lighting and focus."
        )
        failed_id = save_failed_extraction(
            original_filename=file.filename or "document.jpg",
            thumbnail_image=pipeline_images.get("original"),
            error_message="No readable text detected by OCR engine.",
            device_id=active_device,
            raw_ocr_text=""
        )
        return FinalExtractionResult(
            id=failed_id,
            failed_id=failed_id,
            status="Failed",
            document_type="unsupported",
            is_valid=False,
            short_circuited=True,
            data=unsupported,
            warnings=["No text detected by OCR engine."],
            ocr_confidence=0.0,
            raw_ocr_text="",
            quality_report=quality_report,
            images=pipeline_images
        )

    # 5. DECISION GATE: Heuristic Type Check (Pre-LLM Resource Gate)
    heuristic_type, heuristic_conf, heuristic_scores = classify_document_heuristics(ocr_result.raw_text)
    
    # If the document shows NO resemblance to Aadhaar, PAN, or DL, short-circuit immediately
    if heuristic_type == "unsupported" and max(heuristic_scores.values()) == 0:
        logger.info("[Decision Gate] Document rejected before LLM call. Zero ID keywords found.")
        unsupported = UnsupportedDocumentData(
            document_type="unsupported",
            error="Decision Gate: Document does not match Indian Aadhaar, PAN, or Driving Licence patterns. LLM processing skipped."
        )
        failed_id = save_failed_extraction(
            original_filename=file.filename or "document.jpg",
            thumbnail_image=pipeline_images.get("original"),
            error_message="Rejected by Pre-LLM Decision Gate (Non-ID document detected).",
            device_id=active_device,
            raw_ocr_text=ocr_result.raw_text
        )
        return FinalExtractionResult(
            id=failed_id,
            failed_id=failed_id,
            status="Failed",
            document_type="unsupported",
            is_valid=False,
            short_circuited=True,
            data=unsupported,
            warnings=["Rejected by Pre-LLM Decision Gate (Non-ID document detected)."],
            ocr_confidence=ocr_result.average_confidence,
            raw_ocr_text=ocr_result.raw_text,
            quality_report=quality_report,
            images=pipeline_images
        )

    # 6. Groq LLM API Call (Only for supported IDs)
    heuristic_hint_str = f"Found pattern matching for: {heuristic_type.upper()}" if heuristic_type != "unsupported" else None
    
    raw_llm_json, llm_error = extract_document_info(
        ocr_raw_text=ocr_result.raw_text,
        ocr_layout_text=ocr_result.layout_text,
        api_key=groq_api_key,
        model_name=model_name,
        heuristic_hint=heuristic_hint_str
    )

    if raw_llm_json.get("document_type") == "unsupported" and heuristic_type != "unsupported":
        raw_llm_json["document_type"] = heuristic_type

    # 7. Post-Validation and Pydantic Normalization
    final_result = validate_and_clean_extraction(
        raw_data=raw_llm_json,
        ocr_confidence=ocr_result.average_confidence,
        raw_ocr_text=ocr_result.raw_text,
        quality_report=quality_report,
        images=pipeline_images,
        short_circuited=False
    )

    # 8. Return preview extraction result with formatted date & time
    from datetime import datetime
    now_local = datetime.now()
    final_result.date = now_local.strftime("%d-%m-%Y")
    final_result.time = now_local.strftime("%I:%M %p")
    final_result.status = "Pending"  # Awaiting user confirmation ("✓ Correct" or "✗ Wrong")

    return final_result


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
