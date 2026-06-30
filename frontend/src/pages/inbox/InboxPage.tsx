import { useEffect, useState, useRef } from 'react'
import { Mail, X, CreditCard, Landmark, Wallet, Banknote, ArrowUpRight, ArrowDownLeft, Copy, Check } from 'lucide-react'
import { useConversationStore } from '../../stores/conversationStore'
import { conversations as convApi } from '../../services/api'
import type { Conversation } from '../../types'
import ConversationList from './ConversationList'
import ConversationThread from './ConversationThread'
import Customer360Panel from './Customer360Panel'

const DEMO_ACCOUNTS = [
  {
    number: '8888',
    label: 'Savings Account',
    balance: '₹1,24,500',
    icon: Landmark,
    color: 'teal',
    transactions: [
      { date: 'May 26', desc: 'Amazon Shopping', amount: '₹3,200', type: 'debit' },
      { date: 'May 24', desc: 'Salary Credit', amount: '₹55,000', type: 'credit' },
      { date: 'May 22', desc: 'Electricity Bill', amount: '₹1,850', type: 'debit' },
      { date: 'May 19', desc: 'Zomato Order', amount: '₹450', type: 'debit' },
      { date: 'May 15', desc: 'ATM Withdrawal', amount: '₹5,000', type: 'debit' },
    ],
  },
  {
    number: '9999',
    label: 'Current Account',
    balance: '₹3,80,200',
    icon: Wallet,
    color: 'blue',
    transactions: [
      { date: 'May 27', desc: 'NEFT Transfer In', amount: '₹1,20,000', type: 'credit' },
      { date: 'May 25', desc: 'Vendor Payment', amount: '₹45,000', type: 'debit' },
      { date: 'May 23', desc: 'GST Payment', amount: '₹18,200', type: 'debit' },
      { date: 'May 20', desc: 'Client Receipt', amount: '₹2,00,000', type: 'credit' },
      { date: 'May 18', desc: 'Office Supplies', amount: '₹3,600', type: 'debit' },
    ],
  },
  {
    number: '7777',
    label: 'Credit Account',
    balance: '₹42,750 due',
    icon: CreditCard,
    color: 'purple',
    transactions: [
      { date: 'May 25', desc: 'Swiggy Order', amount: '₹680', type: 'debit' },
      { date: 'May 22', desc: 'UNKNOWN_MERCH_INT', amount: '₹2,500', type: 'debit' },
      { date: 'May 20', desc: 'Myntra Purchase', amount: '₹4,299', type: 'debit' },
      { date: 'May 17', desc: 'Payment Received', amount: '₹15,000', type: 'credit' },
      { date: 'May 14', desc: 'BookMyShow', amount: '₹820', type: 'debit' },
    ],
  },
  {
    number: '6666',
    label: 'Salary Account',
    balance: '₹68,300',
    icon: Banknote,
    color: 'amber',
    transactions: [
      { date: 'May 26', desc: 'Grocery Store UPI', amount: '₹5,000', type: 'debit' },
      { date: 'May 24', desc: 'Salary Credit', amount: '₹72,000', type: 'credit' },
      { date: 'May 22', desc: 'Flipkart Order', amount: '₹5,500', type: 'debit' },
      { date: 'May 19', desc: 'Netflix Subscription', amount: '₹649', type: 'debit' },
      { date: 'May 15', desc: 'UPI Transfer Out', amount: '₹2,000', type: 'debit' },
    ],
  },
]

const COLOR_MAP: Record<string, { bg: string; text: string; border: string; light: string }> = {
  teal:   { bg: 'bg-teal-500/20',   text: 'text-teal-300',   border: 'border-teal-500/35',   light: 'bg-teal-950/20'   },
  blue:   { bg: 'bg-blue-500/20',   text: 'text-blue-300',   border: 'border-blue-500/35',   light: 'bg-blue-950/20'   },
  purple: { bg: 'bg-purple-500/20', text: 'text-purple-300', border: 'border-purple-500/35', light: 'bg-purple-950/20' },
  amber:  { bg: 'bg-amber-500/20',  text: 'text-amber-300',  border: 'border-amber-500/35',  light: 'bg-amber-950/20'  },
}

const GMAIL_URL = 'https://mail.google.com/mail/u/0/#inbox?compose=new'
const INBOX_EMAIL = 'neobanksupport@gmail.com'

function CopyEmailButton({ email }: { email: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(email)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button
      onClick={copy}
      className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/5 border border-teal-500/30 hover:bg-white/10 transition-colors"
    >
      <span className="text-xs font-mono font-bold text-teal-300">{email}</span>
      {copied
        ? <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
        : <Copy className="w-3.5 h-3.5 text-teal-400 flex-shrink-0" />
      }
    </button>
  )
}
const COUNTDOWN_SEC = 10

