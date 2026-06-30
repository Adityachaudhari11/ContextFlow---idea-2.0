import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  MessageSquare, Shield, BarChart3, Globe,
  Mail, Phone, AtSign, Send, Bot, Layers, Zap,
  ArrowUpRight, UserPlus,
} from 'lucide-react'
import { RegisterModalWrapper } from '../components/RegisterModal'

const TELEGRAM_BOT_URL = 'https://t.me/ContextFlow_support_bot'
const EASE = [0.22, 1, 0.36, 1] as const

const navItems = [
  { label: 'Inbox',      path: '/inbox',      num: '01' },
  { label: 'Campaigns',  path: '/campaigns',  num: '02' },
  { label: 'Compliance', path: '/compliance', num: '03' },
  { label: 'Analytics',  path: '/analytics',  num: '04' },
]

const channels = [
  { icon: Phone,    label: 'WhatsApp',  href: null,                        tone: { bg: '#E1EDE6', text: '#1E4237', border: '#C9DDD3' } },
  { icon: AtSign,   label: 'Instagram', href: null,                        tone: { bg: '#FAEEE5', text: '#8C4C32', border: '#E9B69D' } },
  { icon: Mail,     label: 'Email',     href: 'mailto:neobanksupport@gmail.com', tone: { bg: '#E6F0F9', text: '#1A4971', border: '#B8D0E6' } },
  { icon: Send,     label: 'Telegram',  href: TELEGRAM_BOT_URL,            tone: { bg: '#F5F3ED', text: '#5C5C58', border: '#D4D1C8' } },
]

const features = [
  { num: '01', icon: Globe,    title: 'Omni-Channel Inbox',       desc: 'WhatsApp, Instagram, Email, Telegram — every thread in one place. Customers never repeat themselves.' },
  { num: '02', icon: Bot,      title: 'Quiet AI Intelligence',    desc: 'GPT-4o drafts one-liner summaries, surfaces sentiment, and suggests next steps — without taking the wheel.' },
  { num: '03', icon: Zap,      title: 'Real-Time Pulse',          desc: 'WebSocket delivery moves messages from webhook to agent screen in under 500ms. Fast enough to feel instant.' },
  { num: '04', icon: Shield,   title: 'Compliance, Built-In',     desc: 'DNC and consent checked before dispatch — never after. Outbound only when allowed by the registry.' },
  { num: '05', icon: BarChart3,'title': 'A Dashboard, Not a Dump','desc': 'KPIs, channel mix, volume trend, sentiment — distilled to what an agent reads at 9:02 AM, nothing more.' },
  { num: '06', icon: Layers,   title: 'Campaigns That Behave',    desc: 'Target by transaction, segment by intent, dispatch across channels — with audit trails auditors want.' },
]

