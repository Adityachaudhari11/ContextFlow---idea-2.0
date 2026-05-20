from sqlalchemy import String, Enum as SAEnum, ForeignKey
from sqlalchemy.orm import mapped_column, Mapped, relationship
from .base import Base, TimestampMixin, new_uuid
import enum


class SenderType(str, enum.Enum):
    customer = "customer"
    agent = "agent"
    system = "system"


class MessageDirection(str, enum.Enum):
    inbound = "inbound"
    outbound = "outbound"


class MessageStatus(str, enum.Enum):
    sent = "sent"
    delivered = "delivered"
    read = "read"
    failed = "failed"


class Message(Base, TimestampMixin):
    __tablename__ = "messages"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=new_uuid)
    conversation_id: Mapped[str] = mapped_column(String, ForeignKey("conversations.id"), nullable=False)
    sender_type: Mapped[SenderType] = mapped_column(SAEnum(SenderType), nullable=False)
    direction: Mapped[MessageDirection] = mapped_column(SAEnum(MessageDirection), nullable=False)
    channel: Mapped[str] = mapped_column(String, nullable=False)
    content: Mapped[str] = mapped_column(String, nullable=False)
    media_url: Mapped[str | None] = mapped_column(String, nullable=True)
    status: Mapped[MessageStatus] = mapped_column(SAEnum(MessageStatus), default=MessageStatus.sent)
    external_id: Mapped[str | None] = mapped_column(String, nullable=True)

    conversation = relationship("Conversation", back_populates="messages")
