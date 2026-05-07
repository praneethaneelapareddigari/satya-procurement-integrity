from fastapi import APIRouter, UploadFile, File, HTTPException
from app.services.criteria_engine import extract_criteria_from_text, get_mock_criteria
from app.services.document_parser import parse_document
import tempfile, os, shutil

router = APIRouter()

@router.post("/upload")
async def upload_tender(file: UploadFile = File(...)):
    """Upload and parse a tender document, extracting criteria."""
    with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.filename)[1]) as tmp:
        shutil.copyfileobj(file.file, tmp)
        tmp_path = tmp.name
    try:
        parsed = parse_document(tmp_path)
        criteria = extract_criteria_from_text(parsed["text"])
        return {"status": "success", "parsed": parsed, "criteria": criteria}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        os.unlink(tmp_path)

@router.get("/mock-criteria")
def get_mock():
    """Return mock criteria for demo."""
    return get_mock_criteria()
