import lancedb
import pyarrow as pa
from app.config import settings

_db: lancedb.DBConnection | None = None


def get_lancedb() -> lancedb.DBConnection:
    global _db
    if _db is None:
        _db = lancedb.connect(settings.lancedb_path)
    return _db


def init_lancedb() -> None:
    db = get_lancedb()

    # message_embeddings table
    if "message_embeddings" not in db.table_names():
        schema = pa.schema([
            pa.field("message_id", pa.string()),
            pa.field("conversation_id", pa.string()),
            pa.field("customer_id", pa.string()),
            pa.field("content", pa.string()),
            pa.field("channel", pa.string()),
            pa.field("created_at", pa.string()),
            pa.field("vector", pa.list_(pa.float32(), 384)),
        ])
        db.create_table("message_embeddings", schema=schema)

    # document_chunks table
    if "document_chunks" not in db.table_names():
        schema = pa.schema([
            pa.field("chunk_id", pa.string()),
            pa.field("document_id", pa.string()),
            pa.field("customer_id", pa.string()),
            pa.field("content", pa.string()),
            pa.field("chunk_index", pa.int32()),
            pa.field("vector", pa.list_(pa.float32(), 384)),
        ])
        db.create_table("document_chunks", schema=schema)


def get_message_embeddings_table():
    return get_lancedb().open_table("message_embeddings")


def get_document_chunks_table():
    return get_lancedb().open_table("document_chunks")
