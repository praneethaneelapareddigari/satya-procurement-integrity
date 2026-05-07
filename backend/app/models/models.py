from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class Tender(Base):
    __tablename__ = "tenders"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    file_path = Column(String)
    raw_text = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    criteria = relationship("Criterion", back_populates="tender")
    evaluations = relationship("Evaluation", back_populates="tender")


class Criterion(Base):
    __tablename__ = "criteria"

    id = Column(Integer, primary_key=True, index=True)
    tender_id = Column(Integer, ForeignKey("tenders.id"))
    code = Column(String)  # C1, C2, etc.
    category = Column(String)  # Financial, Technical, Compliance
    is_mandatory = Column(Boolean, default=True)
    description = Column(Text)
    threshold_value = Column(String, nullable=True)
    evidence_required = Column(String, nullable=True)
    tender = relationship("Tender", back_populates="criteria")


class Bidder(Base):
    __tablename__ = "bidders"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    documents = relationship("BidderDocument", back_populates="bidder")
    verdicts = relationship("CriterionVerdict", back_populates="bidder")


class BidderDocument(Base):
    __tablename__ = "bidder_documents"

    id = Column(Integer, primary_key=True, index=True)
    bidder_id = Column(Integer, ForeignKey("bidders.id"))
    file_path = Column(String)
    file_type = Column(String)  # pdf_clean, pdf_scanned, docx, image
    ocr_confidence = Column(Float, nullable=True)
    extracted_text = Column(Text, nullable=True)
    extracted_data = Column(JSON, nullable=True)
    bidder = relationship("Bidder", back_populates="documents")


class Evaluation(Base):
    __tablename__ = "evaluations"

    id = Column(Integer, primary_key=True, index=True)
    tender_id = Column(Integer, ForeignKey("tenders.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    officer_name = Column(String, nullable=True)
    status = Column(String, default="in_progress")  # in_progress, completed
    tender = relationship("Tender", back_populates="evaluations")
    verdicts = relationship("CriterionVerdict", back_populates="evaluation")
    risk_signals = relationship("RiskSignal", back_populates="evaluation")


class CriterionVerdict(Base):
    __tablename__ = "criterion_verdicts"

    id = Column(Integer, primary_key=True, index=True)
    evaluation_id = Column(Integer, ForeignKey("evaluations.id"))
    bidder_id = Column(Integer, ForeignKey("bidders.id"))
    criterion_id = Column(Integer, ForeignKey("criteria.id"))
    verdict = Column(String)  # ELIGIBLE, NOT_ELIGIBLE, NEEDS_REVIEW, ESCALATED
    confidence = Column(Float)
    evidence_value = Column(String, nullable=True)
    evidence_source = Column(String, nullable=True)  # filename, page
    reasoning = Column(Text, nullable=True)
    officer_override = Column(String, nullable=True)
    officer_note = Column(Text, nullable=True)
    evaluation = relationship("Evaluation", back_populates="verdicts")
    bidder = relationship("Bidder", back_populates="verdicts")


class RiskSignal(Base):
    __tablename__ = "risk_signals"

    id = Column(Integer, primary_key=True, index=True)
    evaluation_id = Column(Integer, ForeignKey("evaluations.id"))
    signal_type = Column(String)  # document_similarity, duplicate_entity, metadata_anomaly
    severity = Column(String)  # HIGH, MEDIUM, LOW
    bidders_involved = Column(JSON)  # list of bidder names
    description = Column(Text)
    recommended_action = Column(String)
    officer_response = Column(Text, nullable=True)
    evaluation = relationship("Evaluation", back_populates="risk_signals")
