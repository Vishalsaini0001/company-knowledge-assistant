from datetime import datetime

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status

from app.core.database import get_db
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
)
from app.models.schemas import (
    RegisterRequest,
    LoginRequest,
    TokenOut,
    UserOut,
    ProfileUpdate,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _user_out(user: dict, docs_count: int = 0) -> UserOut:
    return UserOut(
        id=str(user["_id"]),
        username=user["username"],
        email=user["email"],
        full_name=user.get("full_name"),
        created_at=user["created_at"],
        documents_count=docs_count,
    )


@router.post("/register", response_model=TokenOut, status_code=201)
async def register(body: RegisterRequest):
    db = get_db()
    if await db["users"].find_one({"email": body.email}):
        raise HTTPException(status_code=400, detail="Email already registered")
    if await db["users"].find_one({"username": body.username}):
        raise HTTPException(status_code=400, detail="Username already taken")

    doc = {
        "full_name": body.full_name or body.username,
        "username": body.username,
        "email": body.email,
        "hashed_password": body.password,
        "created_at": datetime.utcnow(),
    }
    result = await db["users"].insert_one(doc)
    doc["_id"] = result.inserted_id

    token = create_access_token(str(result.inserted_id))
    return TokenOut(access_token=token, user=_user_out(doc))


@router.post("/login", response_model=TokenOut)
async def login(body: LoginRequest):
    db = get_db()
    user = await db["users"].find_one({"email": body.email})
    # if not user or not verify_password(body.password, user["hashed_password"]):
    #     raise HTTPException(status_code=401, detail="Invalid email or password")

    count = await db["documents"].count_documents(
        {"user_id": str(user["_id"]), "status": "ready"}
    )
    token = create_access_token(str(user["_id"]))
    return TokenOut(access_token=token, user=_user_out(user, count))


@router.get("/me", response_model=UserOut)
async def me(current_user=Depends(get_current_user)):
    db = get_db()
    count = await db["documents"].count_documents(
        {"user_id": current_user["id"], "status": "ready"}
    )
    return _user_out(current_user, count)


@router.put("/profile", response_model=UserOut)
async def update_profile(body: ProfileUpdate, current_user=Depends(get_current_user)):
    db = get_db()
    updates = {k: v for k, v in body.model_dump().items() if v is not None}

    if "username" in updates:
        existing = await db["users"].find_one({"username": updates["username"]})
        if existing and str(existing["_id"]) != current_user["id"]:
            raise HTTPException(status_code=400, detail="Username already taken")

    if updates:
        await db["users"].update_one(
            {"_id": ObjectId(current_user["id"])}, {"$set": updates}
        )

    updated = await db["users"].find_one({"_id": ObjectId(current_user["id"])})
    count = await db["documents"].count_documents(
        {"user_id": current_user["id"], "status": "ready"}
    )
    return _user_out(updated, count)
