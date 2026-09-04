"""
ocr_engine.py - Tesseract OCR Module using image_to_data.
Extracts text tokens with bounding boxes, spatial coordinates, and confidence scores.
Also draws visual overlays on images.
"""

import os
from typing import List, Tuple
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
    min_confidence: float = 25.0,
    psm_mode: int = 11,
    lang: str = "eng"
) -> OCRResult:
    """
    Executes Tesseract OCR using image_to_data to retrieve words, coordinates,
    and confidence scores. Filters out low-confidence noise and tiny artifacts.
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


def extract_ocr_deep_retry(
    image: np.ndarray,
    min_confidence: float = 20.0
) -> OCRResult:
    """
    High-accuracy 3-pass deep retry scan combining PSM 11, PSM 6, and PSM 3.
    Ensures zero missed words or blurry text on low-contrast cards.
    """
    pass1 = extract_ocr_data(image, min_confidence=min_confidence, psm_mode=11)
    pass2 = extract_ocr_data(image, min_confidence=min_confidence, psm_mode=6)
    pass3 = extract_ocr_data(image, min_confidence=min_confidence, psm_mode=3)

    all_words = pass1.words.copy()
    seen_texts = set(w.text.lower() for w in all_words)

    for word in pass2.words + pass3.words:
        if word.text.lower() not in seen_texts:
            all_words.append(word)
            seen_texts.add(word.text.lower())

    # Sort words spatially by Y then X
    all_words.sort(key=lambda w: (w.y // 15, w.x))

    combined_lines = []
    current_line = []
    last_y_group = None

    for w in all_words:
        y_group = w.y // 15
        if last_y_group is None or y_group == last_y_group:
            current_line.append(w.text)
        else:
            combined_lines.append(" ".join(current_line))
            current_line = [w.text]
        last_y_group = y_group

    if current_line:
        combined_lines.append(" ".join(current_line))

    raw_text = "\n".join(combined_lines)
    layout_text = "\n\n".join(f"TEXT: {line}" for line in combined_lines)
    avg_conf = round(sum(w.confidence for w in all_words) / max(len(all_words), 1), 2)

    return OCRResult(
        words=all_words,
        raw_text=raw_text,
        layout_text=layout_text,
        average_confidence=avg_conf,
        word_count=len(all_words)
    )


def draw_bounding_boxes(
    image: np.ndarray,
    ocr_result: OCRResult,
    show_confidence: bool = True
) -> np.ndarray:
    """Draws color-coded bounding boxes and confidence tags around detected text."""
    annotated = image.copy()
    if len(annotated.shape) == 2:
        annotated = cv2.cvtColor(annotated, cv2.COLOR_GRAY2BGR)

    for word in ocr_result.words:
        x, y, w, h = word.x, word.y, word.width, word.height
        
        # Color coding: Green if confidence > 75, Orange if 50-75, Yellow if < 50
        if word.confidence >= 75:
            current_box_color = (0, 200, 0)
        elif word.confidence >= 50:
            current_box_color = (0, 165, 255)
        else:
            current_box_color = (0, 255, 255)

        # Draw bounding rectangle
        cv2.rectangle(annotated, (x, y), (x + w, y + h), current_box_color, 2)

        # Draw small confidence score above box if requested
        if show_confidence:
            label = f"{int(word.confidence)}%"
            font_scale = 0.4
            thickness = 1
            (tw, th), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, font_scale, thickness)
            cv2.rectangle(annotated, (x, max(0, y - th - 4)), (x + tw + 2, max(th + 4, y)), current_box_color, -1)
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
