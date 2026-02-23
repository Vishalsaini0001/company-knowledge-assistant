import os
from langchain_chroma import Chroma
from langchain_community.embeddings import HuggingFaceEmbeddings
from app.core.config import CHROMA_DIR

# ── Singleton embedding model (loaded once on first use) ──────────────────────
_embeddings = None


def get_embeddings() -> HuggingFaceEmbeddings:
    global _embeddings
    if _embeddings is None:
        print("Loading embedding model (first run may take a minute)…")
        _embeddings = HuggingFaceEmbeddings(
            model_name="all-MiniLM-L6-v2",
            model_kwargs={"device": "cpu"},
            encode_kwargs={"normalize_embeddings": True},
        )
        print("✅ Embedding model ready")
    return _embeddings


def _get_store(user_id: str) -> Chroma:
    """Return a per-user isolated Chroma vector store."""
    path = os.path.join(CHROMA_DIR, f"user_{user_id}")
    os.makedirs(path, exist_ok=True)
    return Chroma(
        embedding_function=get_embeddings(),
        persist_directory=path,
        collection_name=f"u_{user_id}",
    )


def ingest(chunks: list, user_id: str, doc_id: str) -> None:
    """Tag chunks with user/doc metadata then add to vector store."""
    for chunk in chunks:
        chunk.metadata["user_id"] = user_id
        chunk.metadata["doc_id"] = doc_id
    _get_store(user_id).add_documents(chunks)


def search(query: str, user_id: str, doc_ids: list = None, top_k: int = 5) -> list:
    """Return most relevant chunks for a query, scoped to this user."""
    store = _get_store(user_id)
    base_filter = {"user_id": user_id}

    try:
        if doc_ids and len(doc_ids) == 1:
            base_filter["doc_id"] = doc_ids[0]
            return store.similarity_search(query, k=top_k, filter=base_filter)

        if doc_ids and len(doc_ids) > 1:
            results = []
            seen: set = set()
            for did in doc_ids:
                hits = store.similarity_search(query, k=3, filter={"user_id": user_id, "doc_id": did})
                for h in hits:
                    key = h.page_content[:80]
                    if key not in seen:
                        seen.add(key)
                        results.append(h)
            return results[:top_k]

        return store.similarity_search(query, k=top_k, filter=base_filter)
    except Exception as e:
        print(f"Vector search error: {e}")
        return []


def delete_doc(user_id: str, doc_id: str) -> None:
    """Remove all vectors belonging to a document."""
    try:
        store = _get_store(user_id)
        col = store._collection
        existing = col.get(where={"doc_id": doc_id})
        if existing and existing.get("ids"):
            col.delete(ids=existing["ids"])
    except Exception as e:
        print(f"Delete vector error: {e}")
