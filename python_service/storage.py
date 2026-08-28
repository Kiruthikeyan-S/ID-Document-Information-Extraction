import os
import json
import re
import uuid
import glob
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
USERS_DIR = os.path.join(DATA_DIR, "users")
RETENTION_DAYS = 30

os.makedirs(USERS_DIR, exist_ok=True)


def sanitize_device_id(device_id: Optional[str]) -> str:
    """Sanitizes device ID to be safe for filenames."""
    if not device_id or not isinstance(device_id, str):
        return "default_user"
    clean = re.sub(r"[^a-zA-Z0-9_\-]", "_", device_id.strip())
    return clean[:64] if clean else "default_user"


def get_user_storage_path(device_id: Optional[str]) -> str:
    """Returns dedicated isolated storage file path for each user/device."""
    safe_id = sanitize_device_id(device_id)
    return os.path.join(USERS_DIR, f"{safe_id}.json")


def read_user_history(device_id: Optional[str], auto_purge: bool = True) -> List[Dict[str, Any]]:
    """Reads dedicated isolated storage file for a specific user and auto-purges items older than 30 days."""
    filepath = get_user_storage_path(device_id)
    if not os.path.exists(filepath):
        return []

    try:
        with open(filepath, "r", encoding="utf-8") as f:
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
            write_user_history(device_id, valid_records)
            return valid_records

    return data


def write_user_history(device_id: Optional[str], data: List[Dict[str, Any]]) -> None:
    """Writes verification records directly into the user's dedicated personal storage file."""
    filepath = get_user_storage_path(device_id)
    try:
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
    except Exception as e:
        print(f"[Utility Bot Storage] Error writing user history for {device_id}: {e}")


def save_extraction(
    result_dict: Dict[str, Any], 
    original_filename: str = "document.jpg",
    thumbnail_image: Optional[str] = None,
    device_id: Optional[str] = None
) -> str:
    """Saves document verification directly into the user's isolated personal storage."""
    active_device = sanitize_device_id(device_id)
    history = read_user_history(active_device, auto_purge=True)
    doc_id = f"doc_{int(datetime.now().timestamp())}_{uuid.uuid4().hex[:6]}"
    
    clean_data = result_dict.get("data", {})
    if hasattr(clean_data, "dict"):
        clean_data = clean_data.dict()

    now = datetime.utcnow()
    expires_at = now + timedelta(days=RETENTION_DAYS)

    record = {
        "_id": doc_id,
        "deviceId": active_device,
        "documentType": result_dict.get("document_type", "unsupported"),
        "isValid": result_dict.get("is_valid", True),
        "shortCircuited": result_dict.get("short_circuited", False),
        "isDuplicateOrSample": result_dict.get("is_duplicate_or_sample", False),
        "authenticityStatus": result_dict.get("authenticity_status", "VERIFIED"),
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
    # Keep up to 100 verification records per user within 30 days
    if len(history) > 100:
        history = history[:100]
    
    write_user_history(active_device, history)
    return doc_id


def get_history(
    limit: int = 50, 
    page: int = 1, 
    doc_type: Optional[str] = None,
    device_id: Optional[str] = None
) -> Dict[str, Any]:
    """Retrieves verification records from the user's isolated storage file."""
    active_device = sanitize_device_id(device_id)
    
    if active_device == "admin_all":
        # Admin aggregation: combine all user files
        history = []
        for user_file in glob.glob(os.path.join(USERS_DIR, "*.json")):
            try:
                with open(user_file, "r", encoding="utf-8") as f:
                    history.extend(json.load(f))
            except Exception:
                pass
        history.sort(key=lambda x: x.get("createdAt", ""), reverse=True)
    else:
        # Isolated per-user storage
        history = read_user_history(active_device, auto_purge=True)
        
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
        "deviceId": active_device,
        "retentionDays": RETENTION_DAYS,
        "storageMode": "isolated_per_user_storage"
    }


def get_extraction_by_id(doc_id: str, device_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """Fetches a specific document from the user's dedicated storage."""
    active_device = sanitize_device_id(device_id)
    history = read_user_history(active_device, auto_purge=True)
    for doc in history:
        if doc.get("_id") == doc_id:
            return doc
    return None


def delete_extraction_by_id(doc_id: str, device_id: Optional[str] = None) -> bool:
    """Deletes a specific document from the user's dedicated storage."""
    active_device = sanitize_device_id(device_id)
    history = read_user_history(active_device, auto_purge=False)
    new_history = [d for d in history if d.get("_id") != doc_id]
    if len(new_history) != len(history):
        write_user_history(active_device, new_history)
        return True
    return False


def get_storage_stats(device_id: Optional[str] = None) -> Dict[str, Any]:
    """Returns storage space usage and record count for the user's dedicated file."""
    active_device = sanitize_device_id(device_id)
    filepath = get_user_storage_path(active_device)
    
    history = read_user_history(active_device, auto_purge=True)
    file_size_bytes = os.path.getsize(filepath) if os.path.exists(filepath) else 0
    
    kb_size = round(file_size_bytes / 1024.0, 1)
    mb_size = round(file_size_bytes / (1024.0 * 1024.0), 2)

    return {
        "userRecords": len(history),
        "totalRecords": len(history),
        "maxRecords": 100,
        "retentionDays": RETENTION_DAYS,
        "storageSizeBytes": file_size_bytes,
        "storageSizeKB": kb_size,
        "storageSizeMB": mb_size,
        "percentUsed": min(100, round((len(history) / 100.0) * 100, 1)),
        "deviceId": active_device,
        "storageFile": os.path.basename(filepath)
    }


def clean_storage(device_id: Optional[str] = None, force_all: bool = False) -> Dict[str, Any]:
    """Purges expired records or clears the user's isolated storage file."""
    active_device = sanitize_device_id(device_id)
    
    if force_all:
        filepath = get_user_storage_path(active_device)
        if os.path.exists(filepath):
            os.remove(filepath)
        return {"message": f"Storage cleared for user {active_device}.", "remaining": 0}
    
    history = read_user_history(active_device, auto_purge=True)
    return {"message": "Storage cleaned. Expired records (>30 days) removed.", "remaining": len(history)}
