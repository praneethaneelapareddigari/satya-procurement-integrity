from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import tender, bidder, evaluation, audit
from app.core.database import engine, Base

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="SATYA — Procurement Integrity System",
    description="AI-Powered Tender Evaluation & Eligibility Analysis for Government Procurement",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(tender.router, prefix="/api/tender", tags=["Tender"])
app.include_router(bidder.router, prefix="/api/bidder", tags=["Bidder"])
app.include_router(evaluation.router, prefix="/api/evaluation", tags=["Evaluation"])
app.include_router(audit.router, prefix="/api/audit", tags=["Audit"])


@app.get("/")
def root():
    return {"message": "SATYA API is running", "version": "1.0.0"}


@app.get("/health")
def health():
    return {"status": "healthy"}
