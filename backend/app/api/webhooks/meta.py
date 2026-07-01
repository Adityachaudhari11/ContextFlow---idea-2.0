import hmac
import hashlib
import json
import logging
from fastapi import APIRouter, Request, Response, Query, HTTPException
from app.config import settings
from app.events.queues import inbound_queue, InboundEvent

router = APIRouter(prefix="/meta", tags=["meta-webhooks"])
logger = logging.getLogger(__name__)


def _verify_meta_signature(payload: bytes, signature: str) -> bool:
    if not settings.meta_app_secret:
        return True  # Skip verification if not configured
    expected = "sha256=" + hmac.new(
        settings.meta_app_secret.encode(), payload, hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(expected, signature)


# ─── WhatsApp ─────────────────────────────────────────────────────────────────

@router.get("/whatsapp")
async def whatsapp_verify(
    hub_mode: str = Query(alias="hub.mode"),
    hub_verify_token: str = Query(alias="hub.verify_token"),
    hub_challenge: str = Query(alias="hub.challenge"),
):
    if hub_mode == "subscribe" and hub_verify_token == settings.whatsapp_verify_token:
        return Response(content=hub_challenge, media_type="text/plain")
    raise HTTPException(status_code=403, detail="Verification failed")


@router.post("/whatsapp")
async def whatsapp_inbound(request: Request):
    body = await request.body()
    sig = request.headers.get("X-Hub-Signature-256", "")
    if not _verify_meta_signature(body, sig):
        raise HTTPException(status_code=403, detail="Invalid signature")

    data = json.loads(body)
    for entry in data.get("entry", []):
        for change in entry.get("changes", []):
            value = change.get("value", {})
            for msg in value.get("messages", []):
                if msg.get("type") != "text":
                    continue
                event = InboundEvent(
                    channel="whatsapp",
                    identifier=msg["from"],
                    content=msg["text"]["body"],
                    external_id=msg["id"],
                    raw={"sender_name": value.get("contacts", [{}])[0].get("profile", {}).get("name", msg["from"])},
                )
                await inbound_queue.put(event)
    return {"status": "ok"}


# ─── Instagram ────────────────────────────────────────────────────────────────

@router.get("/instagram")
async def instagram_verify(
    hub_mode: str = Query(alias="hub.mode"),
    hub_verify_token: str = Query(alias="hub.verify_token"),
    hub_challenge: str = Query(alias="hub.challenge"),
):
    if hub_mode == "subscribe" and hub_verify_token == settings.whatsapp_verify_token:
        return Response(content=hub_challenge, media_type="text/plain")
    raise HTTPException(status_code=403, detail="Verification failed")


@router.post("/instagram")
async def instagram_inbound(request: Request):
    body = await request.body()
    sig = request.headers.get("X-Hub-Signature-256", "")
    if not _verify_meta_signature(body, sig):
        raise HTTPException(status_code=403, detail="Invalid signature")

    data = json.loads(body)
    our_page_id = settings.instagram_page_id  # e.g. "17841422443038814"
    for entry in data.get("entry", []):
        for messaging in entry.get("messaging", []):
            sender_id = messaging.get("sender", {}).get("id")
            message = messaging.get("message", {})
            if not sender_id or not message.get("text"):
                continue
            # Skip echo messages sent by our own page
            if sender_id == our_page_id:
                logger.debug(f"Ignoring echo from our own page {sender_id}")
                continue
            # Also skip messages explicitly marked as echo by Meta
            if message.get("is_echo"):
                logger.debug(f"Ignoring is_echo message from {sender_id}")
                continue
            event = InboundEvent(
                channel="instagram",
                identifier=sender_id,
                content=message["text"],
                external_id=message.get("mid"),
                raw={},
            )
            await inbound_queue.put(event)
    return {"status": "ok"}
