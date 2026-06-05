import PyPDF2
import pdfplumber
import docx
import io
from typing import List, Dict

def extract_from_pdf(file_bytes: bytes) -> List[Dict]:
    """
    Try pdfplumber first (better for slide decks and complex layouts),
    fall back to PyPDF2 if it produces no text.
    """
    pages = _extract_with_pdfplumber(file_bytes)
    if not pages:
        pages = _extract_with_pypdf2(file_bytes)
    return pages

def _extract_with_pdfplumber(file_bytes: bytes) -> List[Dict]:
    pages = []
    try:
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            for page_num, page in enumerate(pdf.pages, start=1):
                raw_text = page.extract_text() or ""
                cleaned  = _clean_text(raw_text)
                if cleaned:
                    pages.append({"page_no": page_num, "text": cleaned})
    except Exception:
        pass
    return pages

def _extract_with_pypdf2(file_bytes: bytes) -> List[Dict]:
    pages = []
    try:
        reader = PyPDF2.PdfReader(io.BytesIO(file_bytes))
        for page_num, page in enumerate(reader.pages, start=1):
            raw_text = page.extract_text() or ""
            cleaned  = _clean_text(raw_text)
            if cleaned:
                pages.append({"page_no": page_num, "text": cleaned})
    except Exception:
        pass
    return pages

def extract_from_docx(file_bytes: bytes) -> List[Dict]:
    doc  = docx.Document(io.BytesIO(file_bytes))
    full = "\n".join(p.text for p in doc.paragraphs if p.text.strip())
    return [{"page_no": 1, "text": _clean_text(full)}] if full else []

def _clean_text(text: str) -> str:
    lines = [line.strip() for line in text.splitlines()]
    lines = [l for l in lines if l]
    # Remove lines that are just punctuation/symbols with no real content
    lines = [l for l in lines if len(l) > 3]
    return " ".join(lines)