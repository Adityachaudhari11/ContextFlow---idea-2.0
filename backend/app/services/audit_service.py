import json
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import AuditEvent

async def log_audit_event(
    db: AsyncSession,
    agent_id: str | None,
    action: str,
    resource_type: str,
    resource_id: str | None = None,
    details: dict | None = None,
):
    """
    Log a sensitive action performed by an agent.
    """
    event = AuditEvent(
        agent_id=agent_id,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        details=json.dumps(details) if details else None,
    )
    db.add(event)
    await db.commit()
