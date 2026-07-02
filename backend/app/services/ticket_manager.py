import logging
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models import Conversation, Agent, AgentRole

logger = logging.getLogger(__name__)

async def assign_ticket_to_agent(conversation_id: str, db: AsyncSession) -> None:
    # 1. Fetch conversation
    result = await db.execute(select(Conversation).where(Conversation.id == conversation_id))
    conv = result.scalar_one_or_none()
    if not conv or conv.assigned_agent_id:
        return  # Already assigned or not found

    # 2. Find eligible agents (Support Agents who are available)
    # If the AI predicted a department, try to match it. For simplicity, just use workload and availability.
    query = select(Agent).where(
        Agent.is_active == True,
        Agent.is_available == True,
        Agent.role == AgentRole.support_agent
    )
    if conv.department:
        # We can add department matching here, if department is populated
        query = query.where(Agent.department == conv.department)

    agents = (await db.execute(query)).scalars().all()

    # Fallback if no specific department agent is found
    if not agents and conv.department:
        fallback_query = select(Agent).where(
            Agent.is_active == True,
            Agent.is_available == True,
            Agent.role == AgentRole.support_agent
        )
        agents = (await db.execute(fallback_query)).scalars().all()

    if not agents:
        logger.warning(f"No available agents to assign for conversation {conversation_id}")
        return

    # 3. Choose the best agent (lowest workload, highest performance)
    best_agent = min(agents, key=lambda a: (a.current_workload, -a.performance_score))

    # 4. Assign and update workload
    conv.assigned_agent_id = best_agent.id
    best_agent.current_workload += 1
    await db.commit()

    logger.info(f"Assigned conversation {conversation_id} to agent {best_agent.full_name} ({best_agent.id})")
