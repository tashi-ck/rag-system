import PyPDF2
import docx
import io
from typing import List, Dict

def extract_from_pdf(file_bytes: bytes) -> List[Dict]:
    """
    Returns a list of {page_no, text} dicts — one per page.
    """
    pages = []
    reader = PyPDF2.PdfReader(io.BytesIO(file_bytes))

    for page_num, page in enumerate(reader.pages, start=1):
        raw_text = page.extract_text() or ""
        cleaned  = _clean_text(raw_text)
        if cleaned:
            pages.append({"page_no": page_num, "text": cleaned})

    return pages

def extract_from_docx(file_bytes: bytes) -> List[Dict]:
    """
    Returns a single-item list — Word docs don't have meaningful pages.
    """
    doc  = docx.Document(io.BytesIO(file_bytes))
    full = "\n".join(p.text for p in doc.paragraphs if p.text.strip())
    return [{"page_no": 1, "text": _clean_text(full)}] if full else []

def _clean_text(text: str) -> str:
    """Remove excessive whitespace and blank lines."""
    lines = [line.strip() for line in text.splitlines()]
    lines = [l for l in lines if l]           # drop empty lines
    return " ".join(lines)