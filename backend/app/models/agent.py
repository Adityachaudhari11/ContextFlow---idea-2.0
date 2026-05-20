from sqlalchemy import String, Boolean, Enum as SAEnum
from sqlalchemy.orm import mapped_column, Mapped, relationship
from .base import Base, TimestampMixin, new_uuid
import enum


class AgentRole(str, enum.Enum):
    admin = "admin"
    agent = "agent"
    supervisor = "supervisor"


class Agent(Base, TimestampMixin):
    __tablename__ = "agents"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=new_uuid)
    email: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String, nullable=False)
    full_name: Mapped[str] = mapped_column(String, nullable=False)
    role: Mapped[AgentRole] = mapped_column(SAEnum(AgentRole), default=AgentRole.agent)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    conversations = relationship("Conversation", back_populates="assigned_agent", foreign_keys="Conversation.assigned_agent_id")
