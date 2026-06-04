from sqlalchemy.orm import Session
from sqlalchemy import text
from ..services.embedding_service import embed_text
from typing import List, Dict

TOP_K = 5

def retrieve_relevant_chunks(
    question: str,
    db: Session,
    user_id: str = None,      # ← new parameter
) -> List[Dict]:

    query_vector = embed_text(question)

    # If user_id is provided, restrict to that user's documents only
    user_filter = "AND d.uploaded_by = CAST(:user_id AS uuid)" if user_id else ""

    sql = text(f"""
        SELECT
            c.chunk_text,
            c.page_no,
            d.name AS document_name,
            1 - (c.embedding <=> CAST(:query_vec AS vector)) AS similarity
        FROM chunks c
        JOIN documents d ON c.document_id = d.id
        WHERE c.embedding IS NOT NULL
        {user_filter}
        ORDER BY c.embedding <=> CAST(:query_vec AS vector)
        LIMIT :top_k
    """)

    params = {"query_vec": str(query_vector), "top_k": TOP_K}
    if user_id:
        params["user_id"] = user_id

    rows = db.execute(sql, params).fetchall()

    return [
        {
            "chunk_text":    row.chunk_text,
            "document_name": row.document_name,
            "page_no":       row.page_no,
            "similarity":    round(float(row.similarity), 4),
        }
        for row in rows
    ]