import ssl
import certifi
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import MONGODB_URI

_client: AsyncIOMotorClient = None
_db = None


async def connect_db() -> None:
    global _client, _db
    print("Connecting to MongoDB...")

    # Fix for Windows SSL certificate verification error
    tls_ctx = ssl.create_default_context(cafile=certifi.where())

    _client = AsyncIOMotorClient(
        MONGODB_URI,
        serverSelectionTimeoutMS=15000,
        connectTimeoutMS=15000,
        socketTimeoutMS=15000,
        tls=True,
        tlsCAFile=certifi.where(),
    )
    # Ping to verify connection actually works
    await _client.admin.command("ping")
    _db = _client["AiAssistant"]

    # Create indexes (safe to run multiple times)
    await _db["users"].create_index("email", unique=True)
    await _db["users"].create_index("username", unique=True)
    await _db["documents"].create_index("user_id")
    await _db["chat_sessions"].create_index("user_id")
    print("✅ MongoDB connected and indexes ready")


async def close_db() -> None:
    global _client
    if _client is not None:
        _client.close()
        print("MongoDB connection closed")


def get_db():
    return _db