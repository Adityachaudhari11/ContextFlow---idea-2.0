import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from app.db.session import get_db
from app.models import AISummary
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

router = APIRouter(prefix="/ai", tags=["ai"])


class SummaryOut(BaseModel):
    id: str
    conversation_id: str
    one_liner: str
    detailed_summary: str
    key_issues: list[str]
    suggested_action: Optional[str]
    sentiment: str
    model_used: str
    generated_at: datetime


@router.get("/summaries/{conv_id}", response_model=Optional[SummaryOut])
async def get_summary(conv_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(AISummary).where(AISummary.conversation_id == conv_id)
        .order_by(desc(AISummary.generated_at))
    )
    s = result.scalars().first()
    if not s:
        return None
    return SummaryOut(
        id=s.id, conversation_id=s.conversation_id,
        one_liner=s.one_liner, detailed_summary=s.detailed_summary,
        key_issues=json.loads(s.key_issues_json),
        suggested_action=s.suggested_action,
        sentiment=s.sentiment.value, model_used=s.model_used,
        generated_at=s.generated_at,
    )


@router.post("/regenerate/{conv_id}")
async def regenerate_summary(conv_id: str, db: AsyncSession = Depends(get_db)):
    import asyncio
    from app.ai.summarizer import generate_summary
    asyncio.create_task(generate_summary(conv_id, db))
    return {"status": "queued"}
