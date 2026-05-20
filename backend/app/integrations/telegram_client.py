import logging
import httpx
from app.config import settings

logger = logging.getLogger(__name__)


async def send_telegram_message(chat_id: str, text: str) -> None:
    url = f"https://api.telegram.org/bot{settings.telegram_bot_token}/sendMessage"
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(url, json={"chat_id": chat_id, "text": text})
            if resp.status_code != 200:
                logger.error(f"Telegram send failed ({resp.status_code}): {resp.text}")
    except Exception as e:
        logger.error(f"Telegram send error to {chat_id}: {e}")
