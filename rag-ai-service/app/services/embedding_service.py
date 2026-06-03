from openai import OpenAI
from typing import List
import os

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

EMBEDDING_MODEL = "text-embedding-3-small"
EMBEDDING_DIMS  = 1536

def embed_text(text: str) -> List[float]:
    """Convert a single string into a 1536-dim vector."""
    response = client.embeddings.create(
        model=EMBEDDING_MODEL,
        input=text,
    )
    return response.data[0].embedding

def embed_texts_batch(texts: List[str]) -> List[List[float]]:
    """
    Convert many strings at once.
    OpenAI allows up to 2048 inputs per batch call —
    much faster and cheaper than calling embed_text() in a loop.
    """
    if not texts:
        return []

    response = client.embeddings.create(
        model=EMBEDDING_MODEL,
        input=texts,
    )
    # Results come back in the same order as inputs
    return [item.embedding for item in response.data]