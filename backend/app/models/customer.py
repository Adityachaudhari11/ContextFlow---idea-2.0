from sqlalchemy import String, Enum as SAEnum, DateTime, ForeignKey
from sqlalchemy.orm import mapped_column, Mapped, relationship
from datetime import datetime, timezone
from .base import CBSBase, TimestampMixin, new_uuid, utcnow
import enum


class ChannelType(str, enum.Enum):
    whatsapp = "whatsapp"
    instagram = "instagram"
    email = "email"
    telegram = "telegram"
    simulator = "simulator"


class Customer(CBSBase, TimestampMixin):
    __tablename__ = "customers"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=new_uuid)
    display_name: Mapped[str] = mapped_column(String, nullable=False)
    email: Mapped[str | None] = mapped_column(String, nullable=True)
    phone: Mapped[str | None] = mapped_column(String, nullable=True)
    customer_tier: Mapped[str] = mapped_column(String, default="standard")
    kyc_status: Mapped[str] = mapped_column(String, default="pending")
    primary_account_number: Mapped[str | None] = mapped_column(String, nullable=True)
    metadata_json: Mapped[str] = mapped_column(String, default="{}")
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    channel_identifiers = relationship("ChannelIdentifier", back_populates="customer", cascade="all, delete-orphan")
    transactions = relationship("Transaction", back_populates="customer")
    bank_accounts = relationship("BankAccount", back_populates="customer")
    cards = relationship("Card", back_populates="customer", cascade="all, delete-orphan")
    loans = relationship("Loan", back_populates="customer", cascade="all, delete-orphan")
    beneficiaries = relationship("Beneficiary", back_populates="customer", cascade="all, delete-orphan")


class ChannelIdentifier(CBSBase, TimestampMixin):
    __tablename__ = "channel_identifiers"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=new_uuid)
    customer_id: Mapped[str] = mapped_column(String, ForeignKey("customers.id"), nullable=False)
    channel: Mapped[ChannelType] = mapped_column(SAEnum(ChannelType), nullable=False)
    identifier: Mapped[str] = mapped_column(String, nullable=False)

    customer = relationship("Customer", back_populates="channel_identifiers")

    __table_args__ = (
        __import__("sqlalchemy").UniqueConstraint("channel", "identifier", name="uq_channel_identifier"),
    )
