from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.events.queues import inbound_queue, InboundEvent

router = APIRouter(prefix="/simulator", tags=["simulator"])


class SimulatorPayload(BaseModel):
    identifier: str       # customer's identifier on this channel (phone, email, etc.)
    content: str
    sender_name: Optional[str] = None
    media_url: Optional[str] = None


@router.post("/{channel}")
async def simulate_inbound(channel: str, body: SimulatorPayload):
    valid_channels = {"whatsapp", "instagram", "email", "telegram", "simulator"}
    if channel not in valid_channels:
        raise HTTPException(status_code=400, detail=f"Unknown channel: {channel}. Valid: {valid_channels}")

    event = InboundEvent(
        channel=channel,
        identifier=body.identifier,
        content=body.content,
        media_url=body.media_url,
        external_id=f"sim_{id(body)}",
        raw={"sender_name": body.sender_name or body.identifier},
    )
    await inbound_queue.put(event)
    return {"status": "queued", "channel": channel, "identifier": body.identifier}
