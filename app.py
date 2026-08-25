"""
app.py - Streamlit Web Application for AI-Powered ID Card Extraction.
Integrates OpenCV preprocessing, Tesseract OCR with Bounding Boxes,
Groq LLM for reasoning & classification, and Pydantic/Regex validation.
"""

import os
import io
import json
import streamlit as st
from PIL import Image
import numpy as np

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

# Import internal modules
from utils import (
    pil_to_cv2,
    cv2_to_pil,
    format_json_output,
    logger
)
from preprocessing import (
    assess_image_quality,
    preprocess_id_card
)
from ocr_engine import (
    extract_ocr_data,
    draw_bounding_boxes,
    check_tesseract_available,
    set_tesseract_path
)
from llm_extractor import extract_document_info, get_available_models
from validation import validate_and_clean_extraction
from document_classifier import classify_document_heuristics

# Page Configuration
st.set_page_config(
    page_title="ID Document Information Extraction",
    page_icon="🪪",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS for polished interface
st.markdown("""
<style>
    .main-header {
        font-size: 2.2rem;
        font-weight: 700;
        color: #1E3A8A;
        margin-bottom: 0.2rem;
    }
    .sub-header {
        font-size: 1.05rem;
        color: #4B5563;
        margin-bottom: 1.5rem;
    }
    .badge-card {
        padding: 8px 16px;
        border-radius: 8px;
        font-weight: bold;
        display: inline-block;
        margin-bottom: 15px;
    }
    .badge-aadhaar { background-color: #DBEAFE; color: #1E40AF; border: 1px solid #93C5FD; }
    .badge-pan { background-color: #FEF3C7; color: #92400E; border: 1px solid #FCD34D; }
    .badge-dl { background-color: #D1FAE5; color: #065F46; border: 1px solid #6EE7B7; }
    .badge-unsupported { background-color: #FEE2E2; color: #991B1B; border: 1px solid #FCA5A5; }
    .metric-box {
        background-color: #F8FAFC;
        border: 1px solid #E2E8F0;
        border-radius: 8px;
        padding: 12px;
        text-align: center;
    }
</style>
""", unsafe_allow_html=True)


# ------------------ SIDEBAR SETTINGS ------------------ #
with st.sidebar:
    st.image("https://img.icons8.com/color/96/id-verified.png", width=64)
    st.title("Settings & Config")
    
    st.markdown("### 🔑 Groq LLM API")
    env_api_key = os.getenv("GROQ_API_KEY", "")
    api_key_input = st.text_input(
        "Groq API Key",
        value=env_api_key if env_api_key != "your_groq_api_key_here" else "",
        type="password",
        help="Enter your Groq API key from https://console.groq.com/keys"
    )
    
    active_key = api_key_input.strip() if api_key_input else env_api_key
    model_options = get_available_models(active_key)
    env_model = os.getenv("GROQ_MODEL", model_options[0] if model_options else "openai/gpt-oss-120b")
    default_model_idx = model_options.index(env_model) if env_model in model_options else 0
    selected_model = st.selectbox("Groq Model", model_options, index=default_model_idx)

    st.divider()

    st.markdown("### 🔍 Tesseract OCR Config")
    tess_available, tess_msg = check_tesseract_available()
    if tess_available:
        st.success(f"✅ {tess_msg}")
    else:
        st.error(f"❌ {tess_msg}")
        custom_tess = st.text_input(
            "Custom Tesseract Path",
            value=os.getenv("TESSERACT_CMD", r"C:\Program Files\Tesseract-OCR\tesseract.exe"),
            help="Specify full path to tesseract.exe on Windows"
        )
        if custom_tess:
            if set_tesseract_path(custom_tess):
                st.success("Configured Tesseract path!")
                st.rerun()

    min_confidence = st.slider(
        "Min OCR Confidence (%)",
        min_value=10,
        max_value=80,
        value=25,
        step=5,
        help="Ignore words detected below this confidence score"
    )

    psm_mode = st.selectbox(
        "Tesseract PSM Mode",
        options=[11, 3, 4, 6],
        format_func=lambda x: {
            11: "11 - Sparse Text (Best for ID Cards & Badges)",
            3: "3 - Fully Automatic Segmentation",
            4: "4 - Single Column Variable Text",
            6: "6 - Single Uniform Block of Text"
        }.get(x, str(x)),
        index=0,
        help="Page Segmentation Mode for Tesseract. Mode 11 is optimal for laminated IDs with photos and chips."
    )

    st.divider()

    st.markdown("### 🛠️ Image Preprocessing")
    enable_glare = st.checkbox("Enable Glare & Lighting Compensation", value=True)
    enable_clahe = st.checkbox("Enable CLAHE (Contrast)", value=True)
    enable_denoise = st.checkbox("Enable Bilateral Denoising", value=True)
    enable_threshold = st.checkbox("Enable Binarization / Threshold", value=False)
    threshold_method = st.radio("Threshold Mode", ["otsu", "adaptive"], index=0) if enable_threshold else "otsu"

    st.divider()
    st.caption("🔒 Privacy First: Images are processed in memory and never permanently stored.")


# ------------------ MAIN INTERFACE ------------------ #
st.markdown('<div class="main-header">ID Document Information Extraction</div>', unsafe_allow_html=True)
st.markdown('<div class="sub-header">AI-Powered pipeline for Indian Aadhaar, PAN, and Driving Licence cards using OpenCV, Tesseract OCR, and Groq LLM.</div>', unsafe_allow_html=True)

# File Uploader
uploaded_file = st.file_uploader(
    "Upload an ID Document Image",
    type=["jpg", "jpeg", "png"],
    help="Supported formats: JPG, JPEG, PNG. Maximum recommended size: 10MB."
)

if uploaded_file is None:
    st.info("👆 Please upload an image of an **Aadhaar Card**, **PAN Card**, or **Driving Licence** to begin extraction.")
    
    # Quick visual guide
    st.markdown("### 📋 Supported Document Types & Extracted Fields")
    col1, col2, col3 = st.columns(3)
    with col1:
        st.markdown("""
        **🆔 Aadhaar Card**
        - Cardholder Name
        - Date / Year of Birth
        - Gender
        - Aadhaar Number (Masked)
        - Residential Address
        """)
    with col2:
        st.markdown("""
        **💳 PAN Card**
        - Cardholder Name
        - Father's Name
        - Date of Birth
        - PAN Number (ABCDE1234F)
        """)
    with col3:
        st.markdown("""
        **🚗 Driving Licence**
        - Holder Name
        - Date of Birth
        - DL Number
        - Address
        - Issue & Expiry Dates
        """)

else:
    # 1. Validate Uploaded File
    try:
        pil_image = Image.open(uploaded_file)
        # Convert to RGB if needed
        if pil_image.mode not in ("RGB", "L"):
            pil_image = pil_image.convert("RGB")
        cv2_orig = pil_to_cv2(pil_image)
    except Exception as img_err:
        st.error(f"❌ Failed to load image: {str(img_err)}. Please upload a valid image file.")
        st.stop()

    # Assess Image Quality & Blur
    quality_report = assess_image_quality(cv2_orig)
    if quality_report["is_blurry"]:
        st.warning(f"⚠️ **Image Quality Warning:** Image appears blurry (Sharpness Score: {quality_report['blur_score']}). OCR accuracy may be reduced.")
    if quality_report["is_too_small"]:
        st.warning(f"⚠️ **Resolution Warning:** Image dimensions ({quality_report['width']}x{quality_report['height']}) are small. Upscaling will be applied.")

    # 2. Preprocess Image
    with st.spinner("Processing image through OpenCV pipeline..."):
        cv2_preprocessed = preprocess_id_card(
            cv2_orig,
            enable_resize=True,
            enable_clahe=enable_clahe,
            enable_denoise=enable_denoise,
            enable_glare_reduction=enable_glare,
            enable_threshold=enable_threshold,
            threshold_method=threshold_method
        )

    # 3. Tesseract OCR with Bounding Boxes
    with st.spinner("Running Tesseract OCR & detecting text bounding boxes..."):
        try:
            ocr_result = extract_ocr_data(
                cv2_preprocessed,
                min_confidence=float(min_confidence),
                psm_mode=int(psm_mode)
            )
            # Create annotated bounding box image
            cv2_annotated = draw_bounding_boxes(cv2_orig, ocr_result, show_confidence=True)
        except RuntimeError as tess_err:
            st.error(f"❌ OCR Error: {str(tess_err)}")
            st.info("💡 Make sure Tesseract-OCR is installed on your machine and configured in the sidebar or `.env` file.")
            st.stop()
        except Exception as ocr_gen_err:
            st.error(f"❌ Unexpected OCR Error: {str(ocr_gen_err)}")
            st.stop()

    # 4. Check if text was found
    if ocr_result.word_count == 0 or not ocr_result.raw_text.strip():
        st.error("❌ No readable text could be detected from this image. Please check image orientation, lighting, or resolution.")
        st.stop()

    # Heuristic check
    heuristic_type, heuristic_conf, heuristic_scores = classify_document_heuristics(ocr_result.raw_text)
    heuristic_hint_str = f"Found strong pattern matching for: {heuristic_type.upper()}" if heuristic_type != "unsupported" else None

    # 5. Groq LLM Extraction
    active_api_key = api_key_input.strip() if api_key_input else None
    if not active_api_key:
        st.warning("⚠️ **Groq API Key Required:** Please enter your Groq API Key in the left sidebar to complete classification and extraction.")
        st.stop()

    with st.spinner(f"Sending OCR tokens to Groq LLM ({selected_model}) for reasoning & field extraction..."):
        raw_llm_json, llm_error = extract_document_info(
            ocr_raw_text=ocr_result.raw_text,
            ocr_layout_text=ocr_result.layout_text,
            api_key=active_api_key,
            model_name=selected_model,
            heuristic_hint=heuristic_hint_str
        )

    # Fallback if LLM marked unsupported but heuristics identified card
    if raw_llm_json.get("document_type") == "unsupported" and heuristic_type != "unsupported":
        raw_llm_json["document_type"] = heuristic_type

    if llm_error and raw_llm_json.get("document_type") == "unsupported":
        st.error(f"❌ LLM Extraction Error: {llm_error}")
        st.stop()

    # 6. Post-Validation and Cleaning
    final_result = validate_and_clean_extraction(
        raw_data=raw_llm_json,
        ocr_confidence=ocr_result.average_confidence,
        raw_ocr_text=ocr_result.raw_text
    )

    # ------------------ RESULTS DASHBOARD ------------------ #
    st.divider()
    
    # Header & Document Badge
    doc_type = final_result.document_type
    if doc_type == "aadhaar":
        badge_html = '<span class="badge-card badge-aadhaar">🆔 AADHAAR CARD DETECTED</span>'
    elif doc_type == "pan":
        badge_html = '<span class="badge-card badge-pan">💳 PAN CARD DETECTED</span>'
    elif doc_type == "driving_licence":
        badge_html = '<span class="badge-card badge-dl">🚗 DRIVING LICENCE DETECTED</span>'
    else:
        badge_html = '<span class="badge-card badge-unsupported">⚠️ UNSUPPORTED DOCUMENT</span>'
    
    st.markdown(badge_html, unsafe_allow_html=True)

    # Quick Metrics Bar
    m1, m2, m3, m4 = st.columns(4)
    with m1:
        st.metric("Detected Words", f"{ocr_result.word_count}")
    with m2:
        st.metric("Avg OCR Confidence", f"{ocr_result.average_confidence}%")
    with m3:
        st.metric("Image Sharpness", f"{quality_report['blur_score']}")
    with m4:
        st.metric("Classification Model", selected_model.split("-")[0].capitalize())

    # Display Validation Warnings if any
    if final_result.warnings:
        with st.expander("⚠️ Validation & Quality Alerts", expanded=False):
            for w in final_result.warnings:
                st.warning(f"- {w}")

    # Tabs for View Layout
    tab1, tab2, tab3, tab4 = st.tabs([
        "📊 Extracted Information",
        "🖼️ Visual Pipeline",
        "📝 OCR Text & Layout",
        "💻 Structured JSON Output"
    ])

    # TAB 1: Extracted Fields
    with tab1:
        if not final_result.is_valid or doc_type == "unsupported":
            st.error("The uploaded document could not be identified as an Aadhaar, PAN, or Driving Licence.")
            error_detail = getattr(final_result.data, "error", "Unsupported document type.")
            st.info(f"**Reason:** {error_detail}")
        else:
            st.subheader(f"Extracted Fields ({doc_type.replace('_', ' ').title()})")
            
            data_dict = final_result.data.model_dump()
            
            # Format and display in structured columns
            f_col1, f_col2 = st.columns(2)
            
            if doc_type == "aadhaar":
                with f_col1:
                    st.text_input("Name", value=data_dict.get("name") or "Not Found", disabled=True)
                    st.text_input("Date of Birth", value=data_dict.get("date_of_birth") or data_dict.get("year_of_birth") or "Not Found", disabled=True)
                    st.text_input("Gender", value=data_dict.get("gender") or "Not Found", disabled=True)
                with f_col2:
                    st.text_input("Aadhaar Number (Masked)", value=data_dict.get("aadhaar_number") or "Not Found", disabled=True)
                    st.text_area("Address", value=data_dict.get("address") or "Not Present on Front Side / Unreadable", disabled=True, height=120)

            elif doc_type == "pan":
                with f_col1:
                    st.text_input("Cardholder Name", value=data_dict.get("name") or "Not Found", disabled=True)
                    st.text_input("Father's Name", value=data_dict.get("father_name") or "Not Found", disabled=True)
                with f_col2:
                    st.text_input("Date of Birth", value=data_dict.get("date_of_birth") or "Not Found", disabled=True)
                    st.text_input("PAN Number", value=data_dict.get("pan_number") or "Not Found", disabled=True)

            elif doc_type == "driving_licence":
                with f_col1:
                    st.text_input("Licence Holder Name", value=data_dict.get("name") or "Not Found", disabled=True)
                    st.text_input("DL Number", value=data_dict.get("dl_number") or "Not Found", disabled=True)
                    st.text_input("Date of Birth", value=data_dict.get("date_of_birth") or "Not Found", disabled=True)
                with f_col2:
                    st.text_input("Issue Date", value=data_dict.get("issue_date") or "Not Found", disabled=True)
                    st.text_input("Valid Until", value=data_dict.get("valid_until") or "Not Found", disabled=True)
                    st.text_area("Address", value=data_dict.get("address") or "Not Found", disabled=True, height=70)

    # TAB 2: Visual Pipeline Images
    with tab2:
        img_col1, img_col2, img_col3 = st.columns(3)
        with img_col1:
            st.markdown("**1. Original Uploaded Image**")
            st.image(cv2_to_pil(cv2_orig), use_container_width=True)
        with img_col2:
            st.markdown("**2. OpenCV Preprocessed Image**")
            st.image(cv2_to_pil(cv2_preprocessed), use_container_width=True)
        with img_col3:
            st.markdown("**3. OCR Detected Bounding Boxes**")
            st.image(cv2_to_pil(cv2_annotated), use_container_width=True)

    # TAB 3: OCR Raw & Spatial Text
    with tab3:
        st.subheader("Raw Extracted Text")
        st.text_area("Plain OCR Lines", value=ocr_result.raw_text, height=200)
        
        st.subheader("Preserved Spatial Layout (Sent to Groq LLM)")
        st.text_area("Layout Tokens with Coordinates", value=ocr_result.layout_text, height=250)

    # TAB 4: JSON Output & Export
    with tab4:
        st.subheader("Structured JSON Result")
        formatted_json = format_json_output(final_result)
        st.code(formatted_json, language="json")

        # Download JSON Button
        st.download_button(
            label="⬇️ Download JSON Result",
            data=formatted_json,
            file_name=f"{doc_type}_extracted_{uploaded_file.name.rsplit('.', 1)[0]}.json",
            mime="application/json",
            use_container_width=True
        )
