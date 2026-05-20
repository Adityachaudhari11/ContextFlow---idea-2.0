from sqlalchemy import String, Enum as SAEnum, ForeignKey, DateTime
from sqlalchemy.orm import mapped_column, Mapped, relationship
from datetime import datetime
from .base import Base, new_uuid, utcnow
import enum


class SentimentType(str, enum.Enum):
    positive = "positive"
    neutral = "neutral"
    negative = "negative"
    frustrated = "frustrated"


class AISummary(Base):
    __tablename__ = "ai_summaries"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=new_uuid)
    conversation_id: Mapped[str] = mapped_column(String, ForeignKey("conversations.id"), nullable=False)
    one_liner: Mapped[str] = mapped_column(String, nullable=False)
    detailed_summary: Mapped[str] = mapped_column(String, nullable=False)
    key_issues_json: Mapped[str] = mapped_column(String, default="[]")
    suggested_action: Mapped[str | None] = mapped_column(String, nullable=True)
    sentiment: Mapped[SentimentType] = mapped_column(SAEnum(SentimentType), default=SentimentType.neutral)
    model_used: Mapped[str] = mapped_column(String, default="gpt-4o")
    generated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    conversation = relationship("Conversation", back_populates="ai_summaries")
