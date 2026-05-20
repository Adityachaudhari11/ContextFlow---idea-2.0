from sqlalchemy import String, Numeric, Date, ForeignKey
from sqlalchemy.orm import mapped_column, Mapped, relationship
from datetime import date
from decimal import Decimal
from .base import Base, new_uuid


class Transaction(Base):
    __tablename__ = "transactions"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=new_uuid)
    customer_id: Mapped[str] = mapped_column(String, ForeignKey("customers.id"), nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    merchant_name: Mapped[str] = mapped_column(String, nullable=False)
    merchant_category: Mapped[str] = mapped_column(String, nullable=False)
    transaction_date: Mapped[date] = mapped_column(Date, nullable=False)

    customer = relationship("Customer", back_populates="transactions")
