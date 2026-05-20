from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import Message, Conversation, SenderType, MessageDirection, MessageStatus
from app.events.queues import InboundEvent, OutboundEvent
from sqlalchemy import select, func


async def persist_inbound_message(event: InboundEvent, customer_id: str,
                                   conversation_id: str, db: AsyncSession) -> Message:
    msg = Message(
        conversation_id=conversation_id,
        sender_type=SenderType.customer,
        direction=MessageDirection.inbound,
        channel=event.channel,
        content=event.content,
        media_url=event.media_url,
        status=MessageStatus.delivered,
        external_id=event.external_id,
    )
    db.add(msg)

    # Update conversation last_message_at
    from sqlalchemy import select
    result = await db.execute(select(Conversation).where(Conversation.id == conversation_id))
    conv = result.scalar_one_or_none()
    if conv:
        conv.last_message_at = datetime.now(timezone.utc)

    await db.flush()
    return msg


async def is_first_message(conversation_id: str, db: AsyncSession) -> bool:
    """Return True if this is the only message in the conversation (just-persisted inbound)."""
    result = await db.execute(
        select(func.count(Message.id)).where(Message.conversation_id == conversation_id)
    )
    return (result.scalar() or 0) <= 1


async def persist_system_message(content: str, channel: str, conversation_id: str,
                                   db: AsyncSession) -> Message:
    """Persist an auto-reply / system message. Does NOT change conversation status."""
    msg = Message(
        conversation_id=conversation_id,
        sender_type=SenderType.system,
        direction=MessageDirection.outbound,
        channel=channel,
        content=content,
        status=MessageStatus.sent,
    )
    db.add(msg)

    result = await db.execute(select(Conversation).where(Conversation.id == conversation_id))
    conv = result.scalar_one_or_none()
    if conv:
        conv.last_message_at = datetime.now(timezone.utc)

    await db.flush()
    return msg


async def persist_outbound_message(content: str, channel: str, conversation_id: str,
                                    agent_id: str, db: AsyncSession) -> Message:
    msg = Message(
        conversation_id=conversation_id,
        sender_type=SenderType.agent,
        direction=MessageDirection.outbound,
        channel=channel,
        content=content,
        status=MessageStatus.sent,
    )
    db.add(msg)

    from sqlalchemy import select
    result = await db.execute(select(Conversation).where(Conversation.id == conversation_id))
    conv = result.scalar_one_or_none()
    if conv:
        conv.last_message_at = datetime.now(timezone.utc)

    await db.flush()
    return msg
