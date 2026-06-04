from openai import OpenAI
from sqlalchemy.orm import Session
from ..services.retrieval_service import retrieve_relevant_chunks
from typing import Dict
import os

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
SIMILARITY_THRESHOLD = 0.3

def build_prompt(question: str, chunks: list) -> str:
    context_blocks = []
    for i, chunk in enumerate(chunks, 1):
        context_blocks.append(
            f"[Source {i}: {chunk['document_name']}, page {chunk['page_no']}]\n"
            f"{chunk['chunk_text']}"
        )
    return f"""You are a helpful assistant. Answer strictly using the provided context.
If the answer is not in the context, say "I don't have enough information to answer this."

CONTEXT:
{chr(10).join(context_blocks)}

QUESTION: {question}
ANSWER:"""

def answer_question(
    question: str,
    db: Session,
    user_id: str = None,      # ← new parameter
) -> Dict:

    chunks      = retrieve_relevant_chunks(question, db, user_id=user_id)
    good_chunks = [c for c in chunks if c["similarity"] >= SIMILARITY_THRESHOLD]

    if not good_chunks:
        return {
            "answer":      "I don't have enough information to answer this question.",
            "sources":     [],
            "chunks_used": 0,
        }

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": "You are a helpful document assistant."},
            {"role": "user",   "content": build_prompt(question, good_chunks)},
        ],
        temperature=0.1,
        max_tokens=1000,
    )

    answer = response.choices[0].message.content.strip()

    seen, sources = set(), []
    for chunk in good_chunks:
        key = (chunk["document_name"], chunk["page_no"])
        if key not in seen:
            seen.add(key)
            sources.append({
                "document": chunk["document_name"],
                "page":     chunk["page_no"],
                "score":    chunk["similarity"],
            })

    return {"answer": answer, "sources": sources, "chunks_used": len(good_chunks)}