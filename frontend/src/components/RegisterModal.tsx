import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { UserPlus, X, CheckCircle, Loader2, Mail, Phone, Send, Users } from 'lucide-react'
import { register } from '../services/api'

// Shared inline style tokens
const C = {
  page:    '#FDFBF7',
  forest:  '#1E4237',
  clay:    '#D37B5C',
  ink:     '#1C1C1A',
  ink500:  '#5C5C58',
  ink400:  '#8A8A85',
  border:  'rgba(28,28,26,0.10)',
  borderS: 'rgba(28,28,26,0.16)',
  serif:   '"Cormorant Garamond",Georgia,serif',
  sans:    '"Manrope",system-ui,sans-serif',
  mono:    '"JetBrains Mono",monospace',
}

function Field({ label, placeholder, value, onChange, icon, type = 'text' }: {
  label: string; placeholder: string; value: string
  onChange: (v: string) => void; icon: React.ReactNode; type?: string
}) {
  return (
    <div>
      <label
        style={{ fontFamily: C.sans, fontWeight: 700, fontSize: 10.5, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.ink400, display: 'block', marginBottom: 6 }}
      >
        {label}
      </label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: C.ink400 }}>{icon}</span>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={{
            width: '100%',
            background: '#F9F8F4',
            border: `1px solid ${C.border}`,
            borderRadius: 4,
            paddingLeft: 36,
            paddingRight: 12,
            paddingTop: 10,
            paddingBottom: 10,
            fontSize: 14,
            color: C.ink,
            fontFamily: C.sans,
            outline: 'none',
          }}
          onFocus={e => { e.currentTarget.style.borderColor = C.forest }}
          onBlur={e => { e.currentTarget.style.borderColor = C.border }}
          className="placeholder:text-ink-300"
        />
      </div>
    </div>
  )
}

export function RegisterModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({ email: '', name: '', whatsapp: '', telegram: '' })
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [err, setErr]   = useState('')

  const submit = async () => {
    if (!form.email.trim()) { setErr('Email is required'); return }
    setBusy(true); setErr('')
    try {
      await register({
        email:    form.email.trim(),
        name:     form.name.trim()     || undefined,
        whatsapp: form.whatsapp.trim() || undefined,
        telegram: form.telegram.trim() || undefined,
      })
      setDone(true)
    } catch {
      setErr('Registration failed — please try again')
    } finally { setBusy(false) }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(28,28,26,0.55)', backdropFilter: 'blur(8px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        style={{
          width: '100%',
          maxWidth: 440,
          background: '#FDFBF7',
          border: `1px solid ${C.borderS}`,
          borderRadius: 4,
          boxShadow: '0 24px 64px rgba(28,28,26,0.12)',
          padding: 32,
        }}
        onClick={(e) => e.stopPropagation()}
        data-testid="register-modal"
      >
        <div className="flex items-start justify-between mb-7">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-8 h-8 rounded flex items-center justify-center" style={{ background: '#E1EDE6' }}>
                <UserPlus className="w-4 h-4" style={{ color: C.forest }} />
              </div>
              <h2 style={{ fontFamily: C.serif, fontSize: 22, fontWeight: 500, color: C.ink }}>Stay Connected</h2>
            </div>
            <p style={{ fontFamily: C.sans, fontSize: 13, color: C.ink500, marginLeft: 44 }}>
              Register to receive NeoBank campaign messages
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ color: C.ink400 }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = C.ink }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = C.ink400 }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {done ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-6"
          >
            <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: '#E1EDE6' }}>
              <CheckCircle className="w-7 h-7" style={{ color: C.forest }} />
            </div>
            <p style={{ fontFamily: C.serif, fontSize: 22, fontWeight: 500, color: C.ink }}>You're registered!</p>
            <p style={{ fontFamily: C.sans, fontSize: 13, color: C.ink500, marginTop: 6, lineHeight: 1.6 }}>
              You'll receive NeoBank updates on your provided channels.
            </p>
            <button
              onClick={onClose}
              className="mt-6 px-6 py-2.5 rounded-full"
              style={{ background: C.forest, color: '#FDFBF7', fontFamily: C.sans, fontSize: 13, fontWeight: 600 }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#153028' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = C.forest }}
            >
              Done
            </button>
          </motion.div>
        ) : (
          <div className="space-y-4">
            <Field
              label="Email *" type="email" placeholder="you@example.com"
              value={form.email} onChange={(v) => setForm({ ...form, email: v })}
              icon={<Mail className="w-4 h-4" />}
            />
            <Field
              label="Name" placeholder="Your name (optional)"
              value={form.name} onChange={(v) => setForm({ ...form, name: v })}
              icon={<Users className="w-4 h-4" />}
            />
            <Field
              label="WhatsApp" placeholder="+91 98765 43210 (optional)"
              value={form.whatsapp} onChange={(v) => setForm({ ...form, whatsapp: v })}
              icon={<Phone className="w-4 h-4" />}
            />
            <Field
              label="Telegram" placeholder="Chat ID or @username (optional)"
              value={form.telegram} onChange={(v) => setForm({ ...form, telegram: v })}
              icon={<Send className="w-4 h-4" />}
            />

            {err && (
              <p style={{ fontFamily: C.sans, fontSize: 12, color: '#8C2E1F', background: '#FBE5E0', border: '1px solid rgba(140,46,31,0.15)', borderRadius: 4, padding: '8px 12px' }}>
                {err}
              </p>
            )}

            <button
              onClick={submit}
              disabled={busy}
              data-testid="register-submit"
              className="w-full flex items-center justify-center gap-2 py-3 rounded-full"
              style={{
                background: busy ? '#8A8A85' : C.forest,
                color: '#FDFBF7',
                fontFamily: C.sans,
                fontSize: 14,
                fontWeight: 600,
                opacity: busy ? 0.7 : 1,
                cursor: busy ? 'not-allowed' : 'pointer',
              }}
              onMouseEnter={e => { if (!busy) (e.currentTarget as HTMLElement).style.background = '#153028' }}
              onMouseLeave={e => { if (!busy) (e.currentTarget as HTMLElement).style.background = C.forest }}
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              Register
            </button>
            <p style={{ fontFamily: C.sans, fontSize: 11, color: C.ink400, textAlign: 'center', lineHeight: 1.5 }}>
              Your details are only used to send you NeoBank communications.
            </p>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}

export function RegisterModalWrapper({ show, onClose }: { show: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {show && <RegisterModal onClose={onClose} />}
    </AnimatePresence>
  )
}
