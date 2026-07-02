from sqlalchemy import String, Boolean, ForeignKey
from sqlalchemy.orm import mapped_column, Mapped, relationship
from .base import Base, new_uuid

class Card(Base):
    __tablename__ = "cards"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=new_uuid)
    customer_id: Mapped[str] = mapped_column(String, ForeignKey("customers.id"), nullable=False)
    account_number: Mapped[str | None] = mapped_column(String, ForeignKey("bank_accounts.account_number"), nullable=True)
    card_number: Mapped[str] = mapped_column(String, nullable=False, unique=True)
    card_type: Mapped[str] = mapped_column(String, default="debit")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    customer = relationship("Customer", back_populates="cards")
    account = relationship("BankAccount")
