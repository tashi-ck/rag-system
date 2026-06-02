from langchain_text_splitters import RecursiveCharacterTextSplitter
from typing import List, Dict

CHUNK_SIZE    = 500   # characters per chunk (≈ 100–130 tokens for English)
CHUNK_OVERLAP = 50    # characters shared between adjacent chunks

splitter = RecursiveCharacterTextSplitter(
    chunk_size=CHUNK_SIZE,
    chunk_overlap=CHUNK_OVERLAP,
    separators=["\n\n", "\n", ". ", "! ", "? ", " ", ""],
)

def chunk_pages(pages: List[Dict]) -> List[Dict]:
    """
    Input:  [{"page_no": 1, "text": "..."}, ...]
    Output: [{"chunk_text": "...", "page_no": 1}, ...]
    """
    all_chunks = []

    for page in pages:
        raw_chunks = splitter.split_text(page["text"])
        for chunk_text in raw_chunks:
            if chunk_text.strip():
                all_chunks.append({
                    "chunk_text": chunk_text.strip(),
                    "page_no":    page["page_no"],
                })

    return all_chunks