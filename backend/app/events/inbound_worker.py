import asyncio
import json
import logging
import re
from app.events.queues import InboundEvent, inbound_queue

logger = logging.getLogger(__name__)

# chat_id → customer_id for users waiting to provide their phone number
_awaiting_phone: dict[str, str] = {}
# cache_key → phone for users who provided a phone and are waiting for OTP
_awaiting_otp_reply: dict[str, str] = {}
# phone → {"otp": "1234", "customer_id": "...", "channel": "...", "identifier": "..."}
_phone_otp_state: dict[str, dict] = {}

def _normalise_phone(phone: str) -> str | None:
    import re
    digits = re.sub(r'[^\d+]', '', phone)
    if re.match(r'^\+?\d{10,15}$', digits):
        return digits if digits.startswith('+') else f"+{digits}"
    return None




async def run_inbound_worker(queue: asyncio.Queue[InboundEvent]) -> None:
    logger.info("Inbound worker started")
    while True:
        try:
            event = await queue.get()
            asyncio.create_task(_process(event))
        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.error(f"Inbound worker error: {e}")


AUTO_REPLY_TEXT = (
    "Thank you for reaching out to NeoBank Support! "
    "Our team has received your message and will get back to you shortly.\n\n"
    "To opt out of this service, reply with just: opt out\n"
    "— NeoBank Support Team"
)

TELEGRAM_WELCOME = (
    "Hi! Welcome to NeoBank Support! How can we assist you today?"
)

CHAT_FIRST_CONTACT_REPLY = (
    "Thank you for reaching out to NeoBank Support! Our team has received your message "
    "and will get back to you shortly.\n\n"
    "If you already have a previous conversation, please share your phone number with "
    "country code in format +91xxxxxxxxxx so we can link your history.\n\n"
    "To opt out of this service, reply with just: opt out\n"
    "— NeoBank Support Team"
)

CHAT_FIRST_CONTACT_PAYMENT_REPLY = (
    "Thank you for reaching out to NeoBank Support! Our team has received your message "
    "and will get back to you shortly.\n\n"
    "We noticed your query may relate to a payment or transaction. To help us pull up "
    "your account details, please reply with your phone number and NeoBank account number.\n\n"
    "To opt out of this service, reply with just: opt out\n"
    "— NeoBank Support Team"
)


PAYMENT_KEYWORDS = frozenset({
    "payment", "transaction", "transfer", "debit", "credit", "amount",
    "charge", "balance", "paid", "received", "sent", "refund", "dispute",
    "₹", " rs ", "rupee", "rupees", "upi", "neft", "rtgs", "imps",
    "overcharged", "wrong amount", "double charge",
})

PAYMENT_AUTO_REPLY = (
    "Thank you for contacting NeoBank Support!\n\n"
    "We noticed your query relates to a payment or transaction. "
    "To pull up your account details, please reply with your NeoBank account number.\n\n"
    "For demo purposes, try one of these accounts:\n"
    "  • 8888 — Savings Account\n"
    "  • 9999 — Current Account\n"
    "  • 7777 — Credit Account\n"
    "  • 6666 — Salary Account\n\n"
    "Just reply with the number and we'll fetch your transaction history.\n"
    "— NeoBank Support Team"
)

ACC_LINKED_REPLY = (
    "Account {acc_no} linked successfully! "
    "Our team can now see your transaction history and will assist you shortly.\n"
    "— NeoBank Support Team"
)

_ACC_RE = re.compile(r'\b(\d{4,12})\b')

OPT_OUT_ACK = (
    "You have been successfully opted out. "
    "You will no longer receive marketing communications from NeoBank. "
    "If this was a mistake, please contact your branch. "
    "— NeoBank Support Team"
)


async def _process(event: InboundEvent) -> None:
    from app.db.session import AsyncSessionLocal
    from app.services.identity_resolution import resolve_identity
    from app.services.message_service import persist_inbound_message, persist_system_message, is_first_message
    from app.core.websocket import ws_manager

    try:
        auto_reply_msg = None

        async with AsyncSessionLocal() as db:
            customer_id, conversation_id = await resolve_identity(event, db)

            # --- Opt-out detection: message is EXACTLY "opt out" (any channel) ---
            if event.content.strip().lower() == "opt out":
                await _handle_opt_out(event, customer_id, conversation_id, db)
                return

            # --- Telegram /start command ---
            if event.channel == "telegram" and event.content.strip() == "/start":
                await _handle_telegram_start(event, customer_id, db)
                await db.commit()
                return

            # --- Cross-channel email linking (Telegram / Instagram / WhatsApp) ---
            if event.channel in ("telegram", "instagram", "whatsapp"):
                handled = await _handle_phone_linking_flow(event, customer_id, conversation_id, db)
                if handled:
                    await db.commit()
                    return  # email reply consumed — don't persist as a normal message

            message = await persist_inbound_message(event, customer_id, conversation_id, db)

            # Ticket state machine
            from app.models import Conversation, ConversationStatus
            from sqlalchemy import select as _select
            conv_result = await db.execute(_select(Conversation).where(Conversation.id == conversation_id))
            _conv = conv_result.scalar_one_or_none()
            if _conv:
                if _conv.status == ConversationStatus.waiting:
                    _conv.status = ConversationStatus.open
                elif _conv.status == ConversationStatus.awaiting_acc_no:
                    # Try to extract account number from reply
                    acc_no = _extract_account_number(event.content)
                    if acc_no:
                        await _ensure_account_exists(acc_no, db)
                        _conv.linked_account_number = acc_no
                        _conv.status = ConversationStatus.open
                        auto_reply_msg = await persist_system_message(
                            ACC_LINKED_REPLY.format(acc_no=acc_no),
                            event.channel, conversation_id, db
                        )

            # Store email subject as conv topic so agent replies can thread correctly
            if _conv and event.channel == "email":
                subject = event.raw.get("subject", "")
                if subject and not _conv.topic:
                    _conv.topic = subject

            # Auto-reply for email and chat platforms: first contact only
            if event.channel in ("email", "telegram", "instagram", "whatsapp") and await is_first_message(conversation_id, db):
                if event.channel == "whatsapp":
                    if _has_payment_keywords(event.content):
                        auto_reply_msg = await persist_system_message(
                            PAYMENT_AUTO_REPLY, event.channel, conversation_id, db
                        )
                        if _conv:
                            _conv.status = ConversationStatus.awaiting_acc_no
                    else:
                        auto_reply_msg = await persist_system_message(
                            AUTO_REPLY_TEXT, event.channel, conversation_id, db
                        )
                else:
                    if _has_payment_keywords(event.content):
                        auto_reply_msg = await persist_system_message(
                            CHAT_FIRST_CONTACT_PAYMENT_REPLY, event.channel, conversation_id, db
                        )
                        if _conv:
                            _conv.status = ConversationStatus.awaiting_acc_no
                    else:
                        auto_reply_msg = await persist_system_message(
                            CHAT_FIRST_CONTACT_REPLY, event.channel, conversation_id, db
                        )

            await db.commit()

        asyncio.create_task(_embed_message(message.id, event.content, conversation_id, customer_id, event.channel))
        asyncio.create_task(_summarize(conversation_id))

        await ws_manager.broadcast({
            "type": "message_new",
            "data": {
                "message_id": message.id,
                "conversation_id": conversation_id,
                "customer_id": customer_id,
                "channel": event.channel,
                "content": event.content,
                "sender_type": "customer",
                "direction": "inbound",
            }
        })

        # Deliver auto-reply on the actual channel and broadcast to dashboard
        if auto_reply_msg:
            asyncio.create_task(_deliver_auto_reply(event.channel, event.identifier, auto_reply_msg.content, event.raw))
            await ws_manager.broadcast({
                "type": "message_new",
                "data": {
                    "message_id": auto_reply_msg.id,
                    "conversation_id": conversation_id,
                    "customer_id": customer_id,
                    "channel": event.channel,
                    "content": auto_reply_msg.content,
                    "sender_type": "system",
                    "direction": "outbound",
                }
            })

    except Exception as e:
        logger.error(f"Error processing inbound event: {e}", exc_info=True)


def _has_payment_keywords(content: str) -> bool:
    text = content.lower()
    return any(kw in text for kw in PAYMENT_KEYWORDS)


def _extract_account_number(content: str) -> str | None:
    match = _ACC_RE.search(content)
    return match.group(1) if match else None


async def _ensure_account_exists(account_number: str, db) -> None:
    from app.models import BankAccount
    from sqlalchemy import select
    result = await db.execute(select(BankAccount).where(BankAccount.account_number == account_number))
    if not result.scalar_one_or_none():
        db.add(BankAccount(
            account_number=account_number,
            nickname="Linked Account",
            account_type="savings",
            balance=0,
        ))


async def _handle_opt_out(event: InboundEvent, customer_id: str,
                           conversation_id: str, db) -> None:
    """Persist the opt-out message, add customer email to DNC, send ack, no status change."""
    from app.models import Customer, DNCEntry, IdentifierType
    from sqlalchemy import select as _select
    from app.services.message_service import persist_inbound_message, persist_system_message
    from app.core.websocket import ws_manager

    # Persist the "opt out" message so it's visible in the thread
    message = await persist_inbound_message(event, customer_id, conversation_id, db)

    # Find customer email and add to DNC
    cr = await db.execute(_select(Customer).where(Customer.id == customer_id))
    cust = cr.scalar_one_or_none()
    email_key = cust.email.lower() if cust and cust.email else None

    if email_key:
        existing = await db.execute(
            _select(DNCEntry).where(
                DNCEntry.identifier == email_key,
                DNCEntry.identifier_type == IdentifierType.email,
                DNCEntry.is_active == True,
            )
        )
        if not existing.scalar_one_or_none():
            db.add(DNCEntry(identifier=email_key, identifier_type=IdentifierType.email, is_active=True))
            logger.info(f"Opt-out: added {email_key} to DNC list")

    # Persist ack as system message (no status change)
    ack_msg = await persist_system_message(OPT_OUT_ACK, event.channel, conversation_id, db)
    await db.commit()

    # Deliver ack on the channel
    asyncio.create_task(_deliver_auto_reply(event.channel, event.identifier, OPT_OUT_ACK, event.raw))

    # Broadcast both messages to dashboard
    await ws_manager.broadcast({
        "type": "message_new",
        "data": {
            "message_id": message.id,
            "conversation_id": conversation_id,
            "customer_id": customer_id,
            "channel": event.channel,
            "content": event.content,
            "sender_type": "customer",
            "direction": "inbound",
        }
    })
    await ws_manager.broadcast({
        "type": "message_new",
        "data": {
            "message_id": ack_msg.id,
            "conversation_id": conversation_id,
            "customer_id": customer_id,
            "channel": event.channel,
            "content": OPT_OUT_ACK,
            "sender_type": "system",
            "direction": "outbound",
        }
    })


async def _deliver_auto_reply(channel: str, identifier: str, text: str, raw: dict | None = None) -> None:
    try:
        if channel == "email":
            from app.integrations.email_client import send_email
            raw = raw or {}
            original_subject = raw.get("subject", "NeoBank Support")
            reply_subject = original_subject if original_subject.lower().startswith("re:") else f"Re: {original_subject}"
            in_reply_to = raw.get("message_id") or None
            await send_email(
                to=identifier,
                subject=reply_subject,
                body=text,
                in_reply_to=in_reply_to,
            )
        else:
            await _send_on_channel(channel, identifier, text)
    except Exception as e:
        logger.error(f"Auto-reply delivery failed on {channel} to {identifier}: {e}")


async def _send_on_channel(channel: str, identifier: str, text: str) -> None:
    """Send a message back to the customer on whichever channel they used."""
    try:
        if channel == "telegram":
            from app.integrations.telegram_client import send_telegram_message
            await send_telegram_message(identifier, text)
        elif channel == "instagram":
            from app.integrations.instagram import send_instagram_message
            await send_instagram_message(identifier, text)
        elif channel == "whatsapp":
            from app.integrations.whatsapp import send_whatsapp_message
            await send_whatsapp_message(identifier, text)
    except Exception as e:
        logger.error(f"Failed to send linking prompt on {channel} to {identifier}: {e}")


async def _handle_telegram_start(event: InboundEvent, customer_id: str, db) -> None:
    """Handle Telegram /start: just send a welcome greeting. Email/account prompt fires on first real question."""
    await _send_on_channel("telegram", event.identifier, TELEGRAM_WELCOME)


async def _handle_phone_linking_flow(event: InboundEvent, customer_id: str,
                                      conversation_id: str, db) -> bool:
    """
    Handles phone-based OTP cross-channel linking.
    """
    import random
    from app.models import Customer
    from sqlalchemy import select

    identifier = event.identifier
    channel = event.channel
    content = event.content.strip()
    cache_key = f"{channel}:{identifier}"

    # Handle WhatsApp incoming 'otp' request
    if channel == "whatsapp" and content.lower() == "otp":
        phone = _normalise_phone(identifier)
        if phone and phone in _phone_otp_state:
            otp = _phone_otp_state[phone]["otp"]
            await _send_on_channel("whatsapp", identifier, f"Your OTP is {otp}. Please send this code on the other platform to link your accounts.")
            return True

    # Case 1: waiting for OTP reply on Telegram/Instagram
    if cache_key in _awaiting_otp_reply:
        phone = _awaiting_otp_reply[cache_key]
        if phone in _phone_otp_state and _phone_otp_state[phone]["otp"] == content:
            await _link_to_phone(channel, identifier, customer_id, phone, db)
            await _send_on_channel(channel, identifier, "Done! Your account is now linked. We can see your full support history.")
            del _awaiting_otp_reply[cache_key]
            del _phone_otp_state[phone]
            return True
        else:
            await _send_on_channel(channel, identifier, "Incorrect OTP. Please try again or send a new message.")
            # Don't return True here so they can keep conversing, or do we? Let's just return True to consume it
            return True

    # Case 2: waiting for phone number reply
    if cache_key in _awaiting_phone:
        phone = _normalise_phone(content)
        if phone:
            otp = str(random.randint(1000, 9999))
            _phone_otp_state[phone] = {"otp": otp, "customer_id": customer_id}
            _awaiting_otp_reply[cache_key] = phone
            del _awaiting_phone[cache_key]
            await _send_on_channel(channel, identifier, f"Please write 'otp' on WhatsApp to +91 93213 27230 to get your OTP.")
            return True

    # Case 3: new customer with no phone — ask once
    if channel != "whatsapp":
        result = await db.execute(select(Customer).where(Customer.id == customer_id))
        customer = result.scalar_one_or_none()
        if customer and not customer.phone:
            _awaiting_phone[cache_key] = customer_id
            # Auto-reply handles the initial text for telegram.

    return False


async def _link_to_phone(channel: str, identifier: str, current_customer_id: str,
                         phone: str, db) -> None:
    """Link channel identifier to an existing phone customer, or update current customer's phone."""
    from app.models import Customer, ChannelIdentifier, Conversation
    from app.services.identity_resolution import invalidate_cache
    from sqlalchemy import select, update, delete

    result = await db.execute(select(Customer).where(Customer.phone == phone))
    existing = result.scalar_one_or_none()

    if existing and existing.id != current_customer_id:
        # Reassign channel identifier to existing customer
        await db.execute(
            update(ChannelIdentifier)
            .where(ChannelIdentifier.channel == channel,
                   ChannelIdentifier.identifier == identifier)
            .values(customer_id=existing.id)
        )

        # Find the existing customer's most recent active conversation to merge into
        from app.models import Message as MessageModel
        target_result = await db.execute(
            select(Conversation)
            .where(Conversation.customer_id == existing.id)
            .order_by(Conversation.last_message_at.desc())
            .limit(1)
        )
        target_conv = target_result.scalar_one_or_none()

        # Merge all conversations from the new (channel-only) customer into the target
        src_result = await db.execute(
            select(Conversation).where(Conversation.customer_id == current_customer_id)
        )
        for conv in src_result.scalars().all():
            if target_conv:
                # Move all messages into the target conversation
                await db.execute(
                    update(MessageModel)
                    .where(MessageModel.conversation_id == conv.id)
                    .values(conversation_id=target_conv.id)
                )
                # Add channel to target conversation's active channels
                channels = json.loads(target_conv.active_channels_json or "[]")
                if channel not in channels:
                    channels.append(channel)
                    target_conv.active_channels_json = json.dumps(channels)
                await db.delete(conv)
            else:
                conv.customer_id = existing.id

        await db.execute(delete(Customer).where(Customer.id == current_customer_id))
        invalidate_cache(channel, identifier)
        logger.info(f"Merged {channel}:{identifier} into existing customer {existing.id} ({phone}), target conv: {target_conv.id if target_conv else 'none'}")
    else:
        # No existing phone customer — store email on current customer
        result = await db.execute(select(Customer).where(Customer.id == current_customer_id))
        customer = result.scalar_one_or_none()
        if customer:
            customer.phone = phone
            logger.info(f"Updated customer {current_customer_id} phone to {phone}")


async def _embed_message(message_id: str, content: str, conversation_id: str,
                          customer_id: str, channel: str) -> None:
    try:
        from app.ai.embedder import embed_async
        from app.db.lancedb_client import get_message_embeddings_table
        from datetime import datetime, timezone

        vector = await embed_async(content)
        table = get_message_embeddings_table()
        table.add([{
            "message_id": message_id,
            "conversation_id": conversation_id,
            "customer_id": customer_id,
            "content": content,
            "channel": channel,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "vector": vector,
        }])
    except Exception as e:
        logger.error(f"Embedding error for message {message_id}: {e}")


async def _summarize(conversation_id: str) -> None:
    try:
        from app.ai.summarizer import generate_summary
        from app.db.session import AsyncSessionLocal
        async with AsyncSessionLocal() as db:
            await generate_summary(conversation_id, db)
    except Exception as e:
        logger.error(f"Summarization error for conversation {conversation_id}: {e}")
