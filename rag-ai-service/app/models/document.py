from sqlalchemy import Column, String, DateTime, Integer, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from ..db.database import Base
from pgvector.sqlalchemy import Vector
import uuid
from datetime import datetime

class Document(Base):
    __tablename__ = "documents"

    id          = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name        = Column(String(255), nullable=False)
    s3_url      = Column(String(500))
    upload_date = Column(DateTime, default=datetime.utcnow)
    uploaded_by = Column(UUID(as_uuid=True), nullable=True)   # ← owner user ID

    chunks = relationship("Chunk", back_populates="document",
                          cascade="all, delete-orphan")

class Chunk(Base):
    __tablename__ = "chunks"

    id          = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id = Column(UUID(as_uuid=True),
                         ForeignKey("documents.id", ondelete="CASCADE"))
    chunk_text  = Column(Text, nullable=False)
    embedding   = Column(Vector(1536))
    page_no     = Column(Integer)
    created_at  = Column(DateTime, default=datetime.utcnow)

    document = relationship("Document", back_populates="chunks")