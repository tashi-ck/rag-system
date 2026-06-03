from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from ..db.database import get_db
from ..services.chat_service import answer_question

router = APIRouter(prefix="/chat", tags=["chat"])

class ChatRequest(BaseModel):
    question: str

    class Config:
        json_schema_extra = {
            "example": {"question": "What is the annual leave policy?"}
        }

@router.post("/ask")
def ask(request: ChatRequest, db: Session = Depends(get_db)):
    if not request.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    result = answer_question(request.question, db)
    return result