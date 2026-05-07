from fastapi import APIRouter, UploadFile, File
from app.services.document_parser import parse_document, get_mock_parsed_documents
import tempfile, os, shutil

router = APIRouter()

@router.post("/upload")
async def upload_bidder_document(bidder_name: str, file: UploadFile = File(...)):
    """Upload and parse a bidder document."""
    with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.filename)[1]) as tmp:
        shutil.copyfileobj(file.file, tmp)
        tmp_path = tmp.name
    try:
        parsed = parse_document(tmp_path)
        parsed["bidder_name"] = bidder_name
        return {"status": "success", "parsed": parsed}
    finally:
        os.unlink(tmp_path)

@router.get("/mock-bidders")
def get_mock_bidders():
    """Return mock bidder documents for demo."""
    return get_mock_parsed_documents()