function TestEmailModal({ onClose }: { onClose: () => void }) {
  const [seconds, setSeconds] = useState(COUNTDOWN_SEC)
  const ready = seconds <= 0

  useEffect(() => {
    if (ready) return
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000)
    return () => clearTimeout(t)
  }, [seconds, ready])

  const handleOpenGmail = () => {
    window.open(GMAIL_URL, '_blank', 'noopener,noreferrer')
  }

  const circumference = 2 * Math.PI * 18
  const progress = (seconds / COUNTDOWN_SEC) * circumference

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <div className="relative bg-[#020e0c]/90 border border-white/10 rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col text-white" style={{ maxHeight: '82vh' }}>

        {/* Header */}
        <div className="flex-shrink-0 px-6 pt-6 pb-4 border-b border-white/5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-serif font-bold text-white">Demo Account Reference</h2>
              <p className="text-xs text-white/55 mt-1">
                For payment-related issues, NeoBank links your account transactions directly to the support thread
              </p>
            </div>
            <button
              onClick={onClose}
              className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white/40 hover:bg-white/5 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          {/* Send-to address */}
          <div className="mt-4 flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-teal-500/5 border border-teal-500/25">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-teal-400 flex-shrink-0" />
              <span className="text-xs text-white/80">Send your test email <strong>to:</strong></span>
            </div>
            <CopyEmailButton email={INBOX_EMAIL} />
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {DEMO_ACCOUNTS.map((acc) => {
            const c = COLOR_MAP[acc.color]
            const Icon = acc.icon
            return (
              <div key={acc.number} className={`rounded-xl border ${c.border} ${c.light} p-4`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-8 h-8 rounded-lg ${c.bg} flex items-center justify-center flex-shrink-0 border border-white/10`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold uppercase tracking-wider ${c.text}`}>#{acc.number}</span>
                      <span className="text-xs text-white/70 font-semibold">{acc.label}</span>
                    </div>
                    <div className="text-[11px] text-white/40">Balance: <span className="font-semibold text-white/80">{acc.balance}</span></div>
                  </div>
                </div>
                <div className="space-y-1.5">
                  {acc.transactions.map((tx, i) => (
                    <div key={i} className="flex items-center justify-between bg-black/20 border border-white/5 rounded-lg px-3 py-2 text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        {tx.type === 'credit'
                          ? <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                          : <ArrowUpRight className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                        }
                        <span className="text-white/80 truncate font-medium">{tx.desc}</span>
                      </div>
                      <div className="flex items-center gap-2.5 flex-shrink-0 ml-2">
                        <span className={tx.type === 'credit' ? 'text-emerald-300 font-bold' : 'text-white/80'}>{tx.amount}</span>
                        <span className="text-white/30 font-semibold text-[10px]">{tx.date}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 border-t border-white/5 bg-[#020e0c] rounded-b-2xl overflow-hidden">
          {ready ? (
            <div className="px-6 py-4 flex items-center gap-4">
              <button
                onClick={handleOpenGmail}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold uppercase tracking-wider bg-teal-500 hover:bg-teal-400 text-black transition-all shadow-md shadow-teal-500/10 active:scale-98 animate-pulse"
              >
                <Mail className="w-4 h-4" />
                Open Gmail — Compose test email
              </button>
              <button onClick={onClose} className="px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider bg-white/5 hover:bg-white/10 text-white/80 border border-white/10 transition-colors">
                Close
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-4 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="relative w-9 h-9 flex-shrink-0">
                  <svg className="w-9 h-9 -rotate-90" viewBox="0 0 40 40">
                    <circle cx="20" cy="20" r="18" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3.5" />
                    <circle
                      cx="20" cy="20" r="18"
                      fill="none"
                      stroke={seconds <= 3 ? '#f87171' : '#2dd4bf'}
                      strokeWidth="3.5"
                      strokeDasharray={`${circumference}`}
                      strokeDashoffset={`${circumference - progress}`}
                      strokeLinecap="round"
                      style={{ transition: 'stroke-dashoffset 0.9s linear, stroke 0.3s' }}
                    />
                  </svg>
                  <span className={`absolute inset-0 flex items-center justify-center text-xs font-bold ${seconds <= 3 ? 'text-red-400' : 'text-teal-400'}`}>
                    {seconds}
                  </span>
                </div>
                <div>
                  <p className="text-xs font-bold text-white/80 uppercase tracking-wide">Verify demo accounts reference</p>
                  <p className="text-[10px] text-white/40">Gmail launcher available in {seconds}s</p>
                </div>
              </div>
              <button onClick={onClose} className="px-3.5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider bg-white/5 hover:bg-white/10 text-white/70 border border-white/10 transition-colors">
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function InboxPage() {
  const { conversations, activeId, setConversations, setActive } = useConversationStore()
  const [history, setHistory] = useState<Conversation[]>([])
  const [tab, setTab] = useState<'active' | 'history'>('active')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string[]>([])
  const [panelWidth, setPanelWidth] = useState(330)
  const [showTestModal, setShowTestModal] = useState(false)

  const dragging = useRef(false)
  const startX = useRef(0)
  const startW = useRef(0)

  const active = conversations.find((c) => c.id === activeId) ?? history.find((c) => c.id === activeId) ?? null

  useEffect(() => {
    const loadActive = () =>
      Promise.all([convApi.list({ status: 'open' }), convApi.list({ status: 'waiting' }), convApi.list({ status: 'awaiting_acc_no' })]).then(
        ([open, waiting, awaitingAcc]) =>
          setConversations(
            [...open, ...waiting, ...awaitingAcc].sort(
              (a, b) =>
                new Date(b.last_message_at ?? b.created_at).getTime() -
                new Date(a.last_message_at ?? a.created_at).getTime()
            )
          )
      )

    loadActive()
    Promise.all([convApi.list({ status: 'resolved' }), convApi.list({ status: 'closed' })]).then(
      ([resolved, closed]) =>
        setHistory(
          [...resolved, ...closed].sort(
            (a, b) =>
              new Date(b.last_message_at ?? b.created_at).getTime() -
              new Date(a.last_message_at ?? a.created_at).getTime()
          )
        )
    )

    const interval = setInterval(loadActive, 15000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current) return
      setPanelWidth(Math.min(520, Math.max(220, startW.current + (e.clientX - startX.current))))
    }
    const onUp = () => { dragging.current = false }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [])

  const onDragStart = (e: React.MouseEvent) => {
    dragging.current = true
    startX.current = e.clientX
    startW.current = panelWidth
    e.preventDefault()
  }

  const displayList = tab === 'active' ? conversations : history

  const handleTabChange = (t: 'active' | 'history') => {
    setTab(t)
    setStatusFilter([])
  }

  const filtered = displayList.filter((c) => {
    const matchSearch = !search || (() => {
      const q = search.toLowerCase()
      return (
        c.customer_name?.toLowerCase().includes(q) ||
        c.topic?.toLowerCase().includes(q) ||
        c.one_liner?.toLowerCase().includes(q)
      )
    })()
    return matchSearch && (statusFilter.length === 0 || statusFilter.includes(c.status))
  })

  return (
    <div className="h-full flex flex-col overflow-hidden bg-transparent">

      {showTestModal && <TestEmailModal onClose={() => setShowTestModal(false)} />}

      {/* Live test banner */}
      <div className="flex-shrink-0 flex items-center justify-between gap-3 px-6 py-2.5 bg-[#020e0c]/60 backdrop-blur-md border-b border-[#2dd4bf]/15 text-xs z-10 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
        <div className="flex items-center gap-2 text-teal-300 font-semibold uppercase tracking-wide text-[10px]">
          <Mail className="w-3.5 h-3.5 flex-shrink-0 text-[#00f2fe]" />
          <span>Live sandbox support email active: <strong>{INBOX_EMAIL}</strong></span>
        </div>
        <button
          onClick={() => setShowTestModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#00f2fe] hover:bg-[#00f2fe]/90 text-[#031512] font-bold uppercase tracking-wider text-[9px] transition-colors whitespace-nowrap"
        >
          <Mail className="w-3 h-3" />
          Send test email
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden min-h-0 relative z-0">

        {/* Left panel — resizable list */}
        <div style={{ width: panelWidth, flexShrink: 0 }} className="overflow-hidden flex flex-col min-h-0 min-w-0 bg-[#020e0c]/30 border-r border-[#2dd4bf]/15">
          <ConversationList
            conversations={filtered}
            onSelect={setActive}
            tab={tab}
            setTab={handleTabChange}
            search={search}
            setSearch={setSearch}
            activeCount={conversations.length}
            historyCount={history.length}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
          />
        </div>

        {/* Drag handle */}
        <div
          onMouseDown={onDragStart}
          className="w-1 flex-shrink-0 cursor-col-resize bg-[#2dd4bf]/10 hover:bg-[#00f2fe] active:bg-[#00f2fe] transition-colors"
        />

        {/* Center — conversation thread */}
        <div className="flex-1 min-w-0 overflow-hidden bg-transparent">
          <ConversationThread
            conversation={active}
            onClose={(id) => {
              setConversations(conversations.filter((c) => c.id !== id))
              setActive('')
            }}
          />
        </div>

        {/* Right panel — customer 360 */}
        <div style={{ width: 360, flexShrink: 0 }} className="overflow-hidden min-h-0 border-l border-[#2dd4bf]/15 bg-[#020e0c]/15">
          <Customer360Panel conversation={active} />
        </div>

      </div>
    </div>
  )
}
