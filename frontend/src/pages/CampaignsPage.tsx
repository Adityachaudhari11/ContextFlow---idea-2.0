import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Send, CheckCircle, AlertCircle, Megaphone, Trash2, Loader2,
  Mail, Phone, MessageSquare, Monitor, Search, ShieldOff, Users, UserPlus,
  CalendarClock, X, ChevronRight, ChevronLeft, ArrowUpRight,
} from 'lucide-react'
import { campaignsApi } from '../services/api'
import type { Campaign } from '../types'
import { RegisterModalWrapper } from '../components/RegisterModal'

// ── Design tokens ────────────────────────────────────────────
const T = {
  page:    '#FDFBF7',
  surface: '#FFFFFF',
  sidebar: '#F9F8F4',
  ink:     '#1C1C1A',
  ink500:  '#5C5C58',
  ink400:  '#8A8A85',
  ink300:  '#B5B3AC',
  forest:  '#1E4237',
  clay:    '#D37B5C',
  border:  'rgba(28,28,26,0.08)',
  borderS: 'rgba(28,28,26,0.14)',
  serif:   '"Cormorant Garamond",Georgia,serif',
  sans:    '"Manrope",system-ui,sans-serif',
  mono:    '"JetBrains Mono",monospace',
}

const EASE = [0.22, 1, 0.36, 1] as const

// ── Status tokens ─────────────────────────────────────────────
const STATUS: Record<string, { label: string; bg: string; text: string }> = {
  draft:            { label: 'Draft',    bg: '#F0EFEA', text: '#5C5C58' },
  pending_approval: { label: 'Pending',  bg: '#FDF1D5', text: '#876610' },
  approved:         { label: 'Approved', bg: '#E1EDE6', text: '#1E4237' },
  scheduled:        { label: 'Scheduled',bg: '#E6F0F9', text: '#1A4971' },
  running:          { label: 'Live',     bg: '#E1EDE6', text: '#1E4237' },
  completed:        { label: 'Done',     bg: '#F0EFEA', text: '#5C5C58' },
  cancelled:        { label: 'Cancelled',bg: '#FBE5E0', text: '#8C2E1F' },
}

// ── Channel tokens ────────────────────────────────────────────
const CHANNEL_ICONS: Record<string, React.ElementType> = {
  whatsapp: Phone, instagram: MessageSquare, email: Mail, telegram: Send, simulator: Monitor,
}
const CHANNEL_TONES: Record<string, { bg: string; text: string; border: string }> = {
  whatsapp:  { bg: '#E1EDE6', text: '#1E4237', border: '#C9DDD3' },
  instagram: { bg: '#FAEEE5', text: '#8C4C32', border: '#E9B69D' },
  email:     { bg: '#E6F0F9', text: '#1A4971', border: '#B8D0E6' },
  telegram:  { bg: '#F5F3ED', text: '#5C5C58', border: '#D4D1C8' },
  simulator: { bg: '#F0EFEA', text: '#5C5C58', border: '#D4D1C8' },
}

type Filter = 'all' | 'draft' | 'pending_approval' | 'approved' | 'scheduled' | 'running' | 'completed'

const FILTERS: { key: Filter; label: string; testId: string }[] = [
  { key: 'all',              label: 'All',       testId: 'filter-tab-all' },
  { key: 'draft',            label: 'Draft',     testId: 'filter-tab-draft' },
  { key: 'pending_approval', label: 'Pending',   testId: 'filter-tab-pending' },
  { key: 'approved',         label: 'Approved',  testId: 'filter-tab-approved' },
  { key: 'scheduled',        label: 'Scheduled', testId: 'filter-tab-scheduled' },
  { key: 'running',          label: 'Live',      testId: 'filter-tab-live' },
  { key: 'completed',        label: 'Done',      testId: 'filter-tab-done' },
]

const BLANK = { name: '', content_template: '', target_channels: ['whatsapp'] as string[] }

