from openai import OpenAI
from sqlalchemy.orm import Session
from ..services.retrieval_service import retrieve_relevant_chunks
from typing import Dict
import os

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

SIMILARITY_THRESHOLD = 0.3   # discard chunks below this score

def build_prompt(question: str, chunks: list) -> str:
    context_blocks = []
    for i, chunk in enumerate(chunks, 1):
        context_blocks.append(
            f"[Source {i}: {chunk['document_name']}, page {chunk['page_no']}]\n"
            f"{chunk['chunk_text']}"
        )
    context = "\n\n".join(context_blocks)

    return f"""You are a helpful assistant that answers questions strictly based on the provided context.
If the answer is not found in the context, say "I don't have enough information to answer this question."
Never make up information.

CONTEXT:
{context}

QUESTION:
{question}

ANSWER:"""

def answer_question(question: str, db: Session) -> Dict:
    # 1. Retrieve relevant chunks
    chunks = retrieve_relevant_chunks(question, db)

    # 2. Filter out low-similarity chunks
    good_chunks = [c for c in chunks if c["similarity"] >= SIMILARITY_THRESHOLD]

    if not good_chunks:
        return {
            "answer":  "I don't have enough information to answer this question.",
            "sources": [],
            "chunks_used": 0,
        }

    # 3. Build prompt and call GPT-4
    prompt   = build_prompt(question, good_chunks)
    response = client.chat.completions.create(
        model="gpt-4o",          # or "gpt-4-turbo" based on your plan
        messages=[
            {"role": "system", "content": "You are a helpful document assistant."},
            {"role": "user",   "content": prompt},
        ],
        temperature=0.1,         # low temperature = factual, consistent answers
        max_tokens=1000,
    )

    answer = response.choices[0].message.content.strip()

    # 4. Deduplicate sources
    seen    = set()
    sources = []
    for chunk in good_chunks:
        key = (chunk["document_name"], chunk["page_no"])
        if key not in seen:
            seen.add(key)
            sources.append({
                "document": chunk["document_name"],
                "page":     chunk["page_no"],
                "score":    chunk["similarity"],
            })

    return {
        "answer":      answer,
        "sources":     sources,
        "chunks_used": len(good_chunks),
    }