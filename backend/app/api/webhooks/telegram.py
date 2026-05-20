import logging
from fastapi import APIRouter, Request
from app.events.queues import inbound_queue, InboundEvent

router = APIRouter(prefix="/telegram", tags=["telegram-webhook"])
logger = logging.getLogger(__name__)


@router.post("/telegram")
async def telegram_webhook(request: Request):
    data = await request.json()
    message = data.get("message") or data.get("edited_message")
    if not message or not message.get("text"):
        return {"status": "ignored"}

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
    await inbound_queue.put(event)
    return {"status": "ok"}
