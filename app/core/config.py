import os
from dotenv import load_dotenv

load_dotenv()

MONGODB_URI: str = os.getenv(
    "MONGODB_URI",
    "mongodb+srv://vishal:saini@cluster0.9zdn8lc.mongodb.net/AiAssistant?appName=Cluster0"
)
SECRET_KEY: str = os.getenv("SECRET_KEY", "docmind-super-secret-jwt-key-minimum-32-characters-long")
ALGORITHM: str = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
UPLOAD_DIR: str = "./uploads"
CHROMA_DIR: str = "./chroma_db"
