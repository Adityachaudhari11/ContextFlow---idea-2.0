from sqlalchemy import String, ForeignKey
from sqlalchemy.orm import mapped_column, Mapped, relationship
from datetime import datetime
from .base import Base, TimestampMixin, new_uuid

class AuditEvent(Base, TimestampMixin):
    __tablename__ = "audit_events"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=new_uuid)
    agent_id: Mapped[str | None] = mapped_column(String, ForeignKey("agents.id"), nullable=True)
    action: Mapped[str] = mapped_column(String, nullable=False)
    resource_type: Mapped[str] = mapped_column(String, nullable=False) # e.g. "campaign", "customer", "dnc"
    resource_id: Mapped[str | None] = mapped_column(String, nullable=True)
    details: Mapped[str | None] = mapped_column(String, nullable=True) # JSON payload of what changed or IP context

    agent = relationship("Agent", lazy="selectin")
