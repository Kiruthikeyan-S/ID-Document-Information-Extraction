import os
import json
import uuid
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
HISTORY_FILE = os.path.join(DATA_DIR, "history.json")
RETENTION_DAYS = 30

os.makedirs(DATA_DIR, exist_ok=True)
if not os.path.exists(HISTORY_FILE):
    with open(HISTORY_FILE, "w", encoding="utf-8") as f:
        json.dump([], f)


def read_history(auto_purge: bool = True) -> List[Dict[str, Any]]:
    """Reads stored verification records and automatically purges items older than 30 days."""
    try:
        with open(HISTORY_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
    except Exception:
        data = []

    if auto_purge and data:
        now = datetime.utcnow()
        valid_records = []
        has_expired = False
        for doc in data:
            created_str = doc.get("createdAt")
            if created_str:
                try:
                    # Parse ISO timestamp
                    clean_str = created_str.replace("Z", "+00:00")
                    created_dt = datetime.fromisoformat(clean_str).replace(tzinfo=None)
                    age_days = (now - created_dt).total_seconds() / 86400.0
                    if age_days <= RETENTION_DAYS:
                        valid_records.append(doc)
                    else:
                        has_expired = True
                except Exception:
                    valid_records.append(doc)
            else:
                valid_records.append(doc)
        
        if has_expired:
            write_history(valid_records)
            return valid_records

    return data


def write_history(data: List[Dict[str, Any]]) -> None:
    try:
        with open(HISTORY_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
    except Exception as e:
        print(f"[Utility Bot Storage] Error writing history: {e}")


def save_extraction(
    result_dict: Dict[str, Any], 
    original_filename: str = "document.jpg",
    thumbnail_image: Optional[str] = None
) -> str:
    """Saves document verification extraction with 30-day retention and photo thumbnail."""
    history = read_history(auto_purge=True)
    doc_id = f"doc_{int(datetime.now().timestamp())}_{uuid.uuid4().hex[:6]}"
    
    clean_data = result_dict.get("data", {})
    if hasattr(clean_data, "dict"):
        clean_data = clean_data.dict()

    now = datetime.utcnow()
    expires_at = now + timedelta(days=RETENTION_DAYS)

    record = {
        "_id": doc_id,
        "documentType": result_dict.get("document_type", "unsupported"),
        "isValid": result_dict.get("is_valid", True),
        "shortCircuited": result_dict.get("short_circuited", False),
        "data": clean_data,
        "warnings": result_dict.get("warnings", []),
        "ocrConfidence": result_dict.get("ocr_confidence", 0.0),
        "qualityReport": result_dict.get("quality_report", {}),
        "rawOcrText": result_dict.get("raw_ocr_text", ""),
        "originalFileName": original_filename,
        "thumbnail": thumbnail_image,  # Stored photo thumbnail for history preview
        "createdAt": now.isoformat() + "Z",
        "expiresAt": expires_at.isoformat() + "Z",
        "retentionDays": RETENTION_DAYS,
    }
    
    history.insert(0, record)
    # Keep up to 200 verification records within 30 days
    if len(history) > 200:
        history = history[:200]
    write_history(history)
    return doc_id


def get_history(limit: int = 50, page: int = 1, doc_type: Optional[str] = None) -> Dict[str, Any]:
    history = read_history(auto_purge=True)
    if doc_type:
        history = [d for d in history if d.get("documentType") == doc_type]
    
    total = len(history)
    start = (page - 1) * limit
    paginated = history[start:start + limit]
    pages = (total + limit - 1) // limit if total > 0 else 1
    
    return {
        "documents": paginated,
        "total": total,
        "page": page,
        "pages": pages,
        "retentionDays": RETENTION_DAYS,
        "source": "utility_bot_store"
    }


def get_extraction_by_id(doc_id: str) -> Optional[Dict[str, Any]]:
    history = read_history(auto_purge=True)
    for doc in history:
        if doc.get("_id") == doc_id:
            return doc
    return None


def update_extraction_by_id(doc_id: str, updated_fields: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Updates an existing verification record with edited details or photo."""
    history = read_history(auto_purge=False)
    for i, doc in enumerate(history):
        if doc.get("_id") == doc_id:
            # Update data fields
            if "data" in updated_fields:
                doc["data"].update(updated_fields["data"])
            if "thumbnail" in updated_fields:
                doc["thumbnail"] = updated_fields["thumbnail"]
            if "documentType" in updated_fields:
                doc["documentType"] = updated_fields["documentType"]
            doc["updatedAt"] = datetime.utcnow().isoformat() + "Z"
            history[i] = doc
            write_history(history)
            return doc
    return None


def delete_extraction_by_id(doc_id: str) -> bool:
    history = read_history(auto_purge=False)
    new_history = [d for d in history if d.get("_id") != doc_id]
    if len(new_history) != len(history):
        write_history(new_history)
        return True
    return False


def get_storage_stats() -> Dict[str, Any]:
    """Returns storage space usage, record count, and 30-day retention stats."""
    history = read_history(auto_purge=True)
    file_size_bytes = 0
    if os.path.exists(HISTORY_FILE):
        file_size_bytes = os.path.getsize(HISTORY_FILE)
    
    kb_size = round(file_size_bytes / 1024.0, 1)
    mb_size = round(file_size_bytes / (1024.0 * 1024.0), 2)

    return {
        "totalRecords": len(history),
        "maxRecords": 200,
        "retentionDays": RETENTION_DAYS,
        "storageSizeBytes": file_size_bytes,
        "storageSizeKB": kb_size,
        "storageSizeMB": mb_size,
        "percentUsed": min(100, round((len(history) / 200.0) * 100, 1)),
    }


def clean_storage(force_all: bool = False) -> Dict[str, Any]:
    """Purges expired records or clears storage if requested."""
    if force_all:
        write_history([])
        return {"message": "All verification storage cleared successfully.", "remaining": 0}
    
    history = read_history(auto_purge=True)
    return {"message": "Storage cleaned. Expired records (>30 days) removed.", "remaining": len(history)}
