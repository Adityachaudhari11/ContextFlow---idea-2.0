import logging
from app.db.lancedb_client import get_message_embeddings_table, get_document_chunks_table

logger = logging.getLogger(__name__)


async def search_past_conversations(customer_id: str, query_vector: list[float], top_k: int = 5) -> list[str]:
    """Find similar past messages for this customer from LanceDB."""
    try:
        table = get_message_embeddings_table()
        results = (
            table.search(query_vector)
            .where(f"customer_id = '{customer_id}'")
            .limit(top_k)
            .to_list()
        )
        return [r["content"] for r in results if r.get("content")]
    except Exception as e:
        logger.error(f"RAG past conversations error: {e}")
        return []


async def search_document_chunks(customer_id: str, query_vector: list[float], top_k: int = 5) -> list[str]:
    """Find relevant document chunks for this customer from LanceDB."""
    try:
        table = get_document_chunks_table()
        results = (
            table.search(query_vector)
            .where(f"customer_id = '{customer_id}'")
            .limit(top_k)
            .to_list()
        )
        return [r["content"] for r in results if r.get("content")]
    except Exception as e:
        logger.error(f"RAG document chunks error: {e}")
        return []