// ── Main Page ─────────────────────────────────────────────────
export default function CampaignsPage() {
  const [campaigns, setCampaigns]       = useState<Campaign[]>([])
  const [selected, setSelected]         = useState<Campaign | null>(null)
  const [filter, setFilter]             = useState<Filter>('all')
  const [creating, setCreating]         = useState(false)
  const [form, setForm]                 = useState(BLANK)
  const [busy, setBusy]                 = useState(false)
  const [actionMsg, setActionMsg]       = useState<string | null>(null)
  const [showRegister, setShowRegister] = useState(false)
  const [drawerOpen, setDrawerOpen]     = useState(false)

  useEffect(() => {
    campaignsApi.list().then((data) => {
      setCampaigns(data)
    })
  }, [])

  useEffect(() => {
    if (selected) {
      const fresh = campaigns.find((c) => c.id === selected.id)
      if (fresh) setSelected(fresh)
    }
  }, [campaigns])

  const flash = (msg: string) => {
    setActionMsg(msg)
    setTimeout(() => setActionMsg(null), 3000)
  }

  const updateOne = (updated: Partial<Campaign> & { id: string }) => {
    setCampaigns((prev) => prev.map((c) => c.id === updated.id ? { ...c, ...updated } : c))
    if (selected?.id === updated.id) setSelected((s) => s ? { ...s, ...updated } : s)
  }

  const openDetail = (c: Campaign) => {
    setSelected(c)
    setCreating(false)
    setDrawerOpen(true)
  }

  const openCreate = () => {
    setCreating(true)
    setSelected(null)
    setDrawerOpen(true)
  }

  const closeDrawer = () => {
    setDrawerOpen(false)
    setTimeout(() => { setCreating(false); setSelected(null) }, 400)
  }

  const handleCreate = async () => {
    if (!form.name.trim() || !form.content_template.trim()) return
    setBusy(true)
    try {
      const c = await campaignsApi.create({
        name: form.name, content_template: form.content_template,
        target_channels: form.target_channels,
      })
      setCampaigns((prev) => [c, ...prev])
      setSelected(c)
      setCreating(false)
      setForm(BLANK)
      flash('Campaign created')
    } finally { setBusy(false) }
  }

  const handleSubmit = async (id: string) => {
    setBusy(true)
    try { await campaignsApi.submitReview(id); updateOne({ id, status: 'pending_approval' }); flash('Submitted for review') }
    finally { setBusy(false) }
  }

  const handleApprove = async (id: string, lockedEmails: string[]) => {
    setBusy(true)
    try {
      await campaignsApi.approve(id, lockedEmails)
      updateOne({ id, status: 'approved' })
      flash(`Approved — ${lockedEmails.length} recipient${lockedEmails.length !== 1 ? 's' : ''} locked`)
    } finally { setBusy(false) }
  }

  const handleSchedule = async (id: string, scheduledAt: string) => {
    setBusy(true)
    try {
      await campaignsApi.schedule(id, scheduledAt)
      updateOne({ id, status: 'scheduled', scheduled_at: scheduledAt })
      const d = new Date(scheduledAt)
      const ist = d.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
      flash(`Scheduled for ${ist} IST`)
    } finally { setBusy(false) }
  }

  const handleDispatch = async (id: string) => {
    setBusy(true)
    try {
      await campaignsApi.dispatch(id)
      updateOne({ id, status: 'running' })
      flash('Campaign dispatched — sending...')
      const poll = setInterval(async () => {
        const data = await campaignsApi.list()
        setCampaigns(data)
        const c = data.find((x) => x.id === id)
        if (c && c.status !== 'running') { clearInterval(poll); setSelected(c) }
      }, 2000)
    } finally { setBusy(false) }
  }

  const handleCancel = async (id: string) => {
    setBusy(true)
    try {
      await campaignsApi.cancel(id)
      setCampaigns((prev) => prev.filter((c) => c.id !== id))
      if (selected?.id === id) closeDrawer()
    } finally { setBusy(false) }
  }

  const filtered = campaigns.filter((c) => filter === 'all' || c.status === filter)

  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ background: T.page }} data-testid="campaigns-page">
      <RegisterModalWrapper show={showRegister} onClose={() => setShowRegister(false)} />

      {/* ── Top Header ──────────────────────────────────── */}
      <div
        className="flex-shrink-0 flex items-center justify-between px-6 py-4"
        style={{ background: T.surface, borderBottom: `1px solid ${T.border}`, zIndex: 10 }}
      >
        <div className="flex items-center gap-3">
          <Megaphone className="w-5 h-5" style={{ color: T.ink400 }} />
          <div>
            <h1 style={{ fontFamily: T.serif, fontSize: 20, fontWeight: 500, color: T.ink, lineHeight: 1 }}>Campaigns</h1>
            <p style={{ fontFamily: T.mono, fontSize: 10, color: T.ink400, marginTop: 3, letterSpacing: '0.12em' }}>
              {campaigns.length} total · {campaigns.filter(c => c.status === 'running').length} live
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowRegister(true)}
            data-testid="btn-whitelist-email"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded"
            style={{ border: `1px solid ${T.border}`, color: T.ink500, fontFamily: T.sans, fontSize: 12, fontWeight: 500, background: 'transparent' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#F5F3ED' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
          >
            <UserPlus className="w-3.5 h-3.5" /> Whitelist Email
          </button>
          <button
            onClick={openCreate}
            data-testid="btn-new-campaign"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded"
            style={{ background: T.forest, color: '#FDFBF7', fontFamily: T.sans, fontSize: 12, fontWeight: 600 }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#153028' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = T.forest }}
          >
            <Plus className="w-3.5 h-3.5" /> New Campaign
          </button>
        </div>
      </div>

      {/* ── Flash message ────────────────────────────────── */}
      <AnimatePresence>
        {actionMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex-shrink-0 flex items-center gap-2 px-6 py-2.5"
            style={{ background: '#E1EDE6', borderBottom: `1px solid #C9DDD3`, fontFamily: T.sans, fontSize: 12, color: T.forest, zIndex: 10 }}
          >
            <CheckCircle className="w-4 h-4 flex-shrink-0" /> {actionMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Archival Index filter tabs ───────────────────── */}
      <div
        className="flex-shrink-0 flex items-center gap-0 px-6 overflow-x-auto no-scrollbar"
        style={{ borderBottom: `1px solid ${T.border}`, background: T.surface }}
      >
        {FILTERS.map(({ key, label, testId }) => {
          const count = key === 'all' ? campaigns.length : campaigns.filter(c => c.status === key).length
          const isActive = filter === key
          return (
            <button
              key={key}
              onClick={() => setFilter(key)}
              data-testid={testId}
              className="relative flex items-center gap-1.5 px-4 py-3 whitespace-nowrap"
              style={{
                fontFamily: T.sans,
                fontSize: 12,
                fontWeight: isActive ? 700 : 500,
                color: isActive ? T.ink : T.ink400,
                background: 'transparent',
                border: 'none',
                borderBottom: isActive ? `2px solid ${T.ink}` : '2px solid transparent',
                marginBottom: -1,
                cursor: 'pointer',
              }}
            >
              {label}
              <span style={{ fontFamily: T.mono, fontSize: 9.5, color: isActive ? T.ink400 : T.ink300 }}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* ── Campaign Grid ─────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-6 relative">
        {filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center h-full gap-4"
            style={{ color: T.ink400 }}
          >
            <Megaphone className="w-12 h-12 opacity-25" />
            <p style={{ fontFamily: T.sans, fontSize: 13, fontWeight: 500 }}>
              {filter === 'all' ? 'No campaigns yet — create your first one.' : `No ${filter} campaigns.`}
            </p>
            {filter === 'all' && (
              <button
                onClick={openCreate}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded"
                style={{ background: T.forest, color: '#FDFBF7', fontFamily: T.sans, fontSize: 13, fontWeight: 600 }}
              >
                <Plus className="w-4 h-4" /> Create Campaign
              </button>
            )}
          </motion.div>
        ) : (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.05 } } }}
          >
            <AnimatePresence>
              {filtered.map((c) => (
                <CampaignCard
                  key={c.id}
                  campaign={c}
                  active={selected?.id === c.id && drawerOpen}
                  onClick={() => openDetail(c)}
                  onDelete={() => handleCancel(c.id)}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* ── Right Slide-out Drawer ────────────────────────── */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            {/* Scrim */}
            <motion.div
              key="scrim"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 z-20"
              style={{ background: 'rgba(28,28,26,0.18)' }}
              onClick={closeDrawer}
            />

            {/* Drawer panel */}
            <motion.div
              key="drawer"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.45, ease: EASE }}
              className="absolute right-0 top-0 h-full z-30 flex flex-col overflow-hidden"
              style={{
                width: 'min(520px, 90vw)',
                background: T.surface,
                borderLeft: `1px solid ${T.border}`,
                boxShadow: '-12px 0 40px rgba(28,28,26,0.06)',
              }}
            >
              {/* Drawer header */}
              <div
                className="flex items-center justify-between px-7 py-4 flex-shrink-0"
                style={{ borderBottom: `1px solid ${T.border}` }}
              >
                <p style={{ fontFamily: T.sans, fontWeight: 700, fontSize: 10.5, letterSpacing: '0.18em', textTransform: 'uppercase', color: T.ink400 }}>
                  {creating ? 'New Campaign' : 'Campaign Detail'}
                </p>
                <button
                  onClick={closeDrawer}
                  style={{ color: T.ink400 }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = T.ink }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = T.ink400 }}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer content */}
              <div className="flex-1 overflow-y-auto">
                <AnimatePresence mode="wait">
                  {creating ? (
                    <motion.div
                      key="create-form"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3, ease: EASE }}
                    >
                      <NewCampaignForm
                        form={form}
                        setForm={setForm}
                        busy={busy}
                        onCreate={handleCreate}
                        onCancel={closeDrawer}
                      />
                    </motion.div>
                  ) : selected ? (
                    <motion.div
                      key={selected.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3, ease: EASE }}
                    >
                      <CampaignDetail
                        campaign={selected}
                        busy={busy}
                        onSubmit={handleSubmit}
                        onApprove={handleApprove}
                        onDispatch={handleDispatch}
                        onSchedule={handleSchedule}
                        onCancel={handleCancel}
                      />
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Campaign Grid Card ──────────────────────────────────────
function CampaignCard({ campaign: c, active, onClick, onDelete }: {
  campaign: Campaign; active: boolean; onClick: () => void; onDelete: () => void
}) {
  const st = STATUS[c.status] ?? STATUS.draft
  const canDelete = c.status !== 'running'
  const dateStr = new Date(c.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

  return (
    <motion.div
      layout
      variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.4, ease: EASE }}
      data-testid="campaign-card"
      className="group relative flex flex-col cursor-pointer card-lift"
      style={{
        background: '#FFFFFF',
        border: active ? `1px solid rgba(30,66,55,0.4)` : '1px solid rgba(28,28,26,0.07)',
        borderRadius: 4,
        boxShadow: active ? '0 4px 20px rgba(30,66,55,0.08)' : '0 1px 3px rgba(28,28,26,0.04)',
        padding: 24,
      }}
      onClick={onClick}
    >
      {/* Top row: channel pill + status badge */}
      <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
        <div className="flex flex-wrap gap-1.5">
          {c.target_channels.slice(0, 2).map((ch) => {
            const Icon = CHANNEL_ICONS[ch] ?? Monitor
            const tone = CHANNEL_TONES[ch] ?? CHANNEL_TONES.simulator
            return (
              <span
                key={ch}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full"
                style={{ background: tone.bg, color: tone.text, border: `1px solid ${tone.border}`, fontFamily: '"Manrope",sans-serif', fontSize: 10.5, fontWeight: 600, textTransform: 'capitalize', letterSpacing: '0.02em' }}
              >
                <Icon className="w-3 h-3" /> {ch}
              </span>
            )
          })}
          {c.target_channels.length > 2 && (
            <span style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: '#8A8A85', padding: '4px 0' }}>+{c.target_channels.length - 2}</span>
          )}
        </div>
        <span
          className="inline-flex items-center px-2.5 py-1 rounded-full flex-shrink-0"
          style={{ background: st.bg, color: st.text, fontFamily: '"Manrope",sans-serif', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}
        >
          {c.status === 'running' && <Loader2 className="w-2.5 h-2.5 animate-spin mr-1" />}
          {st.label}
        </span>
      </div>

      {/* Middle: Title + date */}
      <h3
        className="mb-1"
        style={{ fontFamily: '"Cormorant Garamond",Georgia,serif', fontSize: 20, fontWeight: 500, color: '#1C1C1A', lineHeight: 1.25 }}
      >
        {c.name}
      </h3>
      <p style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: '#8A8A85', letterSpacing: '0.10em', marginBottom: 16 }}>
        {dateStr}
      </p>

      {/* Bottom: recipients + delivery stats */}
      <div className="flex items-center justify-between mt-auto pt-4" style={{ borderTop: '1px solid rgba(28,28,26,0.07)' }}>
        <div className="flex items-center gap-1.5" style={{ fontFamily: '"Manrope",sans-serif', fontSize: 11, color: '#8A8A85' }}>
          <Users className="w-3.5 h-3.5" />
          <span>{c.recipient_count ?? 0} recipients</span>
        </div>
        {c.sent_count > 0 && (
          <span style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: '#1E4237', letterSpacing: '0.08em' }}>
            {Math.round((c.delivered_count / c.sent_count) * 100)}% delivered
          </span>
        )}
        <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: '#8A8A85' }} />
      </div>

      {/* Delete button */}
      {canDelete && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete() }}
          data-testid="campaign-delete"
          className="absolute top-3 right-3 p-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ color: '#8A8A85', background: 'transparent' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#8C2E1F'; (e.currentTarget as HTMLElement).style.background = '#FBE5E0' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#8A8A85'; (e.currentTarget as HTMLElement).style.background = 'transparent' }}
          title="Delete campaign"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
    </motion.div>
  )
}

