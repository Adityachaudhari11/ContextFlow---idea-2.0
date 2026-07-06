from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db
from app.models import AuditEvent
from app.core.security import require_roles
from pydantic import BaseModel
from datetime import datetime

router = APIRouter(
    prefix="/audit-logs", 
    tags=["audit-logs"],
    dependencies=[Depends(require_roles(["admin", "compliance_officer"]))]
)

class AuditEventOut(BaseModel):
    id: str
    agent_id: str | None
    action: str
    resource_type: str
    resource_id: str | None
    details: str | None
    created_at: datetime
    agent_name: str | None = None

@router.get("", response_model=list[AuditEventOut])
async def list_audit_logs(db: AsyncSession = Depends(get_db), limit: int = 50, offset: int = 0):
    result = await db.execute(
        select(AuditEvent)
        .order_by(AuditEvent.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    events = result.scalars().all()
    
    out = []
    for e in events:
        out.append(AuditEventOut(
            id=e.id,
            agent_id=e.agent_id,
            action=e.action,
            resource_type=e.resource_type,
            resource_id=e.resource_id,
            details=e.details,
            created_at=e.created_at,
            agent_name=e.agent.full_name if e.agent else None
        ))
    return out
