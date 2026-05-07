"""
Module 4: Risk & Fraud Signal Detector
Detects cartel patterns, duplicate entities, and document anomalies across ALL bidders.
"""
import re
import hashlib
from typing import List
from fuzzywuzzy import fuzz


def detect_risk_signals(bidders_data: list) -> list:
    """
    Run all three risk detectors across all bidders.
    Returns list of risk signals for the officer dashboard.
    """
    signals = []
    signals.extend(_detect_document_similarity(bidders_data))
    signals.extend(_detect_duplicate_entities(bidders_data))
    signals.extend(_detect_metadata_anomalies(bidders_data))
    return signals


def _detect_document_similarity(bidders_data: list) -> list:
    """
    Signal 1: Compare all bidder submissions for unusual text similarity.
    High similarity (>70%) suggests coordinated/cartel bidding.
    """
    signals = []
    bidder_texts = {}

    for bidder in bidders_data:
        all_text = " ".join([doc.get("text", "") for doc in bidder["documents"]])
        bidder_texts[bidder["bidder_name"]] = all_text

    bidder_names = list(bidder_texts.keys())
    for i in range(len(bidder_names)):
        for j in range(i + 1, len(bidder_names)):
            name_a = bidder_names[i]
            name_b = bidder_names[j]
            text_a = bidder_texts[name_a]
            text_b = bidder_texts[name_b]

            if not text_a or not text_b:
                continue

            similarity = fuzz.token_set_ratio(text_a[:5000], text_b[:5000])

            if similarity >= 70:
                severity = "HIGH" if similarity >= 85 else "MEDIUM"
                signals.append({
                    "signal_type": "document_similarity",
                    "severity": severity,
                    "bidders_involved": [name_a, name_b],
                    "description": f"Document text similarity of {similarity}% detected between {name_a} and {name_b}. This may indicate coordinated submission or cartel bidding.",
                    "recommended_action": f"Officer review required — verify if {name_a} and {name_b} are related parties"
                })

    return signals


def _detect_duplicate_entities(bidders_data: list) -> list:
    """
    Signal 2: Extract GST, PAN, phone numbers, addresses and find duplicates across bidders.
    Duplicate identifiers across competing bidders = related parties.
    """
    signals = []

    gst_pattern = re.compile(r'\b\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}\b')
    pan_pattern = re.compile(r'\b[A-Z]{5}\d{4}[A-Z]{1}\b')
    phone_pattern = re.compile(r'\b[6-9]\d{9}\b')

    entity_map = {
        "gst": {},
        "pan": {},
        "phone": {}
    }

    for bidder in bidders_data:
        bidder_name = bidder["bidder_name"]
        all_text = " ".join([doc.get("text", "") for doc in bidder["documents"]])

        gst_numbers = set(gst_pattern.findall(all_text))
        pan_numbers = set(pan_pattern.findall(all_text))
        phone_numbers = set(phone_pattern.findall(all_text))

        for gst in gst_numbers:
            entity_map["gst"].setdefault(gst, []).append(bidder_name)
        for pan in pan_numbers:
            entity_map["pan"].setdefault(pan, []).append(bidder_name)
        for phone in phone_numbers:
            entity_map["phone"].setdefault(phone, []).append(bidder_name)

    # Find duplicates
    for entity_type, entity_data in entity_map.items():
        for entity_value, bidders in entity_data.items():
            if len(bidders) > 1:
                signals.append({
                    "signal_type": "duplicate_entity",
                    "severity": "HIGH",
                    "bidders_involved": bidders,
                    "description": f"Same {entity_type.upper()} number '{entity_value}' found in submissions from: {', '.join(bidders)}. This strongly suggests related parties or data fraud.",
                    "recommended_action": f"Investigate {entity_type.upper()} ownership — likely related party violation"
                })

    return signals


def _detect_metadata_anomalies(bidders_data: list) -> list:
    """
    Signal 3: Check PDF metadata for anomalies.
    (In production, checks creation dates, font anomalies, signature chains)
    For demo, uses mock detection on specific document patterns.
    """
    signals = []

    for bidder in bidders_data:
        for doc in bidder.get("documents", []):
            # Flag documents with very low OCR confidence
            if doc.get("confidence", 1.0) < 0.5:
                signals.append({
                    "signal_type": "metadata_anomaly",
                    "severity": "MEDIUM",
                    "bidders_involved": [bidder["bidder_name"]],
                    "description": f"Document '{doc['file_name']}' from {bidder['bidder_name']} has unusually low OCR confidence ({doc.get('confidence', 0):.0%}). This may indicate a tampered or fabricated document.",
                    "recommended_action": "Request original document directly from issuing authority"
                })

    return signals


def get_mock_risk_signals() -> list:
    """Mock risk signals for demo."""
    return [
        {
            "signal_type": "duplicate_entity",
            "severity": "HIGH",
            "bidders_involved": ["ABC Construction Ltd", "PQR Builders"],
            "description": "Same GSTIN '29AABCA1234R1ZX' found in submissions from ABC Construction Ltd and PQR Builders. This strongly suggests related parties or data fraud.",
            "recommended_action": "Investigate GST ownership — likely related party violation",
            "officer_response": None
        },
        {
            "signal_type": "metadata_anomaly",
            "severity": "MEDIUM",
            "bidders_involved": ["PQR Builders"],
            "description": "Document 'financial_pqr.pdf' from PQR Builders has OCR confidence of 58%. Document appears to be a scanned photograph rather than an official digital document.",
            "recommended_action": "Request original digitally signed financial statements from PQR Builders",
            "officer_response": None
        }
    ]
