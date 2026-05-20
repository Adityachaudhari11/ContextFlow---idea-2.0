import httpx
import logging
from app.config import settings

logger = logging.getLogger(__name__)


async def send_instagram_message(igsid: str, text: str) -> None:
    if not settings.instagram_page_id or not settings.meta_access_token:
        logger.warning(f"[INSTAGRAM STUB] IGSID: {igsid}: {text[:80]}")
        return
    url = f"https://graph.facebook.com/v19.0/{settings.instagram_page_id}/messages"
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            url,
            headers={"Authorization": f"Bearer {settings.meta_access_token}"},
            json={"recipient": {"id": igsid}, "message": {"text": text}},
        )
        resp.raise_for_status()
        logger.info(f"Instagram message sent to {igsid}")
