import httpx
import logging
from app.config import settings

logger = logging.getLogger(__name__)


async def send_instagram_message(igsid: str, text: str) -> None:
    token = settings.instagram_access_token or settings.meta_access_token
    if not settings.instagram_page_id or not token:
        logger.warning(f"[INSTAGRAM STUB] IGSID: {igsid}: {text[:80]}")
        return
        
    if token.startswith("IG"):
        url = "https://graph.instagram.com/v25.0/me/messages"
    else:
        url = f"https://graph.facebook.com/v25.0/{settings.instagram_page_id}/messages"
        
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            url,
            headers={"Authorization": f"Bearer {token}"},
            json={"recipient": {"id": igsid}, "message": {"text": text}},
        )
        if resp.status_code >= 400:
            logger.error(f"Instagram send failed: {resp.status_code} - {resp.text}")
        resp.raise_for_status()
        resp.raise_for_status()
        logger.info(f"Instagram message sent to {igsid}")
