from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..db.database import get_db
from ..models.document import Chunk
from ..services.embedding_service import embed_texts_batch

router = APIRouter(prefix="/admin", tags=["admin"])

@router.post("/backfill-embeddings")
def backfill_embeddings(db: Session = Depends(get_db)):
    """Embed any chunks that were saved without a vector (Phase 2 uploads)."""
    chunks = db.query(Chunk).filter(Chunk.embedding == None).all()

    if not chunks:
        return {"message": "Nothing to backfill — all chunks already have embeddings."}

    texts      = [c.chunk_text for c in chunks]
    embeddings = embed_texts_batch(texts)

    for chunk, vector in zip(chunks, embeddings):
        chunk.embedding = vector

    db.commit()
    return {"backfilled": len(chunks)}