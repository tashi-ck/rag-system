from langchain_text_splitters import RecursiveCharacterTextSplitter
from typing import List, Dict

CHUNK_SIZE    = 1000
CHUNK_OVERLAP = 150
MIN_PAGE_LENGTH = 300   # pages shorter than this get merged with the next

splitter = RecursiveCharacterTextSplitter(
    chunk_size=CHUNK_SIZE,
    chunk_overlap=CHUNK_OVERLAP,
    separators=["\n\n", "\n", ". ", "! ", "? ", " ", ""],
)

def chunk_pages(pages: List[Dict]) -> List[Dict]:
    if not pages:
        return []

    # Step 1 — merge short pages with their successor
    merged = _merge_short_pages(pages)

    # Step 2 — chunk each merged block
    all_chunks = []
    for block in merged:
        raw_chunks = splitter.split_text(block["text"])
        for chunk_text in raw_chunks:
            if chunk_text.strip():
                all_chunks.append({
                    "chunk_text": chunk_text.strip(),
                    "page_no":    block["page_no"],
                })

    return all_chunks


def _merge_short_pages(pages: List[Dict]) -> List[Dict]:
    """
    Merge consecutive pages where the first page is too short
    to stand alone as a meaningful chunk.
    E.g. page 20 ends mid-sentence → merged with page 21.
    """
    if not pages:
        return []

    merged = []
    buffer_text    = pages[0]["text"]
    buffer_page_no = pages[0]["page_no"]

    for page in pages[1:]:
        if len(buffer_text) < MIN_PAGE_LENGTH:
            # Current buffer too short — absorb the next page into it
            buffer_text = buffer_text + "\n" + page["text"]
        else:
            # Buffer is long enough — save it and start a new one
            merged.append({"text": buffer_text, "page_no": buffer_page_no})
            buffer_text    = page["text"]
            buffer_page_no = page["page_no"]

    # Don't forget the last buffer
    if buffer_text.strip():
        merged.append({"text": buffer_text, "page_no": buffer_page_no})

    return merged