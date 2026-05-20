import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db
from app.models import Campaign, CampaignStatus
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

router = APIRouter(prefix="/campaigns", tags=["campaigns"])


class CampaignCreate(BaseModel):
    name: str
    content_template: str
    target_channels: list[str] = ["whatsapp"]
    audience_filter: dict = {}
    scheduled_at: Optional[datetime] = None


class CampaignOut(BaseModel):
    id: str
    name: str
    status: str
    target_channels: list[str]
    audience_filter: dict
    content_template: str
    sent_count: int
    delivered_count: int
    created_at: datetime


@router.get("", response_model=list[CampaignOut])
async def list_campaigns(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Campaign).order_by(Campaign.created_at.desc()))
    return [_to_out(c) for c in result.scalars().all()]


@router.post("", response_model=CampaignOut)
async def create_campaign(body: CampaignCreate, db: AsyncSession = Depends(get_db)):
    c = Campaign(
        name=body.name, content_template=body.content_template,
        target_channels_json=json.dumps(body.target_channels),
        audience_filter_json=json.dumps(body.audience_filter),
        scheduled_at=body.scheduled_at, created_by=None,
    )
    db.add(c)
    await db.commit()
    await db.refresh(c)
    return _to_out(c)


@router.post("/{campaign_id}/submit-review")
async def submit_review(campaign_id: str, db: AsyncSession = Depends(get_db)):
    c = await _get_campaign(campaign_id, db)
    c.status = CampaignStatus.pending_approval
    await db.commit()
    return {"status": "submitted"}


@router.post("/{campaign_id}/approve")
async def approve_campaign(campaign_id: str, db: AsyncSession = Depends(get_db)):
    c = await _get_campaign(campaign_id, db)
    c.status = CampaignStatus.approved
    c.approved_by = None
    await db.commit()
    return {"status": "approved"}


async def _get_campaign(campaign_id: str, db: AsyncSession) -> Campaign:
    result = await db.execute(select(Campaign).where(Campaign.id == campaign_id))
    c = result.scalar_one_or_none()
    if not c:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return c


def _to_out(c: Campaign) -> CampaignOut:
    return CampaignOut(
        id=c.id, name=c.name, status=c.status.value,
        target_channels=json.loads(c.target_channels_json),
        audience_filter=json.loads(c.audience_filter_json),
        content_template=c.content_template,
        sent_count=c.sent_count, delivered_count=c.delivered_count,
        created_at=c.created_at,
    )
