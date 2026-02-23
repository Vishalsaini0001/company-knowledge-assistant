# 🧠 DocMind AI

> Private AI document assistant — upload PDFs, ask questions, get answers with source citations.

---

## What it does

DocMind AI lets each user build their own private knowledge base. Upload PDF documents, then chat with an AI that reads them and answers your questions — showing exactly which page the answer came from. Every user's data is completely isolated from others.

---

## Tech Stack

**Backend** — FastAPI · MongoDB Atlas · ChromaDB · LangChain · Llama 3.3 70B (Groq)  
**Frontend** — React 18 · Vite · Tailwind CSS

---

## Installation

### Prerequisites
- Python 3.10+
- Node.js 18+
- [MongoDB Atlas]
- [Groq API key]

---

### 1. Configure environment

Edit `.env` in the project root:

```env
MONGODB_URI=
SECRET_KEY=
GROQ_API_KEY=
```

> **MongoDB Atlas:** Go to **Network Access → Add IP → Allow from Anywhere** (`0.0.0.0/0`)

---

### 2. Start the backend

```bash
pip install -r requirements.txt
python main.py
```

Runs at → **http://localhost:8000**

---

### 3. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

Runs at → **http://localhost:5173**

---

## Common Errors

| Error | Fix |
|---|---|
| `SSL: CERTIFICATE_VERIFY_FAILED` | Run `pip install certifi` |
| `getaddrinfo failed` | Whitelist your IP in MongoDB Atlas Network Access |
| `503 GROQ_API_KEY not set` | Add your Groq key to `.env` |
| Slow on first upload | Normal — embedding model downloads once (~90MB) |