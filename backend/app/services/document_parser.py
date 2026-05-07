"""
Module 2: Multi-Modal Document Parser
Handles all document types: clean PDFs, scanned PDFs, Word files, images.
"""
import io
import os
from typing import Optional
from pathlib import Path


def detect_document_type(file_path: str) -> str:
    """Detect document type from extension and content."""
    ext = Path(file_path).suffix.lower()
    if ext == ".docx":
        return "docx"
    elif ext in [".jpg", ".jpeg", ".png", ".bmp", ".tiff"]:
        return "image"
    elif ext == ".pdf":
        return "pdf"
    return "unknown"


def extract_text_from_pdf(file_path: str) -> dict:
    """
    Tiered PDF extraction:
    1. Try pdfplumber for clean digital PDFs
    2. Fall back to PaddleOCR for scanned PDFs
    """
    import pdfplumber

    result = {
        "text": "",
        "method": "pdfplumber",
        "confidence": 1.0,
        "page_count": 0,
        "needs_ocr": False,
        "pages": []
    }

    try:
        with pdfplumber.open(file_path) as pdf:
            result["page_count"] = len(pdf.pages)
            all_text = []

            for i, page in enumerate(pdf.pages):
                page_text = page.extract_text() or ""
                char_count = len(page_text.strip())

                if char_count < 50:
                    # Page likely scanned — use OCR
                    ocr_result = _ocr_page(page, i + 1)
                    all_text.append(ocr_result["text"])
                    result["pages"].append({
                        "page_num": i + 1,
                        "method": "ocr",
                        "confidence": ocr_result["confidence"],
                        "text": ocr_result["text"]
                    })
                    if ocr_result["confidence"] < 0.7:
                        result["needs_ocr"] = True
                else:
                    all_text.append(page_text)
                    result["pages"].append({
                        "page_num": i + 1,
                        "method": "pdfplumber",
                        "confidence": 1.0,
                        "text": page_text
                    })

            result["text"] = "\n\n".join(all_text)

            # Calculate average confidence
            confidences = [p["confidence"] for p in result["pages"]]
            result["confidence"] = sum(confidences) / len(confidences) if confidences else 1.0

    except Exception as e:
        result["error"] = str(e)
        result["confidence"] = 0.0

    return result


def _ocr_page(page, page_num: int) -> dict:
    """Run PaddleOCR on a single PDF page."""
    try:
        import pytesseract
        import numpy as np

        ocr = PaddleOCR(use_angle_cls=True, lang='en', show_log=False)

        # Convert page to image
        page_image = page.to_image(resolution=200).original
        img_array = np.array(page_image)

        result = ocr.ocr(img_array, cls=True)

        if not result or not result[0]:
            return {"text": "", "confidence": 0.3}

        texts = []
        confidences = []
        for line in result[0]:
            text = line[1][0]
            conf = line[1][1]
            texts.append(text)
            confidences.append(conf)

        avg_confidence = sum(confidences) / len(confidences) if confidences else 0.3
        return {
            "text": " ".join(texts),
            "confidence": avg_confidence
        }
    except Exception as e:
        return {"text": f"[OCR Error: {str(e)}]", "confidence": 0.1}


def extract_text_from_docx(file_path: str) -> dict:
    """Extract text from Word documents."""
    try:
        from docx import Document
        doc = Document(file_path)
        paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
        text = "\n".join(paragraphs)
        return {
            "text": text,
            "method": "python-docx",
            "confidence": 1.0,
            "page_count": None
        }
    except Exception as e:
        return {"text": "", "error": str(e), "confidence": 0.0}


def extract_text_from_image(file_path: str) -> dict:
    """Extract text from image files using PaddleOCR."""
    try:
        import pytesseract

        ocr = PaddleOCR(use_angle_cls=True, lang='en', show_log=False)
        result = ocr.ocr(file_path, cls=True)

        if not result or not result[0]:
            return {"text": "", "confidence": 0.2, "method": "paddleocr", "needs_human_review": True}

        texts = []
        confidences = []
        for line in result[0]:
            texts.append(line[1][0])
            confidences.append(line[1][1])

        avg_conf = sum(confidences) / len(confidences) if confidences else 0.2
        return {
            "text": " ".join(texts),
            "confidence": avg_conf,
            "method": "paddleocr",
            "needs_human_review": avg_conf < 0.7
        }
    except Exception as e:
        return {"text": "", "error": str(e), "confidence": 0.0, "needs_human_review": True}


def parse_document(file_path: str) -> dict:
    """
    Main entry point. Detect document type and parse accordingly.
    Returns standardized result with text and confidence.
    """
    doc_type = detect_document_type(file_path)

    if doc_type == "pdf":
        result = extract_text_from_pdf(file_path)
    elif doc_type == "docx":
        result = extract_text_from_docx(file_path)
    elif doc_type == "image":
        result = extract_text_from_image(file_path)
    else:
        result = {"text": "", "confidence": 0.0, "error": f"Unsupported file type: {doc_type}"}

    result["doc_type"] = doc_type
    result["file_path"] = file_path
    result["file_name"] = Path(file_path).name

    return result


def get_mock_parsed_documents() -> list:
    """Mock parsed documents for demo."""
    return [
        {
            "bidder_name": "ABC Construction Ltd",
            "documents": [
                {
                    "file_name": "financial_statement.pdf",
                    "doc_type": "pdf",
                    "method": "pdfplumber",
                    "confidence": 0.97,
                    "text": "ABC Construction Ltd Annual Report FY 2024-25. Total turnover: Rs. 7.2 crore. FY 2023-24 turnover: Rs. 6.8 crore. FY 2022-23 turnover: Rs. 5.5 crore. Certified by CA Rajesh Kumar, M.No. 123456."
                },
                {
                    "file_name": "experience_letter.pdf",
                    "doc_type": "pdf",
                    "method": "pdfplumber",
                    "confidence": 0.95,
                    "text": "This is to certify that ABC Construction Ltd has successfully completed the following projects: 1. Boundary wall construction at CISF Camp, Pune - Rs. 3.2 crore (2022). 2. Security infrastructure at BSF HQ, Delhi - Rs. 4.1 crore (2023). 3. Perimeter fencing at CRPF Training Centre, Hyderabad - Rs. 2.8 crore (2024). 4. Guard post construction at Police Academy, Bengaluru - Rs. 2.3 crore (2025)."
                },
                {
                    "file_name": "gst_certificate.pdf",
                    "doc_type": "pdf",
                    "method": "pdfplumber",
                    "confidence": 0.99,
                    "text": "GST Registration Certificate. GSTIN: 29AABCA1234R1ZX. Legal Name: ABC Construction Ltd. Registration Date: 01/07/2017. Status: Active."
                },
                {
                    "file_name": "iso_certificate_scan.jpg",
                    "doc_type": "image",
                    "method": "paddleocr",
                    "confidence": 0.61,
                    "text": "ISO 9001 2015 Certificate ABC Construction Ltd Quality Management System Certificate Number QMS-2024-0891 Valid Until December 2026",
                    "needs_human_review": True
                }
            ]
        },
        {
            "bidder_name": "XYZ Infrastructure Pvt Ltd",
            "documents": [
                {
                    "file_name": "financials_xyz.pdf",
                    "doc_type": "pdf",
                    "method": "pdfplumber",
                    "confidence": 0.94,
                    "text": "XYZ Infrastructure Pvt Ltd. Annual turnover FY 2024-25: Rs. 3.1 crore. FY 2023-24: Rs. 2.8 crore. FY 2022-23: Rs. 2.4 crore."
                },
                {
                    "file_name": "projects_xyz.docx",
                    "doc_type": "docx",
                    "method": "python-docx",
                    "confidence": 1.0,
                    "text": "Project Experience: 1. Road construction project, Pune Municipal Corp - Rs. 1.8 crore (2024). 2. Bridge repair work, NHAI - Rs. 2.1 crore (2023)."
                },
                {
                    "file_name": "gst_xyz.pdf",
                    "doc_type": "pdf",
                    "method": "pdfplumber",
                    "confidence": 0.98,
                    "text": "GST Registration. GSTIN: 27AABCX5678Q1ZY. Legal Name: XYZ Infrastructure Pvt Ltd. Status: Active."
                }
            ]
        },
        {
            "bidder_name": "PQR Builders",
            "documents": [
                {
                    "file_name": "financial_pqr.pdf",
                    "doc_type": "pdf",
                    "method": "ocr",
                    "confidence": 0.58,
                    "text": "PQR Builders Turnover Annual Rs crore 2024 6 [unclear] certified accounts",
                    "needs_human_review": True
                },
                {
                    "file_name": "exp_pqr.pdf",
                    "doc_type": "pdf",
                    "method": "pdfplumber",
                    "confidence": 0.91,
                    "text": "PQR Builders project experience: 1. Construction of security wall at Central University - Rs. 2.5 crore (2023). 2. Boundary fencing at Industrial Estate - Rs. 3.0 crore (2022). 3. CRPF accommodation block - Rs. 2.2 crore (2024)."
                },
                {
                    "file_name": "gst_pqr.pdf",
                    "doc_type": "pdf",
                    "method": "pdfplumber",
                    "confidence": 0.97,
                    "text": "GSTIN: 29AABCA1234R1ZX. Legal Name: PQR Builders. Status: Active."
                }
            ]
        }
    ]