export default function HomePage() {
  const navigate = useNavigate()
  const [showRegister, setShowRegister] = useState(false)

  return (
    <div
      className="relative min-h-screen overflow-x-hidden paper-grain"
      style={{ background: '#FDFBF7', color: '#1C1C1A', fontFamily: '"Manrope",system-ui,sans-serif' }}
      data-testid="home-page"
    >
      <RegisterModalWrapper show={showRegister} onClose={() => setShowRegister(false)} />

      {/* ── Navbar ──────────────────────────────────────── */}
      <motion.nav
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: EASE }}
        className="sticky top-0 z-40"
        style={{
          background: 'rgba(253,251,247,0.82)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(28,28,26,0.06)',
        }}
        data-testid="home-navbar"
      >
        <div className="max-w-6xl mx-auto px-6 md:px-12 h-14 flex items-center justify-between gap-6">
          {/* Brand */}
          <button
            onClick={() => navigate('/home')}
            className="flex items-center gap-2.5 group"
            data-testid="navbar-logo"
          >
            <div className="w-7 h-7 rounded flex items-center justify-center flex-shrink-0" style={{ background: '#1E4237' }}>
              <MessageSquare className="w-3.5 h-3.5" style={{ color: '#FDFBF7' }} />
            </div>
            <span style={{ fontFamily: '"Cormorant Garamond",Georgia,serif', fontSize: 20, fontWeight: 500, color: '#1C1C1A' }}>
              ContextFlow
            </span>
            <span className="hidden md:inline border-l pl-3" style={{ borderColor: 'rgba(28,28,26,0.12)', fontFamily: '"JetBrains Mono",monospace', fontSize: 9.5, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#8A8A85' }}>
              Vol.01 · 2026
            </span>
          </button>

          {/* Nav links */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((p) => (
              <button
                key={p.path}
                onClick={() => navigate(p.path)}
                data-testid={`navbar-link-${p.label.toLowerCase()}`}
                className="group flex items-center gap-1.5 px-3 py-1.5 rounded hover:bg-ivory-200"
                style={{ fontSize: 13, fontWeight: 500, color: '#5C5C58' }}
              >
                <span style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: '#B5B3AC' }} className="group-hover:!text-clay-500">
                  {p.num}
                </span>
                <span>{p.label}</span>
              </button>
            ))}
          </div>

          {/* CTA */}
          <button
            onClick={() => navigate('/inbox')}
            data-testid="navbar-cta"
            className="group inline-flex items-center gap-1.5 px-4 py-2 rounded-full"
            style={{ background: '#1C1C1A', color: '#FDFBF7', fontSize: 13, fontWeight: 500 }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#1E4237' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '#1C1C1A' }}
          >
            Open the desk
            <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </button>
        </div>
      </motion.nav>

      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 md:px-12 pt-16 md:pt-24 pb-20">
        <div className="grid grid-cols-12 gap-6 md:gap-10">

          {/* Left — Main headline */}
          <div className="col-span-12 lg:col-span-8">
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1, ease: EASE }}
              className="flex items-center gap-3 mb-7"
            >
              <span className="h-px w-10 bg-ink-300" />
              <p className="eyebrow">Idea 2.0 · Team CloudCompute · Hackathon 2026</p>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.15, ease: EASE }}
              className="headline"
              style={{ fontSize: 'clamp(44px, 7vw, 88px)' }}
            >
              One inbox.<br />
              <em>Every</em> channel.<br />
              Zero repetition.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.35, ease: EASE }}
              className="mt-8 max-w-xl leading-relaxed"
              style={{ fontSize: 17, color: '#5C5C58' }}
            >
              ContextFlow folds WhatsApp, Instagram, Email and Telegram into a single,
              calm workspace built for India's public sector, regional rural and co-operative banks.
              Agents see the whole story — always.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.5, ease: EASE }}
              className="mt-10 flex flex-wrap items-center gap-3"
            >
              <button
                onClick={() => navigate('/inbox')}
                data-testid="hero-cta-primary"
                className="group inline-flex items-center gap-2 px-6 py-3.5 rounded-full"
                style={{ background: '#1E4237', color: '#FDFBF7', fontSize: 14, fontWeight: 600 }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#153028' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#1E4237' }}
              >
                Launch agent desk
                <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </button>

              <button
                onClick={() => setShowRegister(true)}
                data-testid="hero-cta-register"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full"
                style={{ border: '1px solid rgba(28,28,26,0.15)', color: '#1C1C1A', fontSize: 14, fontWeight: 500, background: 'transparent' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#F5F3ED' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
              >
                <UserPlus className="w-4 h-4" />
                Get on the campaign list
              </button>

              <a
                href={TELEGRAM_BOT_URL} target="_blank" rel="noopener noreferrer"
                data-testid="hero-cta-telegram"
                className="inline-flex items-center gap-2 px-5 py-3.5 rounded-full"
                style={{ color: '#1A4971', fontSize: 14, fontWeight: 500 }}
              >
                <Send className="w-4 h-4" /> Try the Telegram bot
              </a>
            </motion.div>
          </div>

          {/* Right — Editorial metadata column */}
          <motion.aside
            initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.9, delay: 0.4, ease: EASE }}
            className="col-span-12 lg:col-span-4 lg:pl-8"
            style={{ borderLeft: 'none' }}
          >
            {/* On large screens add a left border */}
            <div className="lg:border-l lg:border-ink-200 lg:pl-8">
              <p className="eyebrow mb-5">In this issue</p>
              <dl className="space-y-4">
                {([
                  ['Channels unified', '4'],
                  ['Median dispatch', '≤500 ms'],
                  ['Compliance pass', '100%'],
                  ['Banks targeted', 'PSU · RRB · UCB'],
                ] as [string, string][]).map(([k, v]) => (
                  <div key={k} className="flex items-baseline justify-between gap-4 pb-4" style={{ borderBottom: '1px solid #E8E6E1' }}>
                    <dt style={{ fontSize: 13, color: '#8A8A85' }}>{k}</dt>
                    <dd style={{ fontFamily: '"Cormorant Garamond",Georgia,serif', fontSize: 26, fontWeight: 500, color: '#1C1C1A', lineHeight: 1 }}>{v}</dd>
                  </div>
                ))}
              </dl>

              <div className="mt-8">
                <p className="eyebrow mb-3">Channels</p>
                <div className="flex flex-wrap gap-2">
                  {channels.map((c) => {
                    const Icon = c.icon
                    const inner = (
                      <span
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
                        style={{ background: c.tone.bg, color: c.tone.text, border: `1px solid ${c.tone.border}`, fontFamily: '"Manrope",sans-serif', fontWeight: 500 }}
                      >
                        <Icon className="w-3.5 h-3.5" /> {c.label}
                      </span>
                    )
                    return c.href ? (
                      <a key={c.label} href={c.href} target={c.href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer">{inner}</a>
                    ) : <span key={c.label}>{inner}</span>
                  })}
                </div>
              </div>
            </div>
          </motion.aside>
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-6xl mx-auto px-6 md:px-12"><div className="rule" /></div>

      {/* ── Features ───────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 md:px-12 py-20" data-testid="features-section">
        <div className="flex items-end justify-between flex-wrap gap-6 mb-12">
          <div>
            <p className="eyebrow mb-3">Inside the platform</p>
            <h2 className="headline text-4xl md:text-5xl max-w-xl">
              Built for the people who actually <em>read</em> the inbox.
            </h2>
          </div>
          <p style={{ fontSize: 13, color: '#8A8A85', maxWidth: 260, lineHeight: 1.6 }}>
            Six quiet capabilities — each earns its place by removing a click, a tab, or a worry.
          </p>
        </div>

        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 overflow-hidden"
          style={{ border: '1px solid rgba(28,28,26,0.09)', borderRadius: 4 }}
        >
          {features.map((f, i) => {
            const Icon = f.icon
            return (
              <motion.article
                key={f.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.6, delay: i * 0.06, ease: EASE }}
                data-testid={`feature-card-${f.num}`}
                className="group p-7 md:p-8 flex flex-col gap-4 card-lift"
                style={{
                  background: '#FDFBF7',
                  borderRight: (i + 1) % 3 !== 0 ? '1px solid rgba(28,28,26,0.08)' : 'none',
                  borderBottom: i < 3 ? '1px solid rgba(28,28,26,0.08)' : 'none',
                }}
              >
                <div className="flex items-center justify-between">
                  <span style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9.5, letterSpacing: '0.18em', color: '#B5B3AC' }}>{f.num}</span>
                  <Icon className="w-4 h-4 transition-colors" style={{ color: '#B5B3AC' }} />
                </div>
                <h3 style={{ fontFamily: '"Cormorant Garamond",Georgia,serif', fontSize: 22, fontWeight: 500, color: '#1C1C1A', lineHeight: 1.2 }}>{f.title}</h3>
                <p style={{ fontSize: 13, color: '#5C5C58', lineHeight: 1.65 }}>{f.desc}</p>
              </motion.article>
            )
          })}
        </div>
      </section>

      {/* ── Quick-nav block ──────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 md:px-12 pb-24">
        <div
          className="p-10 md:p-14 grid grid-cols-12 gap-8 rounded"
          style={{ background: '#1E4237', color: '#FDFBF7' }}
        >
          <div className="col-span-12 md:col-span-5">
            <p style={{ fontFamily: '"Manrope",sans-serif', fontWeight: 700, fontSize: 10.5, letterSpacing: '0.20em', textTransform: 'uppercase', color: '#E9B69D', marginBottom: 12 }}>
              Begin anywhere
            </p>
            <h3 className="headline text-3xl md:text-4xl" style={{ color: '#FDFBF7' }}>
              Four modules.<br />One desk.
            </h3>
            <p className="mt-5" style={{ fontSize: 13, color: 'rgba(253,251,247,0.65)', maxWidth: 280, lineHeight: 1.65 }}>
              Jump straight to the part of the workflow you live in. Everything else stays out of the way.
            </p>
          </div>

          <div className="col-span-12 md:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {navItems.map((p, i) => (
              <motion.button
                key={p.path}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07, ease: EASE }}
                onClick={() => navigate(p.path)}
                data-testid={`quicknav-${p.label.toLowerCase()}`}
                className="group flex items-center justify-between gap-4 px-5 py-5 rounded text-left"
                style={{ background: 'rgba(253,251,247,0.06)', border: '1px solid rgba(253,251,247,0.10)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(253,251,247,0.12)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(253,251,247,0.06)' }}
              >
                <div>
                  <p style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#E9B69D', marginBottom: 6 }}>{p.num}</p>
                  <p style={{ fontFamily: '"Cormorant Garamond",Georgia,serif', fontSize: 20, fontWeight: 500, color: '#FDFBF7' }}>{p.label}</p>
                </div>
                <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" style={{ color: 'rgba(253,251,247,0.5)' }} />
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────── */}
      <footer style={{ borderTop: '1px solid rgba(28,28,26,0.09)' }}>
        <div className="max-w-6xl mx-auto px-6 md:px-12 py-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded flex items-center justify-center" style={{ background: '#1E4237' }}>
              <MessageSquare className="w-3.5 h-3.5" style={{ color: '#FDFBF7' }} />
            </div>
            <div>
              <p style={{ fontFamily: '"Cormorant Garamond",Georgia,serif', fontSize: 16, fontWeight: 500, color: '#1C1C1A', lineHeight: 1 }}>ContextFlow</p>
              <p style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9.5, color: '#8A8A85', textTransform: 'uppercase', letterSpacing: '0.18em', marginTop: 3 }}>Vol.01 · Idea 2.0 · 2026</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2" style={{ fontSize: 12, color: '#8A8A85' }}>
            <span>Made by <span style={{ color: '#1C1C1A', fontWeight: 600 }}>Team CloudCompute</span></span>
            <a href="mailto:neobanksupport@gmail.com" style={{ color: '#8A8A85' }} onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#1C1C1A' }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#8A8A85' }}>
              neobanksupport@gmail.com
            </a>
            <a href={TELEGRAM_BOT_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1" style={{ color: '#8A8A85' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#1C1C1A' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#8A8A85' }}
            >
              <Send className="w-3 h-3" /> @ContextFlow_support_bot
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
