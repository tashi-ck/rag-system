from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.orm import Session
from ..db.database import get_db
from ..services.document_service import ingest_document

router = APIRouter(prefix="/documents", tags=["documents"])

ALLOWED_TYPES = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword",
}
MAX_FILE_SIZE = 20 * 1024 * 1024   # 20 MB

@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    # Validate file type
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Only PDF and Word documents are supported."
        )

    # Read and validate size
    file_bytes = await file.read()
    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail="File too large. Maximum size is 20 MB."
        )

    try:
        document_id, chunk_count = ingest_document(
            file_bytes=file_bytes,
            filename=file.filename,
            db=db,
        )
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Ingestion failed.")

    return {
        "document_id":  document_id,
        "filename":     file.filename,
        "chunk_count":  chunk_count,
        "status":       "ingested",
        "message":      f"Successfully split into {chunk_count} chunks. Embeddings pending.",
    }

@router.get("/")
def list_documents(db: Session = Depends(get_db)):
    from ..models.document import Document
    docs = db.query(Document).order_by(Document.upload_date.desc()).all()
    return [
        {
            "id":          str(d.id),
            "name":        d.name,
            "upload_date": d.upload_date.isoformat(),
        }
        for d in docs
    ]