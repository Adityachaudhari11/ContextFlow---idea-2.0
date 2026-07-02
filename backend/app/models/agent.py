from sqlalchemy import String, Boolean, Enum as SAEnum, Integer, Numeric
from sqlalchemy.orm import mapped_column, Mapped, relationship
from .base import Base, TimestampMixin, new_uuid
import enum


class AgentRole(str, enum.Enum):
    admin = "admin"
    manager = "manager"
    support_agent = "support_agent"
    campaign_manager = "campaign_manager"
    compliance_officer = "compliance_officer"


class Agent(Base, TimestampMixin):
    __tablename__ = "agents"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=new_uuid)
    email: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String, nullable=False)
    full_name: Mapped[str] = mapped_column(String, nullable=False)
    role: Mapped[AgentRole] = mapped_column(SAEnum(AgentRole), default=AgentRole.support_agent)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    department: Mapped[str | None] = mapped_column(String, nullable=True)
    current_workload: Mapped[int] = mapped_column(Integer, default=0)
    is_available: Mapped[bool] = mapped_column(Boolean, default=True)
    performance_score: Mapped[float] = mapped_column(Numeric(4, 2), default=5.0)

    conversations = relationship("Conversation", back_populates="assigned_agent", foreign_keys="Conversation.assigned_agent_id")
