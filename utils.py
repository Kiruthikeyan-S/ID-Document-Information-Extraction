"""
utils.py - General Utility and Helper Functions.
Handles image conversions, temporary file cleanup, safe logging, and formatting.
"""

import os
import io
import json
import logging
import tempfile
from typing import Optional, Any
import numpy as np
from PIL import Image

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)
logger = logging.getLogger("IDExtractor")


def pil_to_cv2(pil_image: Image.Image) -> np.ndarray:
    """Converts a PIL Image object to an OpenCV BGR NumPy array."""
    # Convert RGBA or Palette to RGB first
    if pil_image.mode != "RGB":
        pil_image = pil_image.convert("RGB")
    rgb_array = np.array(pil_image)
    # Convert RGB to BGR for OpenCV
    bgr_array = rgb_array[:, :, ::-1].copy()
    return bgr_array


def cv2_to_pil(cv2_image: np.ndarray) -> Image.Image:
    """Converts an OpenCV BGR or Grayscale NumPy array to PIL Image."""
    if len(cv2_image.shape) == 2:
        return Image.fromarray(cv2_image)
    # Convert BGR to RGB
    rgb_array = cv2_image[:, :, ::-1]
    return Image.fromarray(rgb_array)


def cv2_to_bytes(cv2_image: np.ndarray, format: str = "PNG") -> bytes:
    """Encodes an OpenCV image to raw bytes."""
    pil_img = cv2_to_pil(cv2_image)
    buf = io.BytesIO()
    pil_img.save(buf, format=format)
    return buf.getvalue()


def safe_mask_log(text: str) -> str:
    """Masks potential Aadhaar numbers or sensitive 12-digit numbers in logs."""
    import re
    # Mask 12-digit sequences
    masked = re.sub(r"\b(\d{4})[\s\-]?(\d{4})[\s\-]?(\d{4})\b", r"****-****-\3", text)
    return masked


def format_json_output(data: Any, indent: int = 2) -> str:
    """Serializes a Pydantic model or dict to formatted JSON string."""
    if hasattr(data, "model_dump"):
        # Pydantic v2
        obj = data.model_dump()
    elif hasattr(data, "dict"):
        # Pydantic v1
        obj = data.dict()
    else:
        obj = data
    return json.dumps(obj, indent=indent, ensure_ascii=False)


def create_temp_file(suffix: str = ".png") -> str:
    """Creates a unique temporary file path."""
    fd, path = tempfile.mkstemp(suffix=suffix)
    os.close(fd)
    return path


def safe_delete_file(path: Optional[str]) -> None:
    """Safely removes a temporary file if it exists."""
    if path and os.path.exists(path):
        try:
            os.remove(path)
        except Exception as e:
            logger.warning(f"Could not delete temporary file {path}: {e}")
