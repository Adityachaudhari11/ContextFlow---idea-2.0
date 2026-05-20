from sqlalchemy import String, Enum as SAEnum, Integer, ForeignKey, DateTime
from sqlalchemy.orm import mapped_column, Mapped, relationship
from datetime import datetime
from .base import Base, TimestampMixin, new_uuid
import enum


class CampaignStatus(str, enum.Enum):
    draft = "draft"
    pending_approval = "pending_approval"
    approved = "approved"
    scheduled = "scheduled"
    running = "running"
    completed = "completed"
    cancelled = "cancelled"


class Campaign(Base, TimestampMixin):
    __tablename__ = "campaigns"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=new_uuid)
    name: Mapped[str] = mapped_column(String, nullable=False)
    status: Mapped[CampaignStatus] = mapped_column(SAEnum(CampaignStatus), default=CampaignStatus.draft)
    target_channels_json: Mapped[str] = mapped_column(String, default='["whatsapp"]')
    audience_filter_json: Mapped[str] = mapped_column(String, default="{}")
    content_template: Mapped[str] = mapped_column(String, nullable=False)
    scheduled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_by: Mapped[str | None] = mapped_column(String, ForeignKey("agents.id"), nullable=True)
    approved_by: Mapped[str | None] = mapped_column(String, ForeignKey("agents.id"), nullable=True)
    sent_count: Mapped[int] = mapped_column(Integer, default=0)
    delivered_count: Mapped[int] = mapped_column(Integer, default=0)
