import json
from groq import Groq
import os
from dotenv import load_dotenv

load_dotenv()
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

VERDICT_PROMPT = """You are a government procurement evaluator. Evaluate if a bidder meets a criterion.
Return ONLY valid JSON:
{
  "verdict": "ELIGIBLE or NOT_ELIGIBLE or NEEDS_REVIEW or ESCALATED",
  "confidence": 0.0,
  "evidence_value": "value found",
  "evidence_source": "filename and page",
  "reasoning": "explanation",
  "missing_info": "what is missing or null"
}"""

def evaluate_criterion(criterion, bidder_name, bidder_documents, use_mock=True):
    if use_mock:
        return _get_mock_verdict(criterion["code"], bidder_name)
    doc_context = "\n\n".join([f"--- {d['file_name']} (confidence: {d.get('confidence',1):.0%}) ---\n{d['text']}" for d in bidder_documents])
    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": VERDICT_PROMPT},
                {"role": "user", "content": f"CRITERION: {criterion['description']}\nRequired: {criterion.get('threshold_value')}\nMandatory: {criterion['is_mandatory']}\n\nBIDDER: {bidder_name}\n\nDOCUMENTS:\n{doc_context[:8000]}"}
            ],
            temperature=0.1,
            max_tokens=800
        )
        text = response.choices[0].message.content.strip()
        if "```" in text:
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]
        result = json.loads(text)
        conf = result.get("confidence", 0.5)
        if conf < 0.60:
            result["verdict"] = "ESCALATED"
        elif conf < 0.85:
            result["verdict"] = "NEEDS_REVIEW"
        return result
    except Exception as e:
        return {"verdict": "ESCALATED", "confidence": 0.0, "evidence_value": None, "evidence_source": None, "reasoning": f"Error: {str(e)}", "missing_info": "Manual review required"}

def evaluate_all_bidders(criteria, bidders_data, use_mock=True):
    results = []
    for bidder_data in bidders_data:
        bidder_name = bidder_data["bidder_name"]
        documents = bidder_data["documents"]
        bidder_result = {"bidder_name": bidder_name, "criterion_verdicts": [], "overall_verdict": None, "overall_confidence": None}
        for criterion in criteria:
            verdict = evaluate_criterion(criterion, bidder_name, documents, use_mock=use_mock)
            verdict["criterion_code"] = criterion["code"]
            verdict["criterion_description"] = criterion["description"]
            verdict["is_mandatory"] = criterion["is_mandatory"]
            bidder_result["criterion_verdicts"].append(verdict)
        bidder_result = _determine_overall_verdict(bidder_result)
        results.append(bidder_result)
    return results

def _determine_overall_verdict(bidder_result):
    verdicts = bidder_result["criterion_verdicts"]
    mandatory = [v for v in verdicts if v["is_mandatory"]]
    if any(v["verdict"] == "ESCALATED" for v in mandatory):
        overall = "ESCALATED"
    elif any(v["verdict"] == "NOT_ELIGIBLE" for v in mandatory):
        overall = "NOT_ELIGIBLE"
    elif any(v["verdict"] == "NEEDS_REVIEW" for v in mandatory):
        overall = "NEEDS_REVIEW"
    elif all(v["verdict"] == "ELIGIBLE" for v in mandatory):
        overall = "ELIGIBLE"
    else:
        overall = "NEEDS_REVIEW"
    confidences = [v["confidence"] for v in mandatory]
    bidder_result["overall_verdict"] = overall
    bidder_result["overall_confidence"] = round(sum(confidences)/len(confidences), 3) if confidences else 0.5
    return bidder_result

def _get_mock_verdict(criterion_code, bidder_name):
    mock_data = {
        "ABC Construction Ltd": {
            "C1": {"verdict": "ELIGIBLE", "confidence": 0.91, "evidence_value": "Rs. 7.2 crore (FY24-25)", "evidence_source": "financial_statement.pdf, page 1", "reasoning": "Turnover of Rs. 7.2 crore exceeds required Rs. 5 crore.", "missing_info": None},
            "C2": {"verdict": "ELIGIBLE", "confidence": 0.88, "evidence_value": "4 similar projects", "evidence_source": "experience_letter.pdf, page 1", "reasoning": "4 projects found, all above Rs. 2 crore, within last 5 years.", "missing_info": None},
            "C3": {"verdict": "ELIGIBLE", "confidence": 0.99, "evidence_value": "GSTIN: 29AABCA1234R1ZX", "evidence_source": "gst_certificate.pdf, page 1", "reasoning": "Valid GST registration. Status: Active.", "missing_info": None},
            "C4": {"verdict": "ELIGIBLE", "confidence": 0.87, "evidence_value": "ISO 9001:2015 certified (valid till 2026)", "evidence_source": "iso_certificate.pdf, page 1", "reasoning": "Valid ISO 9001:2015 certificate found. Expiry date confirmed.", "missing_info": None},
            "C5": {"verdict": "ELIGIBLE", "confidence": 0.84, "evidence_value": "73 employees", "evidence_source": "experience_letter.pdf", "reasoning": "73 employees exceeds optional requirement of 50.", "missing_info": None},
        },
        "XYZ Infrastructure Pvt Ltd": {
            "C1": {"verdict": "NOT_ELIGIBLE", "confidence": 0.92, "evidence_value": "Rs. 3.1 crore", "evidence_source": "financials_xyz.pdf", "reasoning": "Turnover of Rs. 3.1 crore is below required Rs. 5 crore.", "missing_info": None},
            "C2": {"verdict": "NOT_ELIGIBLE", "confidence": 0.87, "evidence_value": "2 projects", "evidence_source": "projects_xyz.docx", "reasoning": "Only 2 projects found, minimum is 3.", "missing_info": None},
            "C3": {"verdict": "ELIGIBLE", "confidence": 0.97, "evidence_value": "GSTIN: 27AABCX5678Q1ZY", "evidence_source": "gst_xyz.pdf", "reasoning": "Valid GST registration.", "missing_info": None},
            "C4": {"verdict": "NEEDS_REVIEW", "confidence": 0.45, "evidence_value": None, "evidence_source": None, "reasoning": "No ISO certificate found.", "missing_info": "ISO certificate not submitted"},
            "C5": {"verdict": "NEEDS_REVIEW", "confidence": 0.40, "evidence_value": None, "evidence_source": None, "reasoning": "No employee records submitted.", "missing_info": "Employee records not submitted"},
        },
        "PQR Builders": {
            "C1": {"verdict": "ESCALATED", "confidence": 0.42, "evidence_value": "Rs. ~6 crore (unclear)", "evidence_source": "financial_pqr.pdf (LOW OCR)", "reasoning": "Financial document OCR confidence only 58%. Figures unreadable.", "missing_info": "Request clear digital copy"},
            "C2": {"verdict": "ELIGIBLE", "confidence": 0.89, "evidence_value": "3 projects", "evidence_source": "exp_pqr.pdf", "reasoning": "3 valid construction projects found within last 5 years.", "missing_info": None},
            "C3": {"verdict": "NEEDS_REVIEW", "confidence": 0.75, "evidence_value": "GSTIN: 29AABCA1234R1ZX", "evidence_source": "gst_pqr.pdf", "reasoning": "WARNING: Same GSTIN as ABC Construction Ltd. Possible fraud.", "missing_info": "Verify GST ownership"},
            "C4": {"verdict": "NEEDS_REVIEW", "confidence": 0.50, "evidence_value": None, "evidence_source": None, "reasoning": "No ISO certificate found.", "missing_info": "ISO certificate not submitted"},
            "C5": {"verdict": "NEEDS_REVIEW", "confidence": 0.45, "evidence_value": None, "evidence_source": None, "reasoning": "No employee records submitted.", "missing_info": "Not submitted"},
        }
    }
    return mock_data.get(bidder_name, {}).get(criterion_code, {"verdict": "NEEDS_REVIEW", "confidence": 0.5, "evidence_value": None, "evidence_source": None, "reasoning": "No data available", "missing_info": "Manual review required"})
