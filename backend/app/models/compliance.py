from sqlalchemy import String, Enum as SAEnum, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import mapped_column, Mapped, relationship
from datetime import datetime
from .base import Base, TimestampMixin, new_uuid, utcnow
import enum


class ConsentType(str, enum.Enum):
    marketing = "marketing"
    transactional = "transactional"


class ConsentStatus(str, enum.Enum):
    active = "active"
    revoked = "revoked"


class ConsentRecord(Base, TimestampMixin):
    __tablename__ = "consent_records"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=new_uuid)
    customer_id: Mapped[str] = mapped_column(String, ForeignKey("customers.id"), nullable=False)
    consent_type: Mapped[ConsentType] = mapped_column(SAEnum(ConsentType), nullable=False)
    channel: Mapped[str] = mapped_column(String, nullable=False)
    status: Mapped[ConsentStatus] = mapped_column(SAEnum(ConsentStatus), default=ConsentStatus.active)
    consented_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    customer = relationship("Customer", back_populates="consent_records")


class IdentifierType(str, enum.Enum):
    phone = "phone"
    email = "email"


class DNCEntry(Base, TimestampMixin):
    __tablename__ = "dnc_list"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=new_uuid)
    identifier: Mapped[str] = mapped_column(String, nullable=False)
    identifier_type: Mapped[IdentifierType] = mapped_column(SAEnum(IdentifierType), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    __table_args__ = (
        __import__("sqlalchemy").UniqueConstraint("identifier", "identifier_type", name="uq_dnc_identifier"),
    )

class VIPEntry(Base, TimestampMixin):
    __tablename__ = "vip_list"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=new_uuid)
    identifier: Mapped[str] = mapped_column(String, nullable=False)
    identifier_type: Mapped[IdentifierType] = mapped_column(SAEnum(IdentifierType), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    __table_args__ = (
        __import__("sqlalchemy").UniqueConstraint("identifier", "identifier_type", name="uq_vip_identifier"),
    )

