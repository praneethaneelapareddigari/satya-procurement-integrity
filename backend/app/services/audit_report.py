"""
Audit Report Generator
Generates RTI-ready PDF audit reports for every evaluation.
"""
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.colors import HexColor, black, white, red, green, orange
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.units import cm
from datetime import datetime
import io


VERDICT_COLORS = {
    "ELIGIBLE": HexColor("#16a34a"),
    "NOT_ELIGIBLE": HexColor("#dc2626"),
    "NEEDS_REVIEW": HexColor("#d97706"),
    "ESCALATED": HexColor("#7c3aed"),
}


def generate_audit_report(
    tender_title: str,
    criteria: list,
    evaluation_results: list,
    risk_signals: list,
    officer_name: str = "Procurement Officer",
    evaluation_id: str = "EVAL-001"
) -> bytes:
    """
    Generate a complete RTI-ready PDF audit report.
    Returns PDF as bytes.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=2*cm,
        leftMargin=2*cm,
        topMargin=2*cm,
        bottomMargin=2*cm
    )

    styles = getSampleStyleSheet()
    story = []

    # Header
    title_style = ParagraphStyle('Title', parent=styles['Title'], fontSize=16, spaceAfter=6, textColor=HexColor("#1e3a5f"))
    subtitle_style = ParagraphStyle('Subtitle', parent=styles['Normal'], fontSize=10, spaceAfter=4, textColor=HexColor("#4b5563"))
    heading_style = ParagraphStyle('Heading', parent=styles['Heading2'], fontSize=12, spaceAfter=6, textColor=HexColor("#1e3a5f"))
    body_style = ParagraphStyle('Body', parent=styles['Normal'], fontSize=9, spaceAfter=4)
    small_style = ParagraphStyle('Small', parent=styles['Normal'], fontSize=8, textColor=HexColor("#6b7280"))

    story.append(Paragraph("SATYA — Procurement Integrity System", title_style))
    story.append(Paragraph("सत्य | RTI-Ready Audit Report", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=2, color=HexColor("#1e3a5f")))
    story.append(Spacer(1, 0.3*cm))

    # Metadata table
    now = datetime.now().strftime("%d %B %Y, %I:%M %p")
    meta_data = [
        ["Tender", tender_title],
        ["Evaluation ID", evaluation_id],
        ["Generated On", now],
        ["Evaluating Officer", officer_name],
        ["System Version", "SATYA v1.0.0"],
    ]
    meta_table = Table(meta_data, colWidths=[4*cm, 13*cm])
    meta_table.setStyle(TableStyle([
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('TEXTCOLOR', (0, 0), (0, -1), HexColor("#1e3a5f")),
        ('ROWBACKGROUNDS', (0, 0), (-1, -1), [HexColor("#f8fafc"), white]),
        ('GRID', (0, 0), (-1, -1), 0.5, HexColor("#e2e8f0")),
        ('PADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 0.5*cm))

    # Extracted Criteria
    story.append(Paragraph("1. Extracted Eligibility Criteria", heading_style))
    criteria_data = [["Code", "Category", "Status", "Description", "Threshold"]]
    for c in criteria:
        criteria_data.append([
            c["code"],
            c["category"],
            "MANDATORY" if c["is_mandatory"] else "OPTIONAL",
            c["description"][:60] + "..." if len(c["description"]) > 60 else c["description"],
            c.get("threshold_value") or "—"
        ])
    criteria_table = Table(criteria_data, colWidths=[1.5*cm, 2.5*cm, 2.5*cm, 8*cm, 3*cm])
    criteria_table.setStyle(TableStyle([
        ('FONTSIZE', (0, 0), (-1, -1), 8),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('BACKGROUND', (0, 0), (-1, 0), HexColor("#1e3a5f")),
        ('TEXTCOLOR', (0, 0), (-1, 0), white),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [HexColor("#f8fafc"), white]),
        ('GRID', (0, 0), (-1, -1), 0.5, HexColor("#e2e8f0")),
        ('PADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(criteria_table)
    story.append(Spacer(1, 0.5*cm))

    # Evaluation Summary
    story.append(Paragraph("2. Bidder Evaluation Summary", heading_style))
    summary_data = [["Bidder", "C1", "C2", "C3", "C4", "C5", "OVERALL", "Confidence"]]
    for result in evaluation_results:
        row = [result["bidder_name"]]
        for verdict in result["criterion_verdicts"]:
            v = verdict["verdict"]
            row.append(v[:3] if v == "NOT_ELIGIBLE" else v[:4])
        row.append(result["overall_verdict"])
        row.append(f"{result['overall_confidence']:.0%}")
        summary_data.append(row)

    summary_table = Table(summary_data, colWidths=[5*cm, 1.5*cm, 1.5*cm, 1.5*cm, 1.5*cm, 1.5*cm, 3*cm, 2*cm])
    summary_table.setStyle(TableStyle([
        ('FONTSIZE', (0, 0), (-1, -1), 8),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('BACKGROUND', (0, 0), (-1, 0), HexColor("#1e3a5f")),
        ('TEXTCOLOR', (0, 0), (-1, 0), white),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [HexColor("#f8fafc"), white]),
        ('GRID', (0, 0), (-1, -1), 0.5, HexColor("#e2e8f0")),
        ('PADDING', (0, 0), (-1, -1), 4),
        ('ALIGN', (1, 0), (-1, -1), 'CENTER'),
    ]))
    story.append(summary_table)
    story.append(Spacer(1, 0.5*cm))

    # Detailed verdicts
    story.append(Paragraph("3. Detailed Criterion-Level Verdicts", heading_style))
    for result in evaluation_results:
        story.append(Paragraph(f"Bidder: {result['bidder_name']} — {result['overall_verdict']}", body_style))
        for verdict in result["criterion_verdicts"]:
            v_text = (
                f"<b>{verdict['criterion_code']}</b> | {verdict['verdict']} ({verdict['confidence']:.0%}) | "
                f"Evidence: {verdict.get('evidence_value', '—')} | "
                f"Source: {verdict.get('evidence_source', '—')} | "
                f"{verdict.get('reasoning', '')[:120]}"
            )
            story.append(Paragraph(v_text, small_style))
        story.append(Spacer(1, 0.2*cm))

    story.append(Spacer(1, 0.3*cm))

    # Risk Signals
    story.append(Paragraph("4. Risk & Fraud Signals", heading_style))
    if risk_signals:
        for signal in risk_signals:
            signal_text = (
                f"<b>[{signal['severity']}]</b> {signal['signal_type'].upper()} | "
                f"Bidders: {', '.join(signal['bidders_involved'])} | "
                f"{signal['description'][:150]} | "
                f"Action: {signal['recommended_action']}"
            )
            story.append(Paragraph(signal_text, small_style))
            story.append(Spacer(1, 0.1*cm))
    else:
        story.append(Paragraph("No risk signals detected.", body_style))

    story.append(Spacer(1, 0.5*cm))

    # Officer signature
    story.append(HRFlowable(width="100%", thickness=1, color=HexColor("#e2e8f0")))
    story.append(Spacer(1, 0.3*cm))
    story.append(Paragraph("5. Officer Declaration & Signature", heading_style))
    story.append(Paragraph(
        "I, the undersigned Procurement Officer, have reviewed the AI-generated evaluation results above. "
        "All automated decisions have been verified and I accept responsibility for the final procurement decision "
        "as documented in this report. This report is RTI-compliant and audit-ready.",
        body_style
    ))
    story.append(Spacer(1, 1*cm))
    sign_data = [
        ["Officer Name:", officer_name, "Date:", now],
        ["Designation:", "___________________", "Signature:", "___________________"],
    ]
    sign_table = Table(sign_data, colWidths=[3*cm, 7*cm, 2*cm, 5*cm])
    sign_table.setStyle(TableStyle([
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (2, 0), (2, -1), 'Helvetica-Bold'),
        ('PADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(sign_table)

    story.append(Spacer(1, 0.5*cm))
    story.append(Paragraph(
        f"Generated by SATYA v1.0.0 | AI for Bharat Hackathon 2026 | Evaluation ID: {evaluation_id} | {now}",
        small_style
    ))

    doc.build(story)
    return buffer.getvalue()
