import os
import uuid
from datetime import datetime
from typing import List

from bson import ObjectId
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, BackgroundTasks

from app.core.database import get_db
from app.core.security import get_current_user
from app.core.config import UPLOAD_DIR
from app.document_loader import process_pdf
from app.models.schemas import DocumentOut
from app.rag_engine import ingest, delete_doc

router = APIRouter(prefix="/api/documents", tags=["documents"])

ALLOWED_EXTENSIONS = {".pdf", ".txt"}
MAX_BYTES = 50 * 1024 * 1024  # 50 MB


def _doc_out(d: dict) -> DocumentOut:
    return DocumentOut(
        id=str(d["_id"]),
        original_name=d["original_name"],
        file_size=d["file_size"],
        pages=d.get("pages", 0),
        chunks=d.get("chunks", 0),
        status=d["status"],
        created_at=d["created_at"],
        user_id=d["user_id"],
    )


async def _process(doc_id: str, file_path: str, user_id: str, db) -> None:
    """Background task: parse PDF → embed → update status."""
    try:
        await db["documents"].update_one(
            {"_id": ObjectId(doc_id)}, {"$set": {"status": "processing"}}
        )
        chunks = process_pdf(file_path)
        ingest(chunks, user_id=user_id, doc_id=doc_id)

        pages = max((c.metadata.get("page", 0) for c in chunks), default=0) + 1
        await db["documents"].update_one(
            {"_id": ObjectId(doc_id)},
            {"$set": {"status": "ready", "chunks": len(chunks), "pages": pages}},
        )
    except Exception as e:
        await db["documents"].update_one(
            {"_id": ObjectId(doc_id)},
            {"$set": {"status": "error", "error": str(e)}},
        )
        print(f"Document processing error: {e}")


@router.post("/upload", response_model=DocumentOut, status_code=201)
async def upload(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    current_user=Depends(get_current_user),
):
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Only PDF and TXT files are supported")

    data = await file.read()
    if len(data) > MAX_BYTES:
        raise HTTPException(status_code=400, detail="File too large (max 50 MB)")

    user_dir = os.path.join(UPLOAD_DIR, current_user["id"])
    os.makedirs(user_dir, exist_ok=True)

    safe_name = f"{uuid.uuid4().hex}{ext}"
    file_path = os.path.join(user_dir, safe_name)
    with open(file_path, "wb") as f:
        f.write(data)

    db = get_db()
    record = {
        "user_id": current_user["id"],
        "original_name": file.filename,
        "stored_name": safe_name,
        "file_path": file_path,
        "file_size": len(data),
        "pages": 0,
        "chunks": 0,
        "status": "pending",
        "created_at": datetime.utcnow(),
    }
    result = await db["documents"].insert_one(record)
    record["_id"] = result.inserted_id

    background_tasks.add_task(_process, str(result.inserted_id), file_path, current_user["id"], db)
    return _doc_out(record)


@router.get("/", response_model=List[DocumentOut])
async def list_docs(current_user=Depends(get_current_user)):
    db = get_db()
    docs = (
        await db["documents"]
        .find({"user_id": current_user["id"]})
        .sort("created_at", -1)
        .to_list(200)
    )
    return [_doc_out(d) for d in docs]


@router.get("/{doc_id}", response_model=DocumentOut)
async def get_doc(doc_id: str, current_user=Depends(get_current_user)):
    db = get_db()
    doc = await db["documents"].find_one(
        {"_id": ObjectId(doc_id), "user_id": current_user["id"]}
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return _doc_out(doc)


@router.delete("/{doc_id}", status_code=204)
async def delete_document(doc_id: str, current_user=Depends(get_current_user)):
    db = get_db()
    doc = await db["documents"].find_one(
        {"_id": ObjectId(doc_id), "user_id": current_user["id"]}
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    # Remove vectors
    delete_doc(user_id=current_user["id"], doc_id=doc_id)

    # Remove file from disk
    try:
        if os.path.exists(doc.get("file_path", "")):
            os.remove(doc["file_path"])
    except Exception:
        pass

    await db["documents"].delete_one({"_id": ObjectId(doc_id)})
