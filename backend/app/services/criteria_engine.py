import json
from groq import Groq
import os
from dotenv import load_dotenv

load_dotenv()
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

CRITERIA_EXTRACTION_PROMPT = """You are an expert government procurement analyst for India.
Read this tender document and extract ALL eligibility criteria.
Return ONLY valid JSON with this structure:
{
  "tender_title": "string",
  "criteria": [
    {
      "code": "C1",
      "category": "Financial",
      "is_mandatory": true,
      "description": "description here",
      "threshold_value": "Rs. 5 crore",
      "evidence_required": "Audited financial statements"
    }
  ],
  "ambiguous_criteria": [],
  "extraction_notes": "any notes",
  "quality_issues": []
}"""

def extract_criteria_from_text(tender_text: str) -> dict:
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": CRITERIA_EXTRACTION_PROMPT},
            {"role": "user", "content": f"TENDER DOCUMENT:\n{tender_text[:12000]}"}
        ],
        temperature=0.1,
        max_tokens=3000
    )
    text = response.choices[0].message.content.strip()
    if "```" in text:
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
    return json.loads(text)

def get_mock_criteria() -> dict:
    return {
        "tender_title": "CRPF Construction Services Tender — Perimeter Wall & Security Infrastructure",
        "criteria": [
            {"code": "C1", "category": "Financial", "is_mandatory": True, "description": "Minimum annual turnover of Rs. 5 crore in each of the last 3 financial years", "threshold_value": "Rs. 5 crore per year", "evidence_required": "Audited financial statements certified by CA"},
            {"code": "C2", "category": "Technical", "is_mandatory": True, "description": "Minimum 3 similar construction projects completed in the last 5 years", "threshold_value": "3 projects worth at least Rs. 2 crore each", "evidence_required": "Experience certificates from clients"},
            {"code": "C3", "category": "Compliance", "is_mandatory": True, "description": "Valid GST registration", "threshold_value": None, "evidence_required": "GST registration certificate"},
            {"code": "C4", "category": "Compliance", "is_mandatory": True, "description": "ISO 9001:2015 quality management certification", "threshold_value": None, "evidence_required": "Valid ISO certificate"},
            {"code": "C5", "category": "Technical", "is_mandatory": False, "description": "Minimum 50 permanent employees on payroll", "threshold_value": "50 employees", "evidence_required": "ESI/PF records"}
        ],
        "ambiguous_criteria": [],
        "extraction_notes": "Standard CRPF construction tender",
        "quality_issues": []
    }
