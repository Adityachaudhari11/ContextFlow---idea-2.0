import json
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from app.db.session import get_db
from app.models import Customer, ChannelIdentifier, Transaction, UploadedDocument, Agent, Message, AISummary, Conversation, BankAccount, AccountTransaction
from pydantic import BaseModel
from typing import Optional, Any
from datetime import datetime, date

class TimelineEventOut(BaseModel):
    id: str
    type: str
    timestamp: datetime
    data: dict[str, Any]

router = APIRouter(prefix="/customers", tags=["customers"])


class CustomerOut(BaseModel):
    id: str
    display_name: str
    email: Optional[str]
    phone: Optional[str]
    created_at: datetime
    channels: list[dict] = []
    is_priority: bool = False
    priority_tag: Optional[str] = None
    preferences: Optional[str] = None
    metadata_json: Optional[str] = "{}"
    customer_tier: str = "standard"
    kyc_status: str = "pending"
    primary_account_number: Optional[str] = None

def mask_account(acc_no: str) -> str | None:
    if not acc_no:
        return None
    if len(acc_no) <= 4:
        return acc_no
    return "*" * (len(acc_no) - 4) + acc_no[-4:]


class TransactionOut(BaseModel):
    id: str
    amount: float
    merchant_name: str
    merchant_category: str
    transaction_date: date


@router.get("", response_model=list[CustomerOut])
async def search_customers(
    search: Optional[str] = Query(None, max_length=100),
    priority: Optional[bool] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    query = select(Customer)
    if search:
        query = query.where(
            or_(
                Customer.display_name.ilike(f"%{search}%"),
                Customer.email.ilike(f"%{search}%"),
                Customer.phone.ilike(f"%{search}%"),
            )
        )
    if priority is not None:
        if priority:
            query = query.where(Customer.metadata_json.like('%"is_priority": true%'))
        else:
            query = query.where(Customer.metadata_json.not_like('%"is_priority": true%'))

    result = await db.execute(query.limit(50))
    customers = result.scalars().all()

    out = []
    for c in customers:
        ci_result = await db.execute(select(ChannelIdentifier).where(ChannelIdentifier.customer_id == c.id))
        channels = [{"channel": ci.channel.value, "identifier": ci.identifier} for ci in ci_result.scalars().all()]
        
        is_priority = False
        priority_tag = None
        preferences = None
        if c.metadata_json:
            try:
                meta = json.loads(c.metadata_json)
                is_priority = meta.get("is_priority", False)
                priority_tag = meta.get("priority_tag")
                preferences = meta.get("preferences")
            except Exception:
                pass
        out.append(CustomerOut(id=c.id, display_name=c.display_name, email=c.email, phone=c.phone,
                               created_at=c.created_at, channels=channels,
                               is_priority=is_priority, priority_tag=priority_tag, preferences=preferences, metadata_json=c.metadata_json,
                               customer_tier=c.customer_tier, kyc_status=c.kyc_status, primary_account_number=mask_account(c.primary_account_number)))
    return out


@router.get("/{customer_id}", response_model=CustomerOut)
async def get_customer(customer_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Customer).where(Customer.id == customer_id))
    c = result.scalar_one_or_none()
    if not c:
        raise HTTPException(status_code=404, detail="Customer not found")
    ci_result = await db.execute(select(ChannelIdentifier).where(ChannelIdentifier.customer_id == c.id))
    channels = [{"channel": ci.channel.value, "identifier": ci.identifier} for ci in ci_result.scalars().all()]
    
    is_priority = False
    priority_tag = None
    preferences = None
    if c.metadata_json:
        try:
            meta = json.loads(c.metadata_json)
            is_priority = meta.get("is_priority", False)
            priority_tag = meta.get("priority_tag")
            preferences = meta.get("preferences")
        except Exception:
            pass
    return CustomerOut(id=c.id, display_name=c.display_name, email=c.email, phone=c.phone,
                       created_at=c.created_at, channels=channels,
                       is_priority=is_priority, priority_tag=priority_tag, preferences=preferences, metadata_json=c.metadata_json,
                       customer_tier=c.customer_tier, kyc_status=c.kyc_status, primary_account_number=mask_account(c.primary_account_number))


@router.get("/{customer_id}/transactions", response_model=list[TransactionOut])
async def get_transactions(customer_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Transaction).where(Transaction.customer_id == customer_id)
        .order_by(Transaction.transaction_date.desc()).limit(20)
    )
    return [TransactionOut(id=t.id, amount=float(t.amount), merchant_name=t.merchant_name,
                           merchant_category=t.merchant_category, transaction_date=t.transaction_date)
            for t in result.scalars().all()]


