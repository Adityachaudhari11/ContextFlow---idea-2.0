import asyncio
import httpx
import logging
from app.config import settings
from app.events.queues import InboundEvent

logger = logging.getLogger(__name__)


async def run_telegram_poller(queue: asyncio.Queue) -> None:
    logger.info("Telegram getUpdates poller started")
    offset = 0
    while True:
        try:
            url = f"https://api.telegram.org/bot{settings.telegram_bot_token}/getUpdates"
            async with httpx.AsyncClient(timeout=35) as client:
                resp = await client.get(url, params={"offset": offset, "timeout": 30})
                data = resp.json()

            for update in data.get("result", []):
                offset = update["update_id"] + 1
                message = update.get("message") or update.get("edited_message")
                if not message or not message.get("text"):
                    continue

                chat_id = str(message["chat"]["id"])
                sender = message.get("from", {})
                sender_name = f"{sender.get('first_name', '')} {sender.get('last_name', '')}".strip() or chat_id

                event = InboundEvent(
                    channel="telegram",
                    identifier=chat_id,
                    content=message["text"],
                    external_id=str(message["message_id"]),
                    raw={"sender_name": sender_name},
                )
                await queue.put(event)
                logger.info(f"Telegram message from {chat_id}: {message['text'][:50]}")

        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.error(f"Telegram poll error: {e}")
            await asyncio.sleep(5)
