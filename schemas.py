"""
schemas.py - Pydantic data schemas for ID Document Extraction Pipeline.
Defines data structures for OCR bounding boxes, document types, and extracted fields.
"""

from typing import List, Optional, Union, Literal
from pydantic import BaseModel, Field


class BoundingBox(BaseModel):
    """Bounding box coordinates and text metadata extracted from OCR."""
    text: str = Field(..., description="Detected text token")
    confidence: float = Field(..., description="OCR confidence score (0-100)")
    x: int = Field(..., description="X coordinate of top-left corner")
    y: int = Field(..., description="Y coordinate of top-left corner")
    width: int = Field(..., description="Width of bounding box")
    height: int = Field(..., description="Height of bounding box")


class OCRResult(BaseModel):
    """Aggregate result from OCR engine."""
    words: List[BoundingBox] = Field(default_factory=list, description="List of recognized word tokens with bounding boxes")
    raw_text: str = Field("", description="Raw concatenated text from document")
    layout_text: str = Field("", description="Spatial layout preserved text formatted for LLM")
    average_confidence: float = Field(0.0, description="Average confidence score across all tokens")
    word_count: int = Field(0, description="Total number of valid detected words")


class AadhaarData(BaseModel):
    """Extracted fields for Aadhaar Card."""
    document_type: Literal["aadhaar"] = "aadhaar"
    name: Optional[str] = Field(None, description="Full name of cardholder")
    date_of_birth: Optional[str] = Field(None, description="Date of birth in YYYY-MM-DD or raw format")
    year_of_birth: Optional[str] = Field(None, description="Year of birth if full DOB is not present")
    gender: Optional[str] = Field(None, description="Gender (Male/Female/Transgender)")
    aadhaar_number: Optional[str] = Field(None, description="12-digit Aadhaar number (masked in final output)")
    address: Optional[str] = Field(None, description="Complete address if present")


class PANData(BaseModel):
    """Extracted fields for PAN Card."""
    document_type: Literal["pan"] = "pan"
    name: Optional[str] = Field(None, description="Full name of cardholder")
    father_name: Optional[str] = Field(None, description="Father's name of cardholder")
    date_of_birth: Optional[str] = Field(None, description="Date of birth in YYYY-MM-DD or raw format")
    pan_number: Optional[str] = Field(None, description="10-character PAN number (e.g. ABCDE1234F)")


class DrivingLicenceData(BaseModel):
    """Extracted fields for Driving Licence."""
    document_type: Literal["driving_licence"] = "driving_licence"
    name: Optional[str] = Field(None, description="Full name of licence holder")
    date_of_birth: Optional[str] = Field(None, description="Date of birth in YYYY-MM-DD or raw format")
    dl_number: Optional[str] = Field(None, description="Driving licence number")
    address: Optional[str] = Field(None, description="Residential address")
    issue_date: Optional[str] = Field(None, description="Date of issue in YYYY-MM-DD format")
    valid_until: Optional[str] = Field(None, description="Licence expiry date in YYYY-MM-DD format")


class UnsupportedDocumentData(BaseModel):
    """Response when document is unsupported or unclassified."""
    document_type: Literal["unsupported"] = "unsupported"
    error: str = Field(
        default="Only Aadhaar Card, PAN Card and Driving Licence are supported.",
        description="Error message detailing unsupported document"
    )


# Union type for all supported extracted models
ExtractedData = Union[AadhaarData, PANData, DrivingLicenceData, UnsupportedDocumentData]


class FinalExtractionResult(BaseModel):
    """Final unified payload returned to the UI/API."""
    document_type: str
    is_valid: bool = Field(True, description="True if document is supported and validly parsed")
    data: ExtractedData
    warnings: List[str] = Field(default_factory=list, description="Validation warnings or data quality alerts")
    ocr_confidence: float = Field(0.0, description="Average OCR confidence score")
    raw_ocr_text: Optional[str] = Field(None, description="Raw OCR text extracted from image")
