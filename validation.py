"""
validation.py - Post-Extraction Validation and Data Sanitization Layer.
Applies rule-based regex checks, date normalization, format validation,
and PII masking for Indian ID documents.
"""

import re
from datetime import datetime
from typing import Dict, Any, List, Tuple, Optional
from schemas import (
    AadhaarData,
    PANData,
    DrivingLicenceData,
    UnsupportedDocumentData,
    FinalExtractionResult
)


def normalize_date(raw_date: Optional[str]) -> Tuple[Optional[str], Optional[str]]:
    """
    Normalizes various date formats (e.g. 15/08/2002, 15-08-2002, 2002/08/15)
    into standard ISO format (YYYY-MM-DD).

    Returns:
        Tuple of (normalized_date_str, warning_message_if_any)
    """
    if not raw_date or not isinstance(raw_date, str):
        return None, None

    date_str = raw_date.strip()
    if not date_str or date_str.lower() == "null" or date_str.lower() == "none":
        return None, None

    date_patterns = [
        ("%d/%m/%Y", r"^\d{1,2}/\d{1,2}/\d{4}$"),
        ("%d-%m-%Y", r"^\d{1,2}-\d{1,2}-\d{4}$"),
        ("%d.%m.%Y", r"^\d{1,2}\.\d{1,2}\.\d{4}$"),
        ("%Y-%m-%d", r"^\d{4}-\d{1,2}-\d{1,2}$"),
        ("%Y/%m/%d", r"^\d{4}/\d{1,2}/\d{1,2}$"),
        ("%d %b %Y", r"^\d{1,2}\s+[A-Za-z]{3}\s+\d{4}$"),
        ("%d %B %Y", r"^\d{1,2}\s+[A-Za-z]+\s+\d{4}$"),
    ]

    for fmt, regex in date_patterns:
        if re.match(regex, date_str):
            try:
                parsed = datetime.strptime(date_str, fmt)
                # Sanity check year
                if 1900 <= parsed.year <= datetime.now().year + 50:
                    return parsed.strftime("%Y-%m-%d"), None
                else:
                    return date_str, f"Date year '{parsed.year}' out of reasonable range."
            except ValueError:
                pass

    return date_str, f"Date '{date_str}' could not be normalized to YYYY-MM-DD."


def validate_and_mask_aadhaar(aadhaar_raw: Optional[str]) -> Tuple[Optional[str], List[str]]:
    """
    Validates that Aadhaar has exactly 12 digits and returns a masked version (********1234).
    """
    warnings = []
    if not aadhaar_raw:
        return None, ["Aadhaar number is missing."]

    # Strip whitespace, dashes, dots
    cleaned = re.sub(r"[\s\-\.]", "", str(aadhaar_raw))

    # Match 12 digits
    if re.match(r"^\d{12}$", cleaned):
        # Mask the first 8 digits for privacy compliance
        masked = "********" + cleaned[-4:]
        return masked, warnings
    
    # Check if already masked
    if re.match(r"^[\*xX]{8}\d{4}$", cleaned):
        return cleaned, warnings

    warnings.append(f"Aadhaar number '{aadhaar_raw}' does not match standard 12-digit format.")
    return aadhaar_raw, warnings


def validate_pan(pan_raw: Optional[str]) -> Tuple[Optional[str], List[str]]:
    """
    Validates PAN number against the standard regex: [A-Z]{5}[0-9]{4}[A-Z]{1}
    and checks 4th character status code.
    """
    warnings = []
    if not pan_raw:
        return None, ["PAN number is missing."]

    cleaned = pan_raw.strip().upper().replace(" ", "")

    pan_pattern = r"^[A-Z]{5}[0-9]{4}[A-Z]{1}$"
    if not re.match(pan_pattern, cleaned):
        warnings.append(f"PAN number '{pan_raw}' does not conform to AAAAA9999A format.")
        return cleaned, warnings

    # Entity character check (4th character)
    entity_char = cleaned[3]
    valid_entities = {
        'P': 'Individual',
        'C': 'Company',
        'H': 'HUF (Hindu Undivided Family)',
        'F': 'Firm / LLP',
        'A': 'Association of Persons (AOP)',
        'T': 'Trust',
        'B': 'Body of Individuals (BOI)',
        'L': 'Local Authority',
        'J': 'Artificial Juridical Person',
        'G': 'Government Agency'
    }
    if entity_char not in valid_entities:
        warnings.append(f"PAN 4th character '{entity_char}' is non-standard.")

    return cleaned, warnings


def validate_driving_licence(dl_raw: Optional[str]) -> Tuple[Optional[str], List[str]]:
    """
    Validates Driving Licence format across Indian states.
    Generally: 2-letter state code + 2-digit RTO + 4-digit year + 7-digit number.
    """
    warnings = []
    if not dl_raw:
        return None, ["Driving Licence number is missing."]

    cleaned = dl_raw.strip().upper().replace("-", " ").replace("/", " ")
    cleaned_no_space = cleaned.replace(" ", "")

    # State code list (standard Indian state codes)
    state_codes = [
        "AN", "AP", "AR", "AS", "BR", "CH", "CG", "DD", "DL", "DN", "GA", "GJ",
        "HR", "HP", "JH", "JK", "KA", "KL", "LA", "LD", "MH", "ML", "MN", "MP",
        "MZ", "NL", "OD", "PB", "PY", "RJ", "SK", "TN", "TR", "TS", "UK", "UP", "WB"
    ]

    prefix = cleaned_no_space[:2]
    if prefix not in state_codes:
        warnings.append(f"Driving licence state code '{prefix}' may be invalid.")

    # General length check for DL (typically 13-16 characters)
    if not (10 <= len(cleaned_no_space) <= 20):
        warnings.append(f"Driving licence length ({len(cleaned_no_space)}) is unusual.")

    return dl_raw.strip(), warnings


def sanitize_gender(gender_raw: Optional[str]) -> Optional[str]:
    """Standardizes gender text to Male/Female/Transgender."""
    if not gender_raw:
        return None
    g = gender_raw.strip().lower()
    if g.startswith("m") or "male" in g:
        return "Male"
    if g.startswith("f") or "female" in g:
        return "Female"
    if "trans" in g:
        return "Transgender"
    return gender_raw.strip().title()


def clean_name(name_raw: Optional[str]) -> Optional[str]:
    """Cleans up names by removing junk characters and normalizing spacing."""
    if not name_raw or not isinstance(name_raw, str):
        return None
    cleaned = re.sub(r"[^a-zA-Z\s\.]", "", name_raw).strip()
    cleaned = re.sub(r"\s+", " ", cleaned)
    return cleaned if len(cleaned) > 1 else None


def validate_and_clean_extraction(
    raw_data: Dict[str, Any],
    ocr_confidence: float = 0.0,
    raw_ocr_text: Optional[str] = None
) -> FinalExtractionResult:
    """
    Main validation pipeline that parses LLM output into typed Pydantic models,
    executes format rules, and computes warning logs.
    """
    doc_type = raw_data.get("document_type", "unsupported").lower()
    warnings: List[str] = []

    if doc_type == "aadhaar":
        # Check if aadhaar_number was missed by LLM, try fallback regex
        raw_num = raw_data.get("aadhaar_number")
        if not raw_num and raw_ocr_text:
            aadhaar_match = re.search(r"\b(\d{4}\s\d{4}\s\d{4})\b", raw_ocr_text) or re.search(r"\b(\d{12})\b", raw_ocr_text)
            if aadhaar_match:
                raw_num = aadhaar_match.group(1)

        # Validate Aadhaar fields
        name = clean_name(raw_data.get("name"))
        gender = sanitize_gender(raw_data.get("gender"))
        
        dob, dob_warn = normalize_date(raw_data.get("date_of_birth"))
        if dob_warn:
            warnings.append(dob_warn)

        yob = raw_data.get("year_of_birth")
        if yob and not re.match(r"^\d{4}$", str(yob)):
            warnings.append(f"Invalid year of birth: '{yob}'")
            yob = None

        aadhaar_num, num_warn = validate_and_mask_aadhaar(raw_num)
        warnings.extend(num_warn)

        address = raw_data.get("address")
        if address and isinstance(address, str):
            address = address.strip()

        aadhaar_model = AadhaarData(
            document_type="aadhaar",
            name=name,
            date_of_birth=dob,
            year_of_birth=str(yob) if yob else None,
            gender=gender,
            aadhaar_number=aadhaar_num,
            address=address
        )

        return FinalExtractionResult(
            document_type="aadhaar",
            is_valid=True,
            data=aadhaar_model,
            warnings=warnings,
            ocr_confidence=ocr_confidence,
            raw_ocr_text=raw_ocr_text
        )

    elif doc_type == "pan":
        # Check if pan_number was missed by LLM, try fallback regex
        raw_pan = raw_data.get("pan_number")
        if not raw_pan and raw_ocr_text:
            pan_match = re.search(r"\b([A-Z]{5}[0-9]{4}[A-Z]{1})\b", raw_ocr_text.upper())
            if pan_match:
                raw_pan = pan_match.group(1)

        # Validate PAN fields
        name = clean_name(raw_data.get("name"))
        father_name = clean_name(raw_data.get("father_name"))

        dob, dob_warn = normalize_date(raw_data.get("date_of_birth"))
        if dob_warn:
            warnings.append(dob_warn)

        pan_num, pan_warn = validate_pan(raw_pan)
        warnings.extend(pan_warn)

        pan_model = PANData(
            document_type="pan",
            name=name,
            father_name=father_name,
            date_of_birth=dob,
            pan_number=pan_num
        )

        return FinalExtractionResult(
            document_type="pan",
            is_valid=True,
            data=pan_model,
            warnings=warnings,
            ocr_confidence=ocr_confidence,
            raw_ocr_text=raw_ocr_text
        )

    elif doc_type == "driving_licence":
        # Validate Driving Licence fields
        name = clean_name(raw_data.get("name"))
        
        dob, dob_warn = normalize_date(raw_data.get("date_of_birth"))
        if dob_warn:
            warnings.append(dob_warn)

        issue_date, issue_warn = normalize_date(raw_data.get("issue_date"))
        if issue_warn:
            warnings.append(issue_warn)

        valid_until, valid_warn = normalize_date(raw_data.get("valid_until"))
        if valid_warn:
            warnings.append(valid_warn)

        dl_num, dl_warn = validate_driving_licence(raw_data.get("dl_number"))
        warnings.extend(dl_warn)

        address = raw_data.get("address")
        if address and isinstance(address, str):
            address = address.strip()

        dl_model = DrivingLicenceData(
            document_type="driving_licence",
            name=name,
            date_of_birth=dob,
            dl_number=dl_num,
            address=address,
            issue_date=issue_date,
            valid_until=valid_until
        )

        return FinalExtractionResult(
            document_type="driving_licence",
            is_valid=True,
            data=dl_model,
            warnings=warnings,
            ocr_confidence=ocr_confidence,
            raw_ocr_text=raw_ocr_text
        )

    else:
        error_msg = raw_data.get("error", "Only Aadhaar Card, PAN Card and Driving Licence are supported.")
        unsupported_model = UnsupportedDocumentData(
            document_type="unsupported",
            error=error_msg
        )
        return FinalExtractionResult(
            document_type="unsupported",
            is_valid=False,
            data=unsupported_model,
            warnings=["Document is not recognized as an Aadhaar, PAN, or Driving Licence."],
            ocr_confidence=ocr_confidence,
            raw_ocr_text=raw_ocr_text
        )
