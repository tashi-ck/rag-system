from openai import OpenAI
from sqlalchemy.orm import Session
from ..services.retrieval_service import retrieve_relevant_chunks
from typing import Dict
import os

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

SIMILARITY_THRESHOLD = 0.10
TOP_K_DISPLAY        = 5

def rewrite_query(question: str) -> str:
    """
    Rewrite a short or informal question into a well-formed search query.
    This dramatically improves retrieval for vague or short questions.
    """
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a search query optimizer. "
                    "Rewrite the user's question into a clear, complete, grammatically correct "
                    "search query that will retrieve relevant information from a document. "
                    "Return ONLY the rewritten query — no explanation, no punctuation changes."
                )
            },
            {"role": "user", "content": question}
        ],
        temperature=0,
        max_tokens=100,
    )
    rewritten = response.choices[0].message.content.strip()
    return rewritten if rewritten else question

def build_prompt(question: str, chunks: list) -> str:
    context_blocks = []
    for i, chunk in enumerate(chunks, 1):
        context_blocks.append(
            f"[Source {i}: {chunk['document_name']}, page {chunk['page_no']}]\n"
            f"{chunk['chunk_text']}"
        )
    context = "\n\n".join(context_blocks)

    return f"""You are a helpful assistant. Answer the question using ONLY the provided context.
If the answer is not in the context, say "I don't have enough information to answer this."
Never make up information. Be thorough — if the context contains a list, include all items.

CONTEXT:
{context}

QUESTION: {question}

ANSWER:"""

def answer_question(question: str, db: Session, user_id: str = None) -> Dict:

    search_query = rewrite_query(question)

    chunks = retrieve_relevant_chunks(search_query, db, user_id=user_id)

    # Debug — remove after fixing
    print(f"Query: {search_query}")
    for c in chunks:
        print(f"  score={c['similarity']:.4f} page={c['page_no']} text={c['chunk_text'][:80]}")

    good_chunks = [c for c in chunks if c["similarity"] >= SIMILARITY_THRESHOLD]

    if not good_chunks:
        # Fallback: use top 3 regardless of score
        good_chunks = chunks[:3]

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
    for chunk in good_chunks:        # ← sources from good_chunks not chunks
        key = (chunk["document_name"], chunk["page_no"])
        if key not in seen:
            seen.add(key)
            sources.append({
                "document": chunk["document_name"],
                "page":     chunk["page_no"],
                "score":    chunk["similarity"],
            })

    return {
        "answer":       answer,
        "sources":      sources,
        "chunks_used":  len(good_chunks),
        "search_query": search_query,
    }