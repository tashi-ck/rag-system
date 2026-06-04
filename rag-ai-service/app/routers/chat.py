from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from pydantic import BaseModel
from ..db.database import get_db
from ..services.chat_service import answer_question
from typing import Optional

router = APIRouter(prefix="/chat", tags=["chat"])

class ChatRequest(BaseModel):
    question: str
    user_id:  Optional[str] = None    # ← accept user_id in body

@router.post("/ask")
def ask(request: ChatRequest, db: Session = Depends(get_db)):
    if not request.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty.")
    return answer_question(request.question, db, user_id=request.user_id)