from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Form
from sqlalchemy.orm import Session
from ..db.database import get_db
from ..services.document_service import ingest_document
from ..models.document import Document
from typing import Optional

router = APIRouter(prefix="/documents", tags=["documents"])

ALLOWED_TYPES = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword",
}

@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    user_id: Optional[str] = Form(None),   # ← accept user_id as form field
    db: Session = Depends(get_db),
):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="Only PDF and Word documents are supported.")

    file_bytes = await file.read()
    if len(file_bytes) > 20 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="File too large. Max 20 MB.")

    try:
        document_id, chunk_count = ingest_document(file_bytes, file.filename, db, user_id=user_id)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    return {"document_id": document_id, "filename": file.filename, "chunk_count": chunk_count}

@router.get("/")
def list_documents(user_id: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Document)
    if user_id:
        import uuid
        try:
            query = query.filter(Document.uploaded_by == uuid.UUID(user_id))
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid user_id format.")

    docs = query.order_by(Document.upload_date.desc()).all()

    return [                          # ✅ plain list, not {"documents": [...]}
        {
            "id":          str(d.id),
            "name":        d.name,
            "upload_date": d.upload_date.isoformat(),
        }
        for d in docs
    ]