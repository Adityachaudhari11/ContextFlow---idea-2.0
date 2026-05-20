import httpx
import logging
from app.config import settings

logger = logging.getLogger(__name__)


async def send_whatsapp_message(to: str, text: str) -> None:
    if not settings.whatsapp_phone_number_id or not settings.meta_access_token:
        logger.warning(f"[WHATSAPP STUB] To: {to}: {text[:80]}")
        return
    url = f"https://graph.facebook.com/v19.0/{settings.whatsapp_phone_number_id}/messages"
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            url,
            headers={"Authorization": f"Bearer {settings.meta_access_token}"},
            json={"messaging_product": "whatsapp", "to": to,
                  "type": "text", "text": {"body": text}},
        )
        resp.raise_for_status()
        logger.info(f"WhatsApp message sent to {to}")
