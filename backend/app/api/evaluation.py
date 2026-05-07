from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from app.services.evaluation_engine import evaluate_all_bidders
from app.services.fraud_detector import detect_risk_signals, get_mock_risk_signals
from app.services.document_parser import get_mock_parsed_documents
from app.services.criteria_engine import get_mock_criteria

router = APIRouter()

class OfficerOverride(BaseModel):
    bidder_name: str
    criterion_code: str
    override_verdict: str
    officer_note: str


@router.post("/run-demo")
def run_demo_evaluation():
    """
    Run full demo evaluation using mock data.
    Returns complete evaluation results + risk signals.
    """
    criteria_data = get_mock_criteria()
    criteria = criteria_data["criteria"]
    bidders_data = get_mock_parsed_documents()

    # Run evaluations
    evaluation_results = evaluate_all_bidders(criteria, bidders_data, use_mock=True)

    # Run fraud detection
    risk_signals = get_mock_risk_signals()

    return {
        "status": "success",
        "tender_title": criteria_data["tender_title"],
        "criteria": criteria,
        "evaluation_results": evaluation_results,
        "risk_signals": risk_signals,
        "summary": {
            "total_bidders": len(evaluation_results),
            "eligible": sum(1 for r in evaluation_results if r["overall_verdict"] == "ELIGIBLE"),
            "not_eligible": sum(1 for r in evaluation_results if r["overall_verdict"] == "NOT_ELIGIBLE"),
            "needs_review": sum(1 for r in evaluation_results if r["overall_verdict"] in ["NEEDS_REVIEW", "ESCALATED"]),
            "risk_signals_count": len(risk_signals),
            "high_severity_signals": sum(1 for s in risk_signals if s["severity"] == "HIGH"),
        }
    }


@router.post("/officer-override")
def apply_officer_override(override: OfficerOverride):
    """Record officer override of an AI verdict."""
    return {
        "status": "success",
        "message": f"Override recorded for {override.bidder_name} - {override.criterion_code}",
        "override": override.dict()
    }
