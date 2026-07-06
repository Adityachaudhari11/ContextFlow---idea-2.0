from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db
from app.models import DNCEntry, ConsentRecord, IdentifierType, Customer, Agent
from app.core.security import get_current_agent
from app.services.audit_service import log_audit_event
from pydantic import BaseModel
from datetime import datetime

from app.core.security import require_roles
router = APIRouter(
    prefix="/compliance", 
    tags=["compliance"],
    dependencies=[Depends(require_roles(["admin", "manager", "compliance_officer"]))]
)


class DNCEntryOut(BaseModel):
    id: str
    identifier: str
    identifier_type: str
    is_active: bool
    created_at: datetime
    customer_name: str | None = None


class DNCAddEmail(BaseModel):
    email: str


@router.get("/dnc-list", response_model=list[DNCEntryOut])
async def list_dnc(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(DNCEntry).where(DNCEntry.is_active == True))
    entries = result.scalars().all()
    out = []
    for e in entries:
        # Enrich with customer name if it's an email entry
        customer_name = None
        if e.identifier_type == IdentifierType.email:
            cr = await db.execute(select(Customer).where(Customer.email == e.identifier))
            cust = cr.scalar_one_or_none()
            customer_name = cust.display_name if cust else None
        out.append(DNCEntryOut(
            id=e.id,
            identifier=e.identifier,
            identifier_type=e.identifier_type.value,
            is_active=e.is_active,
            created_at=e.created_at,
            customer_name=customer_name,
        ))
    return out


@router.post("/dnc-list", response_model=DNCEntryOut)
async def add_dnc(
    body: DNCAddEmail, 
    db: AsyncSession = Depends(get_db),
    current_agent = Depends(get_current_agent)
):
    email = body.email.strip().lower()
    if not email or "@" not in email:
        raise HTTPException(status_code=400, detail="A valid email address is required")

    # Check if already active
    existing = await db.execute(
        select(DNCEntry).where(
            DNCEntry.identifier == email,
            DNCEntry.identifier_type == IdentifierType.email,
            DNCEntry.is_active == True,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Email is already on the DNC list")

    # Re-activate if previously removed
    soft_deleted = await db.execute(
        select(DNCEntry).where(
            DNCEntry.identifier == email,
            DNCEntry.identifier_type == IdentifierType.email,
            DNCEntry.is_active == False,
        )
    )
    entry = soft_deleted.scalar_one_or_none()
    if entry:
        entry.is_active = True
    else:
        entry = DNCEntry(identifier=email, identifier_type=IdentifierType.email, is_active=True)
        db.add(entry)

    await db.commit()
    await db.refresh(entry)

    cr = await db.execute(select(Customer).where(Customer.email == email))
    cust = cr.scalar_one_or_none()

    await log_audit_event(db, current_agent.id, "add", "dnc", entry.id, {"email": email})

    return DNCEntryOut(
        id=entry.id,
        identifier=entry.identifier,
        identifier_type=entry.identifier_type.value,
        is_active=entry.is_active,
        created_at=entry.created_at,
        customer_name=cust.display_name if cust else None,
    )


@router.post("/dnc-check")
async def check_dnc_by_email(email: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(DNCEntry).where(
            DNCEntry.identifier == email.lower(),
            DNCEntry.identifier_type == IdentifierType.email,
            DNCEntry.is_active == True,
        )
    )
    blocked = result.scalar_one_or_none() is not None
    return {"email": email, "blocked": blocked}


@router.delete("/dnc-list/{entry_id}")
async def remove_dnc(
    entry_id: str, 
    db: AsyncSession = Depends(get_db),
    current_agent = Depends(get_current_agent)
):
    result = await db.execute(select(DNCEntry).where(DNCEntry.id == entry_id))
    entry = result.scalar_one_or_none()
    if not entry:
        raise HTTPException(status_code=404, detail="DNC entry not found")
    entry.is_active = False
    await db.commit()
    await log_audit_event(db, current_agent.id, "remove", "dnc", entry_id)
    return {"ok": True}


@router.get("/consent/{customer_id}")
async def get_consent(customer_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ConsentRecord).where(ConsentRecord.customer_id == customer_id))
    records = result.scalars().all()
    return [{"id": r.id, "consent_type": r.consent_type.value, "channel": r.channel,
             "status": r.status.value, "consented_at": r.consented_at} for r in records]


async def is_customer_blocked(customer_id: str, db: AsyncSession) -> bool:
    """Check if a customer's email is on the active DNC list."""
    cr = await db.execute(select(Customer).where(Customer.id == customer_id))
    cust = cr.scalar_one_or_none()
    if not cust or not cust.email:
        return False
    result = await db.execute(
        select(DNCEntry).where(
            DNCEntry.identifier == cust.email.lower(),
            DNCEntry.identifier_type == IdentifierType.email,
            DNCEntry.is_active == True,
        )
    )
    return result.scalar_one_or_none() is not None


class VIPEntryOut(BaseModel):
    id: str
    identifier: str
    identifier_type: str
    is_active: bool
    created_at: datetime
    customer_name: str | None = None
    priority_tag: str | None = None


class VIPAddIdentifier(BaseModel):
    identifier: str
    priority_tag: str | None = None


@router.get("/vip-list", response_model=list[VIPEntryOut])
async def list_vip(db: AsyncSession = Depends(get_db)):
    from app.models import VIPEntry
    result = await db.execute(select(VIPEntry).where(VIPEntry.is_active == True))
    entries = result.scalars().all()
    out = []
    for e in entries:
        customer_name = None
        # Try to find a matching customer to enrich
        if e.identifier_type == IdentifierType.email:
            cr = await db.execute(select(Customer).where(Customer.email == e.identifier))
        else:
            cr = await db.execute(select(Customer).where(Customer.phone == e.identifier))
        cust = cr.scalar_one_or_none()
        customer_name = cust.display_name if cust else None

        out.append(VIPEntryOut(
            id=e.id,
            identifier=e.identifier,
            identifier_type=e.identifier_type.value,
            is_active=e.is_active,
            created_at=e.created_at,
            customer_name=customer_name,
            priority_tag=e.priority_tag,
        ))
    return out


@router.post("/vip-list", response_model=VIPEntryOut)
async def add_vip(
    body: VIPAddIdentifier, 
    db: AsyncSession = Depends(get_db),
    current_agent = Depends(get_current_agent)
):
    from app.models import VIPEntry
    import json
    
    identifier = body.identifier.strip().lower()
    if not identifier:
        raise HTTPException(status_code=400, detail="Identifier is required")

    id_type = IdentifierType.email if "@" in identifier else IdentifierType.phone
    if id_type == IdentifierType.phone:
        # Simple normalization
        identifier = identifier.replace(" ", "").replace("-", "")
        if not identifier.startswith("+") and identifier.lstrip("0").isdigit():
            identifier = "+" + identifier.lstrip("0")

    existing = await db.execute(
        select(VIPEntry).where(
            VIPEntry.identifier == identifier,
            VIPEntry.identifier_type == id_type,
            VIPEntry.is_active == True,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Identifier is already on the VIP list")

    soft_deleted = await db.execute(
        select(VIPEntry).where(
            VIPEntry.identifier == identifier,
            VIPEntry.identifier_type == id_type,
            VIPEntry.is_active == False,
        )
    )
    entry = soft_deleted.scalar_one_or_none()
    if entry:
        entry.is_active = True
        entry.priority_tag = body.priority_tag
    else:
        entry = VIPEntry(identifier=identifier, identifier_type=id_type, is_active=True, priority_tag=body.priority_tag)
        db.add(entry)

    # Flag existing customers
    if id_type == IdentifierType.email:
        cr = await db.execute(select(Customer).where(Customer.email == identifier))
    else:
        cr = await db.execute(select(Customer).where(Customer.phone == identifier))
    
    cust = cr.scalar_one_or_none()
    if cust:
        meta = json.loads(cust.metadata_json) if cust.metadata_json else {}
        meta["is_priority"] = True
        if body.priority_tag:
            meta["priority_tag"] = body.priority_tag
        cust.metadata_json = json.dumps(meta)

    await db.commit()
    await db.refresh(entry)

    await log_audit_event(db, current_agent.id, "add", "vip", entry.id, {"identifier": identifier})

    return VIPEntryOut(
        id=entry.id,
        identifier=entry.identifier,
        identifier_type=entry.identifier_type.value,
        is_active=entry.is_active,
        created_at=entry.created_at,
        customer_name=cust.display_name if cust else None,
        priority_tag=entry.priority_tag,
    )


@router.delete("/vip-list/{entry_id}")
async def remove_vip(
    entry_id: str, 
    db: AsyncSession = Depends(get_db),
    current_agent = Depends(get_current_agent)
):
    from app.models import VIPEntry
    result = await db.execute(select(VIPEntry).where(VIPEntry.id == entry_id))
    entry = result.scalar_one_or_none()
    if not entry:
        raise HTTPException(status_code=404, detail="VIP entry not found")
    entry.is_active = False
    await db.commit()
    await log_audit_event(db, current_agent.id, "remove", "vip", entry_id)
    return {"ok": True}