// ── Recipient Picker ──────────────────────────────────────────
type Recipient = { email: string; name: string; channels: string[]; is_dnc: boolean }

function RecipientPicker({ campaignId, busy, onApprove }: {
  campaignId: string; busy: boolean; onApprove: (lockedEmails: string[]) => void
}) {
  const [recipients, setRecipients] = useState<Recipient[]>([])
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const [selected, setSelected]     = useState<Set<string>>(new Set())

  useEffect(() => {
    setLoading(true)
    campaignsApi.recipients(campaignId)
      .then((data) => { setRecipients(data); setSelected(new Set(data.filter((r) => !r.is_dnc).map((r) => r.email))) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [campaignId])

  const filtered = recipients.filter((r) => {
    const q = search.toLowerCase()
    return !q || r.email.includes(q) || r.name.toLowerCase().includes(q)
  })
  const eligible = filtered.filter((r) => !r.is_dnc)
  const allSelected = eligible.length > 0 && eligible.every((r) => selected.has(r.email))
  const toggle = (email: string) => setSelected((s) => { const n = new Set(s); n.has(email) ? n.delete(email) : n.add(email); return n })
  const toggleAll = () => {
    if (allSelected) setSelected((s) => { const n = new Set(s); eligible.forEach((r) => n.delete(r.email)); return n })
    else setSelected((s) => { const n = new Set(s); eligible.forEach((r) => n.add(r.email)); return n })
  }
  const selectedCount = recipients.filter((r) => selected.has(r.email)).length
  const dncCount = recipients.filter((r) => r.is_dnc).length

  if (loading) return (
    <div className="flex items-center gap-2 py-4" style={{ color: '#8A8A85', fontFamily: '"Manrope",sans-serif', fontSize: 12 }}>
      <Loader2 className="w-4 h-4 animate-spin" /> Loading contacts…
    </div>
  )

  if (recipients.length === 0) return (
    <div
      className="flex flex-col items-center gap-3 p-6 rounded text-center"
      style={{ border: '1px dashed rgba(28,28,26,0.15)', fontFamily: '"Manrope",sans-serif', fontSize: 12, color: '#8A8A85' }}
    >
      <Users className="w-8 h-8 opacity-30" />
      No contacts in the whitelist yet.
      <br />Register via the landing page to add recipients.
    </div>
  )

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: '#8A8A85' }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by email or name…"
            style={{ width: '100%', paddingLeft: 34, paddingRight: 10, paddingTop: 8, paddingBottom: 8, fontSize: 13, fontFamily: '"Manrope",sans-serif', border: '1px solid rgba(28,28,26,0.1)', borderRadius: 4, background: '#F9F8F4', color: '#1C1C1A', outline: 'none' }}
            onFocus={e => { e.currentTarget.style.borderColor = '#1E4237' }}
            onBlur={e => { e.currentTarget.style.borderColor = 'rgba(28,28,26,0.1)' }}
          />
        </div>
        <button
          onClick={toggleAll}
          style={{ fontFamily: '"Manrope",sans-serif', fontSize: 11, fontWeight: 600, color: '#5C5C58', border: '1px solid rgba(28,28,26,0.1)', borderRadius: 4, padding: '8px 12px', whiteSpace: 'nowrap', background: 'transparent' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#F5F3ED' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
        >
          {allSelected ? 'Deselect all' : 'Select all'}
        </button>
      </div>

      <div className="flex items-center gap-3 mb-3" style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10.5, color: '#8A8A85' }}>
        <span style={{ color: '#1E4237', fontWeight: 600 }}>{selectedCount} selected</span>
        <span>·</span>
        <span>{recipients.length} total</span>
        {dncCount > 0 && <><span>·</span><span style={{ color: '#8C2E1F', fontWeight: 600 }}>{dncCount} DNC (excluded)</span></>}
      </div>

      <div style={{ border: '1px solid rgba(28,28,26,0.09)', borderRadius: 4, overflow: 'hidden', maxHeight: 240, overflowY: 'auto' }}>
        {filtered.map((r, i) => (
          <label
            key={r.email}
            className="flex items-center gap-3 px-3.5 py-3 cursor-pointer"
            style={{
              borderBottom: i < filtered.length - 1 ? '1px solid rgba(28,28,26,0.06)' : 'none',
              background: r.is_dnc ? '#FBE5E0' : 'transparent',
              cursor: r.is_dnc ? 'not-allowed' : 'pointer',
            }}
          >
            <input
              type="checkbox"
              disabled={r.is_dnc}
              checked={selected.has(r.email)}
              onChange={() => !r.is_dnc && toggle(r.email)}
              style={{ accentColor: '#1E4237' }}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 11.5, color: r.is_dnc ? '#B5B3AC' : '#1C1C1A' }}>{r.email}</span>
                {r.name && <span style={{ fontFamily: '"Manrope",sans-serif', fontSize: 11, color: '#8A8A85' }}>({r.name})</span>}
                {r.is_dnc && (
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded" style={{ background: '#FBE5E0', color: '#8C2E1F', border: '1px solid rgba(140,46,31,0.15)', fontFamily: '"Manrope",sans-serif', fontSize: 9.5, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    <ShieldOff className="w-2.5 h-2.5" /> DNC
                  </span>
                )}
              </div>
              <div className="flex gap-1.5 mt-1.5">
                {r.channels.map((ch) => {
                  const tone = CHANNEL_TONES[ch] ?? CHANNEL_TONES.simulator
                  return (
                    <span key={ch} className="px-2 py-0.5 rounded-full" style={{ background: tone.bg, color: tone.text, fontFamily: '"Manrope",sans-serif', fontSize: 9.5, fontWeight: 600, textTransform: 'capitalize' }}>
                      {ch}
                    </span>
                  )
                })}
              </div>
            </div>
          </label>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-8" style={{ fontFamily: '"Manrope",sans-serif', fontSize: 12, color: '#8A8A85' }}>No matching contacts</div>
        )}
      </div>

      <button
        onClick={() => onApprove([...selected])}
        disabled={busy || selectedCount === 0}
        className="mt-4 w-full flex items-center justify-center gap-2 py-3 rounded"
        style={{
          background: selectedCount === 0 || busy ? '#B5B3AC' : '#1E4237',
          color: '#FDFBF7',
          fontFamily: '"Manrope",sans-serif',
          fontSize: 13,
          fontWeight: 600,
          cursor: selectedCount === 0 || busy ? 'not-allowed' : 'pointer',
        }}
        data-testid="btn-approve-recipients"
      >
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
        Approve & Lock {selectedCount} Recipient{selectedCount !== 1 ? 's' : ''}
      </button>
    </div>
  )
}

// ── Campaign Detail (Drawer content) ─────────────────────────
function CampaignDetail({ campaign: c, busy, onSubmit, onApprove, onDispatch, onSchedule, onCancel: _onCancel }: {
  campaign: Campaign; busy: boolean
  onSubmit: (id: string) => void
  onApprove: (id: string, lockedEmails: string[]) => void
  onDispatch: (id: string) => void
  onSchedule: (id: string, scheduledAt: string) => void
  onCancel: (id: string) => void
}) {
  const [showScheduler, setShowScheduler] = useState(false)
  const [scheduleInput, setScheduleInput] = useState('')
  const st = STATUS[c.status] ?? STATUS.draft

  const defaultScheduleValue = () => {
    const d = new Date(Date.now() + 60 * 60 * 1000)
    return d.toISOString().slice(0, 16)
  }

  const handleOpenScheduler = () => {
    setScheduleInput(defaultScheduleValue())
    setShowScheduler(true)
  }

  const handleConfirmSchedule = () => {
    if (!scheduleInput) return
    onSchedule(c.id, new Date(scheduleInput).toISOString())
    setShowScheduler(false)
  }

  const scheduledAtIST = c.scheduled_at
    ? new Date(c.scheduled_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : null

  const deliveryRate = c.sent_count > 0 ? Math.round((c.delivered_count / c.sent_count) * 100) : 0

  return (
    <div className="p-7 space-y-7">
      {/* Title block */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span
            className="inline-flex items-center px-2.5 py-1 rounded-full"
            style={{ background: st.bg, color: st.text, fontFamily: '"Manrope",sans-serif', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}
          >
            {c.status === 'running' && <Loader2 className="w-2.5 h-2.5 animate-spin mr-1" />}
            {st.label}
          </span>
        </div>
        <h2 style={{ fontFamily: '"Cormorant Garamond",Georgia,serif', fontSize: 28, fontWeight: 500, color: '#1C1C1A', lineHeight: 1.2, marginBottom: 6 }}>
          {c.name}
        </h2>
        <p style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: '#8A8A85', letterSpacing: '0.12em' }}>
          Created {new Date(c.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
        </p>
      </div>

      <div style={{ borderTop: '1px solid rgba(28,28,26,0.08)' }} />

      {/* Target Channels */}
      <DetailSection label="Target Channels">
        <div className="flex flex-wrap gap-2">
          {c.target_channels.map((ch) => {
            const Icon = CHANNEL_ICONS[ch] ?? Monitor
            const tone = CHANNEL_TONES[ch] ?? CHANNEL_TONES.simulator
            return (
              <span key={ch} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: tone.bg, color: tone.text, border: `1px solid ${tone.border}`, fontFamily: '"Manrope",sans-serif', fontSize: 11, fontWeight: 600, textTransform: 'capitalize' }}>
                <Icon className="w-3.5 h-3.5" /> {ch}
              </span>
            )
          })}
        </div>
      </DetailSection>

      {/* Message Template */}
      <DetailSection label="Message Template">
        <div style={{ background: '#F9F8F4', border: '1px solid rgba(28,28,26,0.09)', borderRadius: 4, padding: '16px 18px' }}>
          <pre style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 12.5, color: '#3A3A37', whiteSpace: 'pre-wrap', lineHeight: 1.7, margin: 0 }}>
            {c.content_template}
          </pre>
        </div>
        <p style={{ fontFamily: '"Manrope",sans-serif', fontSize: 11, color: '#8A8A85', marginTop: 8 }}>
          Variable: <code style={{ fontFamily: '"JetBrains Mono",monospace', background: '#F5F3ED', padding: '1px 6px', borderRadius: 3, color: '#8C4C32' }}>{'{{name}}'}</code> — customer's name
        </p>
      </DetailSection>

      {/* Delivery Metrics */}
      {(c.status === 'completed' || c.status === 'running' || c.sent_count > 0) && (
        <DetailSection label="Delivery Metrics">
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Sent',          value: c.sent_count,       color: '#1E4237', bg: '#E1EDE6' },
              { label: 'Delivered',     value: c.delivered_count,  color: '#1A4971', bg: '#E6F0F9' },
              { label: 'Delivery Rate', value: `${deliveryRate}%`, color: '#8C4C32', bg: '#FAEEE5' },
            ].map((m) => (
              <div key={m.label} style={{ background: m.bg, borderRadius: 4, padding: '12px 14px' }}>
                <p style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 18, fontWeight: 500, color: m.color, lineHeight: 1 }}>{m.value}</p>
                <p style={{ fontFamily: '"Manrope",sans-serif', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#8A8A85', marginTop: 6 }}>{m.label}</p>
              </div>
            ))}
          </div>
        </DetailSection>
      )}

      {/* Recipient Picker */}
      {c.status === 'pending_approval' && (
        <DetailSection label="Target Recipients">
          <RecipientPicker campaignId={c.id} busy={busy} onApprove={(emails) => onApprove(c.id, emails)} />
        </DetailSection>
      )}

      {/* Actions */}
      <div className="space-y-3" style={{ borderTop: '1px solid rgba(28,28,26,0.08)', paddingTop: 24 }}>
        {c.status === 'draft' && (
          <DrawerButton
            label="Submit for Review"
            icon={<ChevronRight className="w-4 h-4" />}
            bg="#FDF1D5" color="#876610" hoverBg="#F5E4A8"
            disabled={busy}
            onClick={() => onSubmit(c.id)}
            testId="btn-submit-review"
          />
        )}

        {c.status === 'approved' && (
          <>
            <DrawerButton
              label="Dispatch Campaign"
              icon={busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              bg="#1E4237" color="#FDFBF7" hoverBg="#153028"
              disabled={busy}
              onClick={() => onDispatch(c.id)}
              testId="btn-dispatch"
            />
            <DrawerButton
              label="Schedule for Later"
              icon={<CalendarClock className="w-4 h-4" />}
              bg="#F5F3ED" color="#5C5C58" hoverBg="#E8E6E1"
              disabled={busy}
              onClick={handleOpenScheduler}
              testId="btn-schedule"
            />
          </>
        )}

        {showScheduler && c.status === 'approved' && (
          <div style={{ background: '#F9F8F4', border: '1px solid rgba(28,28,26,0.10)', borderRadius: 4, padding: 16 }}>
            <div className="flex items-center justify-between mb-3">
              <p style={{ fontFamily: '"Manrope",sans-serif', fontSize: 12, fontWeight: 700, color: '#5C5C58', display: 'flex', alignItems: 'center', gap: 6 }}>
                <CalendarClock className="w-3.5 h-3.5" /> Set date & time
              </p>
              <button onClick={() => setShowScheduler(false)} style={{ color: '#8A8A85' }}><X className="w-4 h-4" /></button>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="datetime-local"
                value={scheduleInput}
                onChange={(e) => setScheduleInput(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
                style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 12, border: '1px solid rgba(28,28,26,0.12)', borderRadius: 4, padding: '8px 10px', background: '#FFFFFF', color: '#1C1C1A', outline: 'none' }}
                onFocus={e => { e.currentTarget.style.borderColor = '#1E4237' }}
                onBlur={e => { e.currentTarget.style.borderColor = 'rgba(28,28,26,0.12)' }}
              />
              <button
                onClick={handleConfirmSchedule}
                disabled={!scheduleInput || busy}
                style={{ padding: '8px 16px', background: '#1E4237', color: '#FDFBF7', fontFamily: '"Manrope",sans-serif', fontSize: 12, fontWeight: 600, borderRadius: 4, cursor: !scheduleInput || busy ? 'not-allowed' : 'pointer', opacity: !scheduleInput || busy ? 0.6 : 1 }}
              >
                Confirm
              </button>
            </div>
          </div>
        )}

        {c.status === 'scheduled' && (
          <>
            <div className="flex items-center gap-2 p-3 rounded" style={{ background: '#E6F0F9', fontFamily: '"Manrope",sans-serif', fontSize: 12, color: '#1A4971' }}>
              <CalendarClock className="w-4 h-4 flex-shrink-0" />
              Scheduled: <strong>{scheduledAtIST} IST</strong>
            </div>
            <DrawerButton
              label="Send Now"
              icon={busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              bg="#1E4237" color="#FDFBF7" hoverBg="#153028"
              disabled={busy}
              onClick={() => onDispatch(c.id)}
              testId="btn-send-now"
            />
          </>
        )}

        {c.status === 'running' && (
          <div className="flex items-center gap-2 p-3 rounded" style={{ background: '#E1EDE6', fontFamily: '"Manrope",sans-serif', fontSize: 12, color: '#1E4237' }}>
            <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
            Live dispatch — sending outbound queue to customers…
          </div>
        )}

        {c.status === 'completed' && (
          <div className="flex items-center gap-2 p-3 rounded" style={{ background: '#E1EDE6', fontFamily: '"Manrope",sans-serif', fontSize: 12, color: '#1E4237' }}>
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            Campaign executed and closed successfully.
          </div>
        )}
      </div>

      {/* Lifecycle workflow */}
      <div style={{ borderTop: '1px solid rgba(28,28,26,0.08)', paddingTop: 20 }}>
        <p style={{ fontFamily: '"Manrope",sans-serif', fontWeight: 700, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.18em', color: '#B5B3AC', marginBottom: 10 }}>Lifecycle</p>
        <div className="flex items-center flex-wrap gap-1">
          {['Draft', 'Pending', 'Approved', 'Scheduled', 'Live', 'Done'].map((step, i, arr) => {
            const isMatch =
              (c.status === 'draft' && step === 'Draft') ||
              (c.status === 'pending_approval' && step === 'Pending') ||
              (c.status === 'approved' && step === 'Approved') ||
              (c.status === 'scheduled' && step === 'Scheduled') ||
              (c.status === 'running' && step === 'Live') ||
              (c.status === 'completed' && step === 'Done')

            return (
              <span key={step} className="flex items-center gap-1">
                <span
                  style={{
                    fontFamily: '"Manrope",sans-serif',
                    fontSize: 10.5,
                    fontWeight: isMatch ? 700 : 400,
                    color: isMatch ? '#1E4237' : '#B5B3AC',
                    background: isMatch ? '#E1EDE6' : 'transparent',
                    padding: isMatch ? '3px 8px' : '3px 4px',
                    borderRadius: 3,
                  }}
                >
                  {step}
                </span>
                {i < arr.length - 1 && <ChevronRight className="w-3 h-3" style={{ color: '#D4D1C8' }} />}
              </span>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── New Campaign Form (Drawer content) ──────────────────────
function NewCampaignForm({ form, setForm, busy, onCreate, onCancel }: {
  form: typeof BLANK
  setForm: React.Dispatch<React.SetStateAction<typeof BLANK>>
  busy: boolean; onCreate: () => void; onCancel: () => void
}) {
  const ALL_CHANNELS = ['whatsapp', 'email', 'telegram', 'instagram']
  const toggleCh = (ch: string) => setForm((f) => ({
    ...f,
    target_channels: f.target_channels.includes(ch)
      ? f.target_channels.filter((c) => c !== ch)
      : [...f.target_channels, ch],
  }))

  return (
    <div className="p-7 space-y-6">
      {/* Campaign name */}
      <div>
        <label style={{ fontFamily: '"Manrope",sans-serif', fontWeight: 700, fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.18em', color: '#8A8A85', display: 'block', marginBottom: 7 }}>
          Campaign name *
        </label>
        <input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="e.g. Monsoon Savings Drive"
          data-testid="input-campaign-name"
          style={{ width: '100%', fontFamily: '"Manrope",sans-serif', fontSize: 14, border: '1px solid rgba(28,28,26,0.10)', borderRadius: 4, padding: '10px 14px', background: '#F9F8F4', color: '#1C1C1A', outline: 'none' }}
          onFocus={e => { e.currentTarget.style.borderColor = '#1E4237' }}
          onBlur={e => { e.currentTarget.style.borderColor = 'rgba(28,28,26,0.10)' }}
        />
      </div>

      {/* Target channels */}
      <div>
        <label style={{ fontFamily: '"Manrope",sans-serif', fontWeight: 700, fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.18em', color: '#8A8A85', display: 'block', marginBottom: 7 }}>
          Target Channels
        </label>
        <div className="flex flex-wrap gap-2">
          {ALL_CHANNELS.map((ch) => {
            const active = form.target_channels.includes(ch)
            const Icon = CHANNEL_ICONS[ch] ?? Monitor
            const tone = CHANNEL_TONES[ch] ?? CHANNEL_TONES.simulator
            return (
              <button
                key={ch}
                type="button"
                onClick={() => toggleCh(ch)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '6px 14px', borderRadius: 999, fontFamily: '"Manrope",sans-serif', fontSize: 11, fontWeight: 600, textTransform: 'capitalize',
                  background: active ? tone.bg : 'transparent',
                  color: active ? tone.text : '#8A8A85',
                  border: active ? `1px solid ${tone.border}` : '1px solid rgba(28,28,26,0.12)',
                  cursor: 'pointer',
                }}
              >
                <Icon className="w-3.5 h-3.5" /> {ch}
              </button>
            )
          })}
        </div>
        {form.target_channels.length === 0 && (
          <p style={{ fontFamily: '"Manrope",sans-serif', fontSize: 11, color: '#8C2E1F', marginTop: 6 }}>Select at least one channel</p>
        )}
      </div>

      {/* Message template */}
      <div>
        <label style={{ fontFamily: '"Manrope",sans-serif', fontWeight: 700, fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.18em', color: '#8A8A85', display: 'block', marginBottom: 7 }}>
          Message Template *
        </label>
        <textarea
          value={form.content_template}
          onChange={(e) => setForm({ ...form, content_template: e.target.value })}
          placeholder={`Hello {{name}},\n\nWe have an exclusive offer just for you…\n\n— NeoBank Team`}
          rows={6}
          data-testid="input-campaign-template"
          style={{ width: '100%', fontFamily: '"JetBrains Mono",monospace', fontSize: 12.5, border: '1px solid rgba(28,28,26,0.10)', borderRadius: 4, padding: '10px 14px', background: '#F9F8F4', color: '#1C1C1A', outline: 'none', resize: 'vertical', lineHeight: 1.65 }}
          onFocus={e => { e.currentTarget.style.borderColor = '#1E4237' }}
          onBlur={e => { e.currentTarget.style.borderColor = 'rgba(28,28,26,0.10)' }}
        />
        <p style={{ fontFamily: '"Manrope",sans-serif', fontSize: 11, color: '#8A8A85', marginTop: 6 }}>
          Use <code style={{ fontFamily: '"JetBrains Mono",monospace', background: '#F5F3ED', padding: '1px 6px', borderRadius: 3, color: '#8C4C32' }}>{'{{name}}'}</code> to personalise with customer's name
        </p>
      </div>

      {/* Action row */}
      <div className="flex items-center gap-3 pt-2" style={{ borderTop: '1px solid rgba(28,28,26,0.08)' }}>
        <button
          onClick={onCreate}
          disabled={busy || !form.name.trim() || !form.content_template.trim() || form.target_channels.length === 0}
          data-testid="btn-create-campaign"
          className="inline-flex items-center gap-2 px-5 py-3 rounded"
          style={{
            background: '#1E4237', color: '#FDFBF7', fontFamily: '"Manrope",sans-serif', fontSize: 13, fontWeight: 600,
            opacity: busy || !form.name.trim() || !form.content_template.trim() || form.target_channels.length === 0 ? 0.5 : 1,
            cursor: busy || !form.name.trim() || !form.content_template.trim() || form.target_channels.length === 0 ? 'not-allowed' : 'pointer',
          }}
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Create Campaign
        </button>
        <button
          onClick={onCancel}
          style={{ fontFamily: '"Manrope",sans-serif', fontSize: 13, fontWeight: 500, color: '#5C5C58', padding: '11px 16px', border: '1px solid rgba(28,28,26,0.12)', borderRadius: 4, background: 'transparent', cursor: 'pointer' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#F5F3ED' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

// ── Helper components ─────────────────────────────────────────
function DetailSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p style={{ fontFamily: '"Manrope",sans-serif', fontWeight: 700, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.18em', color: '#B5B3AC', marginBottom: 12 }}>
        {label}
      </p>
      {children}
    </div>
  )
}

function DrawerButton({ label, icon, bg, color, hoverBg, disabled, onClick, testId }: {
  label: string; icon: React.ReactNode; bg: string; color: string; hoverBg: string; disabled: boolean; onClick: () => void; testId?: string
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      data-testid={testId}
      className="w-full flex items-center justify-between gap-2 px-5 py-3.5 rounded"
      style={{
        background: disabled ? '#F0EFEA' : bg,
        color: disabled ? '#B5B3AC' : color,
        fontFamily: '"Manrope",sans-serif',
        fontSize: 13,
        fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer',
        border: 'none',
      }}
      onMouseEnter={e => { if (!disabled) (e.currentTarget as HTMLElement).style.background = hoverBg }}
      onMouseLeave={e => { if (!disabled) (e.currentTarget as HTMLElement).style.background = disabled ? '#F0EFEA' : bg }}
    >
      <span>{label}</span>
      {icon}
    </button>
  )
}
