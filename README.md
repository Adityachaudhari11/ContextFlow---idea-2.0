<div align="center">

<img src="https://img.shields.io/badge/idea%202.0-Hackathon%202026-0f3833?style=for-the-badge&labelColor=0f3833&color=14b8a6" />

# ContextFlow

### Omni-Channel Customer Communication Platform for India's Banking Sector

<p align="center">
  Unify WhatsApp · Instagram · Email · Telegram into one AI-powered agent inbox.<br/>
  Customers never repeat themselves. Agents always have full context.
</p>

---

![Python](https://img.shields.io/badge/Python-3.12-3776ab?style=flat-square&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=flat-square&logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-19-61dafb?style=flat-square&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6?style=flat-square&logo=typescript&logoColor=white)
![Azure OpenAI](https://img.shields.io/badge/Azure_OpenAI-GPT--4o-0078d4?style=flat-square&logo=microsoftazure&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-aiosqlite-003b57?style=flat-square&logo=sqlite&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-22c55e?style=flat-square)

</div>

---

## Overview

**ContextFlow** is a hackathon-grade omni-channel support platform purpose-built for India's Public Sector Banks, Regional Rural Banks, and Co-operative Banks. It connects WhatsApp, Instagram, Email, and Telegram into a single unified thread — so when a customer starts on Instagram and continues on WhatsApp, they never have to repeat themselves.

Every inbound message is automatically summarised, sentiment-scored, and action-suggested by Azure GPT-4o. Agents reply from one inbox. Campaigns are audience-targeted by transaction history. Every outbound message passes a compliance check before dispatch.

---

## Architecture

```
Inbound (any channel)
        │
        ▼
  FastAPI Webhooks / IMAP Poller / Telegram Poller
        │
        ▼
  asyncio.Queue  ──▶  Inbound Worker
        │                    │
        │              Identity Resolution
        │              (email → golden record)
        │                    │
        │              Persist Message (SQLite)
        │                    │
        │              Azure GPT-4o Summary
        │                    │
        ▼                    ▼
  WebSocket Push  ◀──  Agent Dashboard (React)
        │
        ▼
  Agent replies  ──▶  asyncio.Queue  ──▶  Outbound Worker
                                               │
                                    DNC check + channel dispatch
```

---

## Modules

| Module | Description |
|---|---|
| **Inbox** | 3-panel layout — conversation list, message thread, Customer 360 panel. Real-time WebSocket updates. |
| **Customer 360** | Profile, linked channels, transaction history, AI summary with sentiment + key issues. |
| **Campaigns** | Create, submit for review, approve, and schedule multi-channel promotional campaigns. Audience filtered by transaction behaviour. |
| **Compliance** | Do Not Contact list management (email-keyed, blocks all channels). Auto opt-out via "opt out" reply. |
| **Analytics** | KPI cards, volume trends, channel distribution, sentiment breakdown. |

---

## AI Pipeline

Every inbound message triggers a pipeline powered by **Azure OpenAI GPT-4o**:

1. **Identity resolution** — maps channel identifier (phone, email, Telegram ID) to a single customer golden record
2. **Summarisation** — one-liner + detailed summary with key issues and suggested action
3. **Sentiment classification** — `positive | neutral | negative | frustrated`
4. **Auto-reply** — first-contact acknowledgement sent back on the same channel in-thread (email replies use `In-Reply-To` for proper threading)
5. **Opt-out detection** — if customer replies exactly `opt out`, their email is added to DNC and an acknowledgement is sent

Embeddings via `sentence-transformers/all-MiniLM-L6-v2` (HuggingFace, local) stored in **LanceDB** for RAG-ready document search.

---

## Quick Start

**Prerequisites:** Python 3.12+, Node.js 20+, pnpm

```bash
# Clone
git clone https://github.com/Huuffy/ContextFlow.git
cd ContextFlow

# Backend
cd backend
uv venv && uv pip install -r requirements.txt
cp .env.example .env          # fill in AZURE_OPENAI_* + GMAIL_* + TELEGRAM_*
uv run python -m app.scripts.seed_db   # seeds 20 customers, 15 conversations
uv run uvicorn app.main:app --reload --port 8000

# Frontend (new terminal)
cd frontend
pnpm install
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173)

Or from the project root:

```bash
python run.py    # launches both backend and frontend in separate terminal windows
```

---

## Environment Variables

Create `backend/.env`:

```env
# Azure OpenAI (required for AI summaries)
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_API_KEY=your_key
AZURE_OPENAI_DEPLOYMENT=gpt-4o

# Gmail (required for live email channel)
GMAIL_ADDRESS=your@gmail.com
GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx

# Telegram (required for live Telegram channel)
TELEGRAM_BOT_TOKEN=123456:ABC-DEF...
TELEGRAM_USE_POLLING=true
```

---

## Project Structure

```
contextflow/
├── backend/
│   ├── app/
│   │   ├── api/v1/          # REST endpoints (conversations, messages, campaigns, compliance…)
│   │   ├── api/webhooks/    # Telegram, Meta, Simulator webhook handlers
│   │   ├── events/          # inbound_worker, outbound_worker, asyncio queues
│   │   ├── integrations/    # email_client, email_poller, telegram_client, telegram_poller
│   │   ├── models/          # SQLAlchemy models (SQLite via aiosqlite)
│   │   ├── services/        # identity_resolution, message_service
│   │   ├── ai/              # summarizer (GPT-4o), embedder (MiniLM)
│   │   └── scripts/         # seed_db.py
│   └── data/                # SQLite DB + LanceDB vector store (gitignored)
├── frontend/
│   ├── src/
│   │   ├── layouts/         # DashboardLayout (collapsible sidebar)
│   │   ├── pages/
│   │   │   ├── inbox/       # InboxPage, ConversationList, ConversationThread, Customer360Panel
│   │   │   ├── CampaignsPage.tsx
│   │   │   ├── CompliancePage.tsx
│   │   │   ├── AnalyticsPage.tsx
│   │   │   └── HomePage.tsx
│   │   ├── services/        # api.ts (Axios)
│   │   ├── stores/          # conversationStore (Zustand)
│   │   └── hooks/           # useWebSocket
│   └── public/
└── run.py                   # launcher script (Windows)
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS 4, Zustand, Framer Motion |
| Backend | FastAPI, Python 3.12, SQLAlchemy async, aiosqlite (SQLite) |
| Vector Store | LanceDB + `sentence-transformers/all-MiniLM-L6-v2` |
| AI | Azure OpenAI GPT-4o (summaries, sentiment) |
| Real-time | WebSocket (FastAPI native) |
| Email | Gmail IMAP poller + SMTP (aiosmtplib) |
| Telegram | Telegram Bot API (long polling) |

---

## Demo Data

Running `seed_db.py` creates:

- **20 customers** with realistic Indian banking profiles and transaction histories
- **15 conversations** across all status states (`open`, `waiting`, `resolved`, `closed`)
- **5 campaigns** at every lifecycle stage (draft → pending → approved → running → completed)
- **7 DNC entries** simulating real opt-out records
- Multi-channel conversations (WhatsApp + Email, Telegram + Email, etc.)
- All 4 sentiment variants: `positive`, `neutral`, `negative`, `frustrated`

---

## Team

<div align="center">

**Team CloudCompute** · idea 2.0 Hackathon 2026

[virajbhatia1611@gmail.com](mailto:virajbhatia1611@gmail.com)

</div>

---

<div align="center">
<sub>Built for India's banking sector · PSBs · RRBs · Co-operative Banks</sub>
</div>
