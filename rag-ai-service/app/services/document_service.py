from sqlalchemy.orm import Session
from ..models.document import Document, Chunk
from ..services.extraction_service import extract_from_pdf, extract_from_docx
from ..services.chunking_service import chunk_pages
from ..services.embedding_service import embed_texts_batch
from typing import Tuple

def ingest_document(file_bytes: bytes, filename: str, db: Session) -> Tuple[str, int]:
    ext = filename.lower().rsplit(".", 1)[-1]

    if ext == "pdf":
        pages = extract_from_pdf(file_bytes)
    elif ext in ("docx", "doc"):
        pages = extract_from_docx(file_bytes)
    else:
        raise ValueError(f"Unsupported file type: .{ext}")

    if not pages:
        raise ValueError("No text could be extracted from this file.")

    chunks = chunk_pages(pages)
    if not chunks:
        raise ValueError("File produced no usable chunks after splitting.")

    # --- NEW: embed all chunks in one batch call ---
    texts      = [c["chunk_text"] for c in chunks]
    embeddings = embed_texts_batch(texts)

    document = Document(name=filename)
    db.add(document)
    db.flush()

    for chunk_data, vector in zip(chunks, embeddings):
        chunk = Chunk(
            document_id=document.id,
            chunk_text=chunk_data["chunk_text"],
            page_no=chunk_data["page_no"],
            embedding=vector,        # now populated
        )
        db.add(chunk)

    db.commit()
    return str(document.id), len(chunks)