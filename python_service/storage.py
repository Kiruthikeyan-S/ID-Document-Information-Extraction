import os
import json
import uuid
from datetime import datetime
from typing import List, Dict, Any, Optional

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
HISTORY_FILE = os.path.join(DATA_DIR, "history.json")

os.makedirs(DATA_DIR, exist_ok=True)
if not os.path.exists(HISTORY_FILE):
    with open(HISTORY_FILE, "w", encoding="utf-8") as f:
        json.dump([], f)


def read_history() -> List[Dict[str, Any]]:
    try:
        with open(HISTORY_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return []


def write_history(data: List[Dict[str, Any]]) -> None:
    try:
        with open(HISTORY_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
    except Exception as e:
        print(f"[Storage] Error writing history: {e}")


def save_extraction(result_dict: Dict[str, Any], original_filename: str = "document.jpg") -> str:
    history = read_history()
    doc_id = f"doc_{int(datetime.now().timestamp())}_{uuid.uuid4().hex[:6]}"
    
    # Store clean extraction data without huge base64 images to keep history lightweight
    clean_data = result_dict.get("data", {})
    if hasattr(clean_data, "dict"):
        clean_data = clean_data.dict()

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
        "createdAt": datetime.utcnow().isoformat() + "Z",
        "updatedAt": datetime.utcnow().isoformat() + "Z",
    }
    
    history.insert(0, record)
    if len(history) > 100:
        history = history[:100]
    write_history(history)
    return doc_id


def get_history(limit: int = 50, page: int = 1, doc_type: Optional[str] = None) -> Dict[str, Any]:
    history = read_history()
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
        "source": "fastapi_local_store"
    }


def get_extraction_by_id(doc_id: str) -> Optional[Dict[str, Any]]:
    history = read_history()
    for doc in history:
        if doc.get("_id") == doc_id:
            return doc
    return None


def delete_extraction_by_id(doc_id: str) -> bool:
    history = read_history()
    new_history = [d for d in history if d.get("_id") != doc_id]
    if len(new_history) != len(history):
        write_history(new_history)
        return True
    return False
