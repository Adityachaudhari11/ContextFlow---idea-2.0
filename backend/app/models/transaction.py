from sqlalchemy import String, Numeric, Date, ForeignKey
from sqlalchemy.orm import mapped_column, Mapped, relationship
from datetime import date
from datetime import datetime, timezone
from decimal import Decimal
from .base import CBSBase, TimestampMixin, new_uuid, utcnow


class Transaction(CBSBase, TimestampMixin):
    __tablename__ = "transactions"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=new_uuid)
    customer_id: Mapped[str] = mapped_column(String, ForeignKey("customers.id"), nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    merchant_name: Mapped[str] = mapped_column(String, nullable=False)
    merchant_category: Mapped[str] = mapped_column(String, nullable=False)
    transaction_date: Mapped[date] = mapped_column(Date, nullable=False)

    customer = relationship("Customer", back_populates="transactions")
