import os
import uuid
from datetime import datetime
from typing import List

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException

from app.core.database import get_db
from app.core.security import get_current_user
from app.core.config import GROQ_API_KEY
from app.models.schemas import QueryRequest, QueryResponse, SourceOut, SessionOut
from app.rag_engine import search

router = APIRouter(prefix="/api/chat", tags=["chat"])

# ── LLM setup ─────────────────────────────────────────────────────────────────
_llm = None

def get_llm():
    global _llm
    if _llm is None:
        if not GROQ_API_KEY or GROQ_API_KEY == "your_groq_api_key_here":
            raise HTTPException(
                status_code=503,
                detail="GROQ_API_KEY not set in .env file. Get a free key at https://console.groq.com",
            )
        os.environ["GROQ_API_KEY"] = GROQ_API_KEY
        from langchain_groq import ChatGroq
        _llm = ChatGroq(model="llama-3.3-70b-versatile", temperature=0.1)
    return _llm


SYSTEM_PROMPT = """You are DocMind AI, an intelligent document assistant.
Answer questions using ONLY the context provided below.
Be clear, helpful, and concise.
If the answer is not in the context, say: "I couldn't find that information in your documents."
Never make up information."""


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/query", response_model=QueryResponse)
async def query(body: QueryRequest, current_user=Depends(get_current_user)):
    db = get_db()
    user_id = current_user["id"]

    # Validate doc ownership
    if body.document_ids:
        for did in body.document_ids:
            doc = await db["documents"].find_one(
                {"_id": ObjectId(did), "user_id": user_id}
            )
            if not doc:
                raise HTTPException(
                    status_code=403, detail=f"Document {did} not found or access denied"
                )

    # Retrieve relevant chunks
    hits = search(body.question, user_id=user_id, doc_ids=body.document_ids, top_k=5)
    context = "\n\n---\n\n".join(h.page_content for h in hits) if hits else "No documents found."

    # Build prompt and call LLM
    llm = get_llm()
    from langchain_core.messages import SystemMessage, HumanMessage
    messages = [
        SystemMessage(content=SYSTEM_PROMPT),
        HumanMessage(content=f"Context:\n{context}\n\nQuestion: {body.question}"),
    ]
    response = llm.invoke(messages)
    answer = response.content

    # Build sources list (deduplicated)
    sources: List[SourceOut] = []
    seen: set = set()
    for hit in hits:
        key = f"{hit.metadata.get('source', '')}_{hit.metadata.get('page', 0)}"
        if key in seen:
            continue
        seen.add(key)

        # Try to get the friendly filename from MongoDB
        did = hit.metadata.get("doc_id", "")
        friendly = hit.metadata.get("source", "Unknown")
        if did:
            db_doc = await db["documents"].find_one({"_id": ObjectId(did)})
            if db_doc:
                friendly = db_doc.get("original_name", friendly)

        excerpt = hit.page_content
        if len(excerpt) > 350:
            excerpt = excerpt[:350] + "…"

        sources.append(SourceOut(
            content=excerpt,
            source=friendly,
            page=hit.metadata.get("page", 0) + 1,
        ))

    # Persist chat session
    now = datetime.utcnow()
    session_id = body.session_id or str(uuid.uuid4())

    user_msg = {"role": "user", "content": body.question, "sources": None, "ts": now}
    ai_msg = {"role": "assistant", "content": answer, "sources": [s.model_dump() for s in sources], "ts": now}

    existing = await db["chat_sessions"].find_one({"_id": session_id, "user_id": user_id})
    if existing:
        await db["chat_sessions"].update_one(
            {"_id": session_id},
            {"$push": {"messages": {"$each": [user_msg, ai_msg]}}, "$set": {"updated_at": now}},
        )
    else:
        title = body.question[:60] + ("…" if len(body.question) > 60 else "")
        await db["chat_sessions"].insert_one({
            "_id": session_id,
            "user_id": user_id,
            "title": title,
            "messages": [user_msg, ai_msg],
            "created_at": now,
            "updated_at": now,
        })

    return QueryResponse(
        question=body.question,
        answer=answer,
        sources=sources,
        session_id=session_id,
        created_at=now,
    )


@router.get("/sessions", response_model=List[SessionOut])
async def list_sessions(current_user=Depends(get_current_user)):
    db = get_db()
    sessions = (
        await db["chat_sessions"]
        .find({"user_id": current_user["id"]})
        .sort("updated_at", -1)
        .limit(50)
        .to_list(50)
    )
    return [
        SessionOut(
            id=str(s["_id"]),
            title=s.get("title", "Untitled"),
            message_count=len(s.get("messages", [])),
            created_at=s["created_at"].isoformat(),
            updated_at=s["updated_at"].isoformat(),
        )
        for s in sessions
    ]


@router.get("/sessions/{session_id}")
async def get_session(session_id: str, current_user=Depends(get_current_user)):
    db = get_db()
    session = await db["chat_sessions"].find_one(
        {"_id": session_id, "user_id": current_user["id"]}
    )
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return {
        "id": str(session["_id"]),
        "title": session.get("title", "Untitled"),
        "messages": session.get("messages", []),
        "created_at": session["created_at"].isoformat(),
        "updated_at": session["updated_at"].isoformat(),
    }


@router.delete("/sessions/{session_id}", status_code=204)
async def delete_session(session_id: str, current_user=Depends(get_current_user)):
    db = get_db()
    result = await db["chat_sessions"].delete_one(
        {"_id": session_id, "user_id": current_user["id"]}
    )
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Session not found")
