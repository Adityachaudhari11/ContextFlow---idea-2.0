from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db
from app.models.bank_account import BankAccount, AccountTransaction
from app.models import Agent
from pydantic import BaseModel
from datetime import date

router = APIRouter(prefix="/accounts", tags=["accounts"])


class AccountOut(BaseModel):
    account_number: str
    nickname: str | None
    account_type: str
    balance: float


class AccountTxOut(BaseModel):
    id: str
    account_number: str
    amount: float
    merchant_name: str
    merchant_category: str
    transaction_date: date
    transaction_type: str


def mask_account(acc_no: str) -> str:
    if not acc_no or len(acc_no) <= 4:
        return acc_no
    return "*" * (len(acc_no) - 4) + acc_no[-4:]

@router.get("/{account_number}", response_model=AccountOut)
async def get_account(account_number: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(BankAccount).where(BankAccount.account_number == account_number))
    acc = result.scalar_one_or_none()
    if not acc:
        raise HTTPException(status_code=404, detail="Account not found")
    return AccountOut(account_number=mask_account(acc.account_number), nickname=acc.nickname,
                      account_type=acc.account_type, balance=float(acc.balance))


@router.get("/{account_number}/transactions", response_model=list[AccountTxOut])
async def get_account_transactions(account_number: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(AccountTransaction)
        .where(AccountTransaction.account_number == account_number)
        .order_by(AccountTransaction.transaction_date.desc())
    )
    return [
        AccountTxOut(id=t.id, account_number=mask_account(t.account_number), amount=float(t.amount),
                     merchant_name=t.merchant_name, merchant_category=t.merchant_category,
                     transaction_date=t.transaction_date, transaction_type=t.transaction_type)
        for t in result.scalars().all()
    ]
