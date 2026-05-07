from fastapi import APIRouter
from fastapi.responses import Response
from app.services.audit_report import generate_audit_report
from app.services.criteria_engine import get_mock_criteria
from app.services.evaluation_engine import evaluate_all_bidders
from app.services.fraud_detector import get_mock_risk_signals
from app.services.document_parser import get_mock_parsed_documents

router = APIRouter()

@router.get("/generate-demo-report")
def generate_demo_report(officer_name: str = "Procurement Officer"):
    """Generate a demo RTI-ready audit report PDF."""
    criteria_data = get_mock_criteria()
    criteria = criteria_data["criteria"]
    bidders_data = get_mock_parsed_documents()
    evaluation_results = evaluate_all_bidders(criteria, bidders_data, use_mock=True)
    risk_signals = get_mock_risk_signals()

    pdf_bytes = generate_audit_report(
        tender_title=criteria_data["tender_title"],
        criteria=criteria,
        evaluation_results=evaluation_results,
        risk_signals=risk_signals,
        officer_name=officer_name,
        evaluation_id="SATYA-DEMO-001"
    )

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=SATYA_Audit_Report.pdf"}
    )
