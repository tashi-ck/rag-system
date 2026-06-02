from sqlalchemy.orm import Session
from ..models.document import Document, Chunk
from ..services.extraction_service import extract_from_pdf, extract_from_docx
from ..services.chunking_service import chunk_pages
from typing import Tuple
import uuid

def ingest_document(
    file_bytes: bytes,
    filename: str,
    db: Session
) -> Tuple[str, int]:
    """
    Full pipeline: extract → chunk → save.
    Returns (document_id, chunk_count).
    """

    # 1. Extract text based on file type
    ext = filename.lower().rsplit(".", 1)[-1]

    if ext == "pdf":
        pages = extract_from_pdf(file_bytes)
    elif ext in ("docx", "doc"):
        pages = extract_from_docx(file_bytes)
    else:
        raise ValueError(f"Unsupported file type: .{ext}")

    if not pages:
        raise ValueError("No text could be extracted from this file.")

    # 2. Chunk the extracted pages
    chunks = chunk_pages(pages)

    if not chunks:
        raise ValueError("File produced no usable chunks after splitting.")

    # 3. Save document record
    document = Document(name=filename)
    db.add(document)
    db.flush()   # get the ID before committing

    # 4. Save all chunks (embeddings added in Phase 3)
    for chunk_data in chunks:
        chunk = Chunk(
            document_id=document.id,
            chunk_text=chunk_data["chunk_text"],
            page_no=chunk_data["page_no"],
            embedding=None,   # Phase 3 will fill this
        )
        db.add(chunk)

    db.commit()

    return str(document.id), len(chunks)