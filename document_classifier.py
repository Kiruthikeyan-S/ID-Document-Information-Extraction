"""
document_classifier.py - Heuristic and Rule-based Document Classifier.
Assists the pipeline by detecting signature patterns of Indian ID documents
(Aadhaar, PAN, Driving Licence).
"""

import re
from typing import Tuple, Dict


# Keywords and RegEx patterns for heuristic identification
PATTERNS = {
    "aadhaar": [
        r"unique identification authority of india",
        r"government of india",
        r"aadhaar",
        r"enrollment no",
        r"mera aadhaar",
        r"\b\d{4}\s\d{4}\s\d{4}\b",
        r"\b\d{12}\b",
        r"uidai",
        r"vid\s*:",
    ],
    "pan": [
        r"income tax department",
        r"permanent account number",
        r"govt of india",
        r"pan card",
        r"\b[a-z]{5}[0-9]{4}[a-z]\b",
        r"father'?s?\s*name",
    ],
    "driving_licence": [
        r"driving licen[cs]e",
        r"indian union driving licen[cs]e",
        r"motor vehicles? department",
        r"transport department",
        r"government of [a-z\s]+",
        r"union of india",
        r"form\s*7",
        r"dl\s*no",
        r"licence to drive",
        r"authorisation to drive",
        r"validity",
        r"non[- ]transport",
        r"\b(tn|dl|mh|ka|kl|up|ap|ts|rj|mp|gj|hr|pb|wb)\d{2}\s*\d{4,14}\b",
    ]
}


def classify_document_heuristics(ocr_text: str) -> Tuple[str, float, Dict[str, int]]:
    """
    Classifies document type based on keyword frequency and regex matching.
    
    Args:
        ocr_text: Raw or layout text extracted by OCR.
        
    Returns:
        Tuple containing (best_match_type, confidence_score_0_to_1, score_breakdown)
    """
    text_lower = ocr_text.lower()
    scores = {"aadhaar": 0, "pan": 0, "driving_licence": 0}

    for doc_type, patterns in PATTERNS.items():
        for pattern in patterns:
            matches = len(re.findall(pattern, text_lower))
            if matches > 0:
                scores[doc_type] += matches * 2

    # High-priority exact identifiers
    if re.search(r"\b[a-z]{5}[0-9]{4}[a-z]\b", text_lower):
        scores["pan"] += 5
    if re.search(r"\b\d{4}\s\d{4}\s\d{4}\b", text_lower):
        scores["aadhaar"] += 5
    if re.search(r"driving licen[cs]e|dl\s*no", text_lower):
        scores["driving_licence"] += 5

    total_score = sum(scores.values())
    if total_score == 0:
        return "unsupported", 0.0, scores

    best_match = max(scores, key=scores.get)
    best_score = scores[best_match]
    confidence = min(round(best_score / max(total_score, 1), 2), 1.0)

    # If the score is too low, treat as unsupported
    if best_score < 2:
        return "unsupported", confidence, scores

    return best_match, confidence, scores