@router.get("/{customer_id}/identifiers")
async def get_identifiers(customer_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ChannelIdentifier).where(ChannelIdentifier.customer_id == customer_id))
    return [{"channel": ci.channel.value, "identifier": ci.identifier} for ci in result.scalars().all()]


@router.get("/{customer_id}/documents")
async def get_documents(customer_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(UploadedDocument).where(UploadedDocument.customer_id == customer_id))
    return [
        {
            "id": d.id, "filename": d.filename, "file_type": d.file_type.value,
            "processed": d.processed, "chunk_count": d.chunk_count, "created_at": d.created_at.isoformat(),
        }
        for d in result.scalars().all()
    ]


@router.post("/{customer_id}/toggle-priority")
async def toggle_customer_priority(customer_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Customer).where(Customer.id == customer_id))
    c = result.scalar_one_or_none()
    if not c:
        raise HTTPException(status_code=404, detail="Customer not found")
    try:
        meta = json.loads(c.metadata_json) if c.metadata_json else {}
    except Exception:
        meta = {}
    
    current_val = meta.get("is_priority", False)
    meta["is_priority"] = not current_val
    c.metadata_json = json.dumps(meta)
    
    await db.commit()
    await db.refresh(c)
    
    return {
        "id": c.id,
        "is_priority": meta["is_priority"],
        "metadata_json": c.metadata_json
    }


async def _sync_vip_entries(c: Customer, db: AsyncSession, is_active: bool, tag: Optional[str] = None):
    from app.models import VIPEntry, IdentifierType
    from sqlalchemy import select
    from app.models import ChannelIdentifier
    
    ci_result = await db.execute(select(ChannelIdentifier).where(ChannelIdentifier.customer_id == c.id))
    identifiers = ci_result.scalars().all()
    
    unique_ids = set()
    if c.email:
        unique_ids.add((c.email.strip().lower(), IdentifierType.email))
    if c.phone:
        p = c.phone.replace(" ", "").replace("-", "")
        if not p.startswith("+") and p.lstrip("0").isdigit():
            p = "+" + p.lstrip("0")
        unique_ids.add((p, IdentifierType.phone))
        
    for ci in identifiers:
        val = ci.identifier.strip()
        if ci.channel.value == "email":
            unique_ids.add((val.lower(), IdentifierType.email))
        elif ci.channel.value == "whatsapp":
            p = val.replace(" ", "").replace("-", "")
            if not p.startswith("+") and p.lstrip("0").isdigit():
                p = "+" + p.lstrip("0")
            unique_ids.add((p, IdentifierType.phone))
            
    changed_count = 0
    for val, id_type in unique_ids:
        existing = await db.execute(
            select(VIPEntry).where(
                VIPEntry.identifier == val,
                VIPEntry.identifier_type == id_type
            )
        )
        entry = existing.scalar_one_or_none()
        if entry:
            needs_update = False
            if entry.is_active != is_active:
                entry.is_active = is_active
                needs_update = True
            if is_active and entry.priority_tag != tag:
                entry.priority_tag = tag
                needs_update = True
            if needs_update:
                changed_count += 1
        elif is_active:
            entry = VIPEntry(identifier=val, identifier_type=id_type, is_active=True, priority_tag=tag)
            db.add(entry)
            changed_count += 1
            
    return changed_count



class CustomerPrivilegeUpdate(BaseModel):
    is_priority: bool
    priority_tag: Optional[str] = None
    preferences: Optional[str] = None


@router.post("/{customer_id}/privilege")
async def update_customer_privilege(
    customer_id: str, body: CustomerPrivilegeUpdate, db: AsyncSession = Depends(get_db)
):
    """Update customer privilege level, tag, and preferences."""
    result = await db.execute(select(Customer).where(Customer.id == customer_id))
    c = result.scalar_one_or_none()
    if not c:
        raise HTTPException(status_code=404, detail="Customer not found")
    try:
        meta = json.loads(c.metadata_json) if c.metadata_json else {}
    except Exception:
        meta = {}

    meta["is_priority"] = body.is_priority
    if body.priority_tag is not None:
        meta["priority_tag"] = body.priority_tag
    elif not body.is_priority:
        meta.pop("priority_tag", None)
    if body.preferences is not None:
        meta["preferences"] = body.preferences

    c.metadata_json = json.dumps(meta)
    
    await _sync_vip_entries(c, db, body.is_priority, body.priority_tag)
    
    await db.commit()
    await db.refresh(c)

    return {
        "id": c.id,
        "is_priority": meta["is_priority"],
        "priority_tag": meta.get("priority_tag"),
        "preferences": meta.get("preferences"),
        "metadata_json": c.metadata_json,
    }

@router.post("/{customer_id}/privilege_all_sources")
async def privilege_all_sources(customer_id: str, db: AsyncSession = Depends(get_db)):
    """Mark the customer as priority and add all their identifiers to the global VIP list."""
    result = await db.execute(select(Customer).where(Customer.id == customer_id))
    c = result.scalar_one_or_none()
    if not c:
        raise HTTPException(status_code=404, detail="Customer not found")

    try:
        meta = json.loads(c.metadata_json) if c.metadata_json else {}
    except Exception:
        meta = {}
    meta["is_priority"] = True
    c.metadata_json = json.dumps(meta)

    added_count = await _sync_vip_entries(c, db, True)
    await db.commit()
    return {"status": "ok", "added_count": added_count}

@router.post("/{customer_id}/remove_privilege_all_sources")
async def remove_privilege_all_sources(customer_id: str, db: AsyncSession = Depends(get_db)):
    """Remove priority flag from the customer and deactivate all their identifiers from the global VIP list."""
    result = await db.execute(select(Customer).where(Customer.id == customer_id))
    c = result.scalar_one_or_none()
    if not c:
        raise HTTPException(status_code=404, detail="Customer not found")

    try:
        meta = json.loads(c.metadata_json) if c.metadata_json else {}
    except Exception:
        meta = {}
    meta["is_priority"] = False
    c.metadata_json = json.dumps(meta)

    removed_count = await _sync_vip_entries(c, db, False)
    await db.commit()
    return {"status": "ok", "removed_count": removed_count}
@router.get("/{customer_id}/timeline", response_model=list[TimelineEventOut])
async def get_customer_timeline(customer_id: str, db: AsyncSession = Depends(get_db)):
    events = []

    # 1. Fetch Messages
    msg_result = await db.execute(
        select(Message)
        .join(Conversation)
        .where(Conversation.customer_id == customer_id)
    )
    for m in msg_result.scalars().all():
        events.append({
            "id": m.id,
            "type": "message",
            "timestamp": m.created_at,
            "data": {
                "content": m.content,
                "sender_type": m.sender_type.value,
                "direction": m.direction.value,
                "channel": m.channel,
            }
        })

    # 2. Fetch Summaries
    summary_result = await db.execute(
        select(AISummary)
        .join(Conversation)
        .where(Conversation.customer_id == customer_id)
    )
    for s in summary_result.scalars().all():
        events.append({
            "id": s.id,
            "type": "summary",
            "timestamp": s.generated_at,
            "data": {
                "one_liner": s.one_liner,
                "sentiment": s.sentiment.value,
                "suggested_action": s.suggested_action,
            }
        })

    # 3. Fetch Transactions
    tx_result = await db.execute(select(Transaction).where(Transaction.customer_id == customer_id))
    for tx in tx_result.scalars().all():
        # Convert date to datetime for unified sorting
        ts = datetime.combine(tx.transaction_date, datetime.min.time())
        events.append({
            "id": tx.id,
            "type": "transaction",
            "timestamp": ts,
            "data": {
                "amount": float(tx.amount),
                "merchant_name": tx.merchant_name,
                "merchant_category": tx.merchant_category,
            }
        })

    # Fetch linked account transactions
    accounts_result = await db.execute(select(BankAccount).where(BankAccount.customer_id == customer_id))
    for acc in accounts_result.scalars().all():
        atx_result = await db.execute(select(AccountTransaction).where(AccountTransaction.account_number == acc.account_number))
        for tx in atx_result.scalars().all():
            ts = datetime.combine(tx.transaction_date, datetime.min.time())
            events.append({
                "id": tx.id,
                "type": "transaction",
                "timestamp": ts,
                "data": {
                    "amount": float(tx.amount),
                    "merchant_name": tx.merchant_name,
                    "merchant_category": tx.merchant_category,
                    "account_number": mask_account(tx.account_number),
                }
            })

    # Sort descending
    events.sort(key=lambda x: x["timestamp"], reverse=True)
    return events
