from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime


# ── Auth ──────────────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    full_name: Optional[str] = None
    username: str = Field(..., min_length=3, max_length=30)
    email: EmailStr
    password: str = Field(..., min_length=6)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: str
    username: str
    email: str
    full_name: Optional[str] = None
    created_at: datetime
    documents_count: int = 0


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    username: Optional[str] = None


# ── Documents ─────────────────────────────────────────────────────────────────

class DocumentOut(BaseModel):
    id: str
    original_name: str
    file_size: int
    pages: int = 0
    chunks: int = 0
    status: str        # pending | processing | ready | error
    created_at: datetime
    user_id: str


# ── Chat ──────────────────────────────────────────────────────────────────────

class QueryRequest(BaseModel):
    question: str = Field(..., min_length=1)
    document_ids: Optional[List[str]] = None   # None = search all user docs
    session_id: Optional[str] = None


class SourceOut(BaseModel):
    content: str
    source: str
    page: int


class QueryResponse(BaseModel):
    question: str
    answer: str
    sources: List[SourceOut]
    session_id: str
    created_at: datetime


class SessionOut(BaseModel):
    id: str
    title: str
    message_count: int
    created_at: str
    updated_at: str
