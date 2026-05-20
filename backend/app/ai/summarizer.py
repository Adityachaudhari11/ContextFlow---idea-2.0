import json
import logging
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models import Message, Conversation, AISummary, SentimentType
from app.config import settings
from app.ai.prompts import SUMMARIZER_SYSTEM_PROMPT

logger = logging.getLogger(__name__)


async def generate_summary(conversation_id: str, db: AsyncSession) -> AISummary | None:
    if not settings.azure_openai_api_key or not settings.azure_openai_endpoint:
        logger.warning("Azure OpenAI not configured — skipping summarization")
        return None

    try:
        # Fetch messages
        result = await db.execute(
            select(Message).where(Message.conversation_id == conversation_id)
            .order_by(Message.created_at)
        )
        messages = result.scalars().all()
        if not messages:
            return None

        # Get customer_id for RAG
        conv_result = await db.execute(select(Conversation).where(Conversation.id == conversation_id))
        conv = conv_result.scalar_one_or_none()
        if not conv:
            return None

        # Build RAG context
        last_content = messages[-1].content
        from app.ai.embedder import embed
        from app.ai.rag import search_past_conversations, search_document_chunks

        query_vec = embed(last_content)
        past = await search_past_conversations(conv.customer_id, query_vec)
        docs = await search_document_chunks(conv.customer_id, query_vec)

        prompt = _build_prompt(messages, past, docs)

        # Call Azure OpenAI
        from openai import AsyncAzureOpenAI
        client = AsyncAzureOpenAI(
            azure_endpoint=settings.azure_openai_endpoint,
            api_key=settings.azure_openai_api_key,
            api_version=settings.azure_openai_api_version,
        )
        response = await client.chat.completions.create(
            model=settings.azure_openai_deployment,
            messages=[
                {"role": "system", "content": SUMMARIZER_SYSTEM_PROMPT},
                {"role": "user", "content": prompt},
            ],
            response_format={"type": "json_object"},
            temperature=0.3,
            max_tokens=500,
        )

        data = json.loads(response.choices[0].message.content)
        sentiment_val = data.get("sentiment", "neutral")
        try:
            sentiment = SentimentType(sentiment_val)
        except ValueError:
            sentiment = SentimentType.neutral

        # Save or update summary
        existing = await db.execute(
            select(AISummary).where(AISummary.conversation_id == conversation_id)
            .order_by(AISummary.generated_at.desc())
        )
        # Create new summary record each time (history preserved)
        summary = AISummary(
            conversation_id=conversation_id,
            one_liner=data.get("one_liner", "Customer support inquiry")[:200],
            detailed_summary=data.get("detailed_summary", ""),
            key_issues_json=json.dumps(data.get("key_issues", [])),
            suggested_action=data.get("suggested_action"),
            sentiment=sentiment,
            model_used=settings.azure_openai_deployment,
        )
        db.add(summary)
        await db.commit()
        await db.refresh(summary)

        # Push to WebSocket
        from app.core.websocket import ws_manager
        await ws_manager.broadcast({
            "type": "summary_ready",
            "data": {
                "conversation_id": conversation_id,
                "one_liner": summary.one_liner,
                "detailed_summary": summary.detailed_summary,
                "key_issues": json.loads(summary.key_issues_json),
                "suggested_action": summary.suggested_action,
                "sentiment": summary.sentiment.value,
            }
        })

        logger.info(f"Summary generated for conversation {conversation_id}: {summary.one_liner}")
        return summary

    except Exception as e:
        logger.error(f"Summarization failed for {conversation_id}: {e}", exc_info=True)
        return None


def _build_prompt(messages, past_context: list[str], doc_context: list[str]) -> str:
    lines = ["=== CURRENT CONVERSATION ==="]
    for msg in messages:
        role = "Customer" if msg.sender_type.value == "customer" else "Agent"
        lines.append(f"[{msg.channel.upper()}] {role}: {msg.content}")

    if past_context:
        lines.append("\n=== RELEVANT PAST INTERACTIONS ===")
        for ctx in past_context[:3]:
            lines.append(f"- {ctx[:200]}")

    if doc_context:
        lines.append("\n=== CUSTOMER DOCUMENTS (bank statements / order history) ===")
        for chunk in doc_context[:3]:
            lines.append(f"- {chunk[:300]}")

    return "\n".join(lines)
