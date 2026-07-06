from sqlalchemy import String, Numeric, ForeignKey, Date
from sqlalchemy.orm import mapped_column, Mapped, relationship
from datetime import date
from datetime import datetime, timezone
from decimal import Decimal
from .base import CBSBase, TimestampMixin, new_uuid, utcnow

class Loan(CBSBase, TimestampMixin):
    __tablename__ = "loans"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=new_uuid)
    customer_id: Mapped[str] = mapped_column(String, ForeignKey("customers.id"), nullable=False)
    loan_type: Mapped[str] = mapped_column(String, default="personal")
    principal_amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    outstanding_amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    next_emi_date: Mapped[date | None] = mapped_column(Date, nullable=True)

    customer = relationship("Customer", back_populates="loans")
