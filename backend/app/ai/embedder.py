import asyncio
from fastembed import TextEmbedding
import logging

logger = logging.getLogger(__name__)

_model: TextEmbedding | None = None
MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"


def get_model() -> TextEmbedding:
    global _model
    if _model is None:
        logger.info(f"Loading embedding model: {MODEL_NAME}")
        _model = TextEmbedding(MODEL_NAME)
        logger.info("Embedding model loaded")
    return _model


def embed(text: str) -> list[float]:
    return next(get_model().embed([text])).tolist()


def embed_batch(texts: list[str]) -> list[list[float]]:
    return [v.tolist() for v in get_model().embed(texts)]


async def embed_async(text: str) -> list[float]:
    """Non-blocking embed — runs CPU work in the default thread executor."""
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, embed, text)
