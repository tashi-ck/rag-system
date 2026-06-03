from sqlalchemy.orm import Session
from sqlalchemy import text
from ..services.embedding_service import embed_text
from typing import List, Dict

TOP_K = 5   # how many chunks to retrieve per query

def retrieve_relevant_chunks(question: str, db: Session) -> List[Dict]:
    """
    1. Embed the question.
    2. Find the TOP_K most similar chunks via cosine distance.
    3. Return chunk text + document metadata for prompt building.
    """
    query_vector = embed_text(question)

    # pgvector's <=> is cosine distance (lower = more similar)
    # We cast the Python list to a vector literal that PostgreSQL understands
    sql = text("""
        SELECT
            c.id,
            c.chunk_text,
            c.page_no,
            d.name AS document_name,
            1 - (c.embedding <=> CAST(:query_vec AS vector)) AS similarity
        FROM chunks c
        JOIN documents d ON c.document_id = d.id
        WHERE c.embedding IS NOT NULL
        ORDER BY c.embedding <=> CAST(:query_vec AS vector)
        LIMIT :top_k
    """)

    rows = db.execute(sql, {
        "query_vec": str(query_vector),
        "top_k":     TOP_K,
    }).fetchall()

    return [
        {
            "chunk_text":     row.chunk_text,
            "document_name":  row.document_name,
            "page_no":        row.page_no,
            "similarity":     round(float(row.similarity), 4),
        }
        for row in rows
    ]