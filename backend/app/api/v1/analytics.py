from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, cast, Date
from datetime import datetime, timezone, timedelta
from app.db.session import get_db
from app.models import Conversation, Message, AISummary, ConversationStatus

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/dashboard")
async def dashboard(db: AsyncSession = Depends(get_db)):
    total = (await db.execute(select(func.count(Conversation.id)))).scalar() or 0
    open_count = (await db.execute(
        select(func.count(Conversation.id)).where(Conversation.status == ConversationStatus.open)
    )).scalar() or 0

    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)

    channel_rows = (await db.execute(
        select(Message.channel, func.count(Message.id)).group_by(Message.channel)
    )).all()
    channel_breakdown = [{"channel": row[0], "count": row[1]} for row in channel_rows]

    # Last 7 days volume
    volume_by_day = []
    for i in range(6, -1, -1):
        day = (datetime.now(timezone.utc) - timedelta(days=i)).date()
        count = (await db.execute(
            select(func.count(Conversation.id)).where(
                cast(Conversation.created_at, Date) == day
            )
        )).scalar() or 0
        volume_by_day.append({"date": str(day)[5:], "count": count})

    # resolved_today: fix to actually filter by today
    resolved_today = (await db.execute(
        select(func.count(Conversation.id)).where(
            Conversation.status == ConversationStatus.resolved,
            Conversation.last_message_at >= today_start,
        )
    )).scalar() or 0

    sentiment_rows = (await db.execute(
        select(AISummary.sentiment, func.count(AISummary.id)).group_by(AISummary.sentiment)
    )).all()
    sentiment_distribution = [{"sentiment": row[0], "count": row[1]} for row in sentiment_rows]

    # Avg response time: mean minutes between first inbound and first outbound per conversation
    avg_response_minutes = await _calc_avg_response_minutes(db)

    return {
        "total_conversations": total,
        "open_conversations": open_count,
        "resolved_today": resolved_today,
        "avg_response_minutes": avg_response_minutes,
        "channel_breakdown": channel_breakdown,
        "volume_by_day": volume_by_day,
        "sentiment_distribution": sentiment_distribution,
    }


async def _calc_avg_response_minutes(db: AsyncSession) -> float:
    """Average minutes between first inbound and first outbound message per conversation."""
    conv_ids = (await db.execute(select(Conversation.id))).scalars().all()
    deltas = []
    for conv_id in conv_ids:
        first_in = (await db.execute(
            select(Message.created_at)
            .where(Message.conversation_id == conv_id, Message.direction == "inbound")
            .order_by(Message.created_at.asc()).limit(1)
        )).scalar_one_or_none()
        first_out = (await db.execute(
            select(Message.created_at)
            .where(Message.conversation_id == conv_id, Message.direction == "outbound")
            .order_by(Message.created_at.asc()).limit(1)
        )).scalar_one_or_none()
        if first_in and first_out and first_out > first_in:
            diff = (first_out - first_in).total_seconds() / 60
            deltas.append(diff)
    return round(sum(deltas) / len(deltas), 1) if deltas else 0.0
