"""
ocr_engine.py - Tesseract OCR Module using image_to_data.
Extracts text tokens with bounding boxes, spatial coordinates, and confidence scores.
Also draws visual overlays on images.
"""

import os
from typing import List, Tuple, Optional
import cv2
import numpy as np
import pytesseract
from dotenv import load_dotenv

from schemas import BoundingBox, OCRResult

load_dotenv()

# Configure Tesseract binary path if provided in environment or common Windows paths
tesseract_cmd = os.getenv("TESSERACT_CMD")
if tesseract_cmd and os.path.exists(tesseract_cmd):
    pytesseract.pytesseract.tesseract_cmd = tesseract_cmd
elif os.name == 'nt':
    standard_paths = [
        r"C:\Program Files\Tesseract-OCR\tesseract.exe",
        r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
        os.path.expanduser(r"~\AppData\Local\Programs\Tesseract-OCR\tesseract.exe")
    ]
    for p in standard_paths:
        if os.path.exists(p):
            pytesseract.pytesseract.tesseract_cmd = p
            break


def set_tesseract_path(custom_path: str) -> bool:
    """Configures the path to the tesseract executable at runtime."""
    if custom_path and os.path.exists(custom_path):
        pytesseract.pytesseract.tesseract_cmd = custom_path
        return True
    return False


def check_tesseract_available() -> Tuple[bool, str]:
    """Verifies whether Tesseract is installed and accessible."""
    try:
        version = pytesseract.get_tesseract_version()
        return True, f"Tesseract OCR v{version} detected."
    except Exception as e:
        return False, f"Tesseract not found. Error: {str(e)}"


def extract_ocr_data(
    image: np.ndarray,
    min_confidence: float = 30.0,
    psm_mode: int = 11,
    lang: str = "eng"
) -> OCRResult:
    """
    Executes Tesseract OCR using image_to_data to retrieve words, coordinates,
    and confidence scores. Filters out low-confidence noise and tiny artifacts.

    Args:
        image: Preprocessed or original image (NumPy array).
        min_confidence: Minimum confidence threshold (0-100) to include a word.
        psm_mode: Tesseract Page Segmentation Mode (e.g. 11 for sparse text, 3 for auto, 6 for uniform block).
        lang: Language for OCR (default: 'eng').

    Returns:
        OCRResult containing structured word tokens, raw text, and layout text.
    """
    is_available, msg = check_tesseract_available()
    if not is_available:
        raise RuntimeError(
            f"Tesseract OCR is not installed or not in PATH. Please install Tesseract and configure TESSERACT_CMD. Details: {msg}"
        )

    # Primary OCR pass
    custom_config = f'--oem 3 --psm {psm_mode}'
    
    ocr_data = pytesseract.image_to_data(
        image,
        lang=lang,
        config=custom_config,
        output_type=pytesseract.Output.DICT
    )

    words: List[BoundingBox] = []
    lines_dict = {}  # (block_num, par_num, line_num) -> list of words
    total_conf = 0.0
    valid_count = 0

    n_boxes = len(ocr_data['text'])
    for i in range(n_boxes):
        text = ocr_data['text'][i].strip()
        conf = float(ocr_data['conf'][i])

        # Skip empty strings, low confidence, or single non-alphanumeric noise symbols
        if not text or conf < min_confidence or conf < 0:
            continue

        w = int(ocr_data['width'][i])
        h = int(ocr_data['height'][i])

        # Filter out tiny noise specks (e.g. dots on QR codes, chip edges)
        if w < 5 or h < 6:
            continue

        # Ignore junk single character noise
        if len(text) == 1 and not text.isalnum() and text not in ['-', '/', ':']:
            continue

        x = int(ocr_data['left'][i])
        y = int(ocr_data['top'][i])
        block_num = int(ocr_data['block_num'][i])
        par_num = int(ocr_data['par_num'][i])
        line_num = int(ocr_data['line_num'][i])

        bbox = BoundingBox(
            text=text,
            confidence=round(conf, 2),
            x=x,
            y=y,
            width=w,
            height=h
        )
        words.append(bbox)
        total_conf += conf
        valid_count += 1

        # Group words by spatial line
        line_key = (block_num, par_num, line_num)
        if line_key not in lines_dict:
            lines_dict[line_key] = []
        lines_dict[line_key].append(bbox)

    # If few words detected with chosen PSM, try fallback PSM 3
    if valid_count < 5 and psm_mode != 3:
        try:
            fallback_res = extract_ocr_data(image, min_confidence=min_confidence, psm_mode=3, lang=lang)
            if fallback_res.word_count > valid_count:
                return fallback_res
        except Exception:
            pass

    # Assemble raw text by lines
    raw_lines = []
    layout_lines = []
    for _, line_words in lines_dict.items():
        line_str = " ".join([w.text for w in line_words])
        raw_lines.append(line_str)
        # Add spatial layout info for the line
        min_x = min(w.x for w in line_words)
        min_y = min(w.y for w in line_words)
        layout_lines.append(f"TEXT: {line_str}\nPOSITION: x={min_x}, y={min_y}")

    raw_text = "\n".join(raw_lines)
    layout_text = "\n\n".join(layout_lines)
    avg_conf = round(total_conf / valid_count, 2) if valid_count > 0 else 0.0

    return OCRResult(
        words=words,
        raw_text=raw_text,
        layout_text=layout_text,
        average_confidence=avg_conf,
        word_count=valid_count
    )


def draw_bounding_boxes(
    image: np.ndarray,
    ocr_result: OCRResult,
    show_confidence: bool = True,
    box_color: Tuple[int, int, int] = (0, 255, 0),
    text_color: Tuple[int, int, int] = (255, 0, 0)
) -> np.ndarray:
    """
    Draws bounding boxes and optional confidence tags around detected text on the image.
    
    Args:
        image: Original RGB/BGR image.
        ocr_result: OCRResult object containing bounding boxes.
        show_confidence: Whether to draw small confidence tags above boxes.
        box_color: BGR tuple for box borders (default: bright green).
        text_color: BGR tuple for confidence label (default: red/blue).
        
    Returns:
        Annotated image as NumPy array.
    """
    annotated = image.copy()
    if len(annotated.shape) == 2:
        annotated = cv2.cvtColor(annotated, cv2.COLOR_GRAY2BGR)

    for word in ocr_result.words:
        x, y, w, h = word.x, word.y, word.width, word.height
        
        # Color coding: Green if confidence > 70, Orange if 50-70, Yellow if < 50
        if word.confidence >= 75:
            current_box_color = (0, 200, 0)  # Green
        elif word.confidence >= 50:
            current_box_color = (0, 165, 255)  # Orange
        else:
            current_box_color = (0, 255, 255)  # Yellow

        # Draw bounding rectangle
        cv2.rectangle(annotated, (x, y), (x + w, y + h), current_box_color, 2)

        # Draw small confidence score above box if requested
        if show_confidence:
            label = f"{int(word.confidence)}%"
            font_scale = 0.4
            thickness = 1
            (tw, th), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, font_scale, thickness)
            # Tag background
            cv2.rectangle(annotated, (x, max(0, y - th - 4)), (x + tw + 2, max(th + 4, y)), current_box_color, -1)
            # Tag text
            cv2.putText(
                annotated,
                label,
                (x + 1, max(th, y - 2)),
                cv2.FONT_HERSHEY_SIMPLEX,
                font_scale,
                (0, 0, 0),
                thickness,
                cv2.LINE_AA
            )

    return annotated
