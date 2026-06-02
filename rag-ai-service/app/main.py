from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from .db.database import test_connection
from .routers import documents

load_dotenv()

app = FastAPI(title="RAG AI Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:8080"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(documents.router)

@app.on_event("startup")
def startup():
    test_connection()

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "rag-ai-service"}