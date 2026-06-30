import { useState, useEffect } from 'react'
import { Shield, Mail, Trash2, AlertTriangle, Info, Loader2 } from 'lucide-react'
import { compliance } from '../services/api'
import type { DNCEntry } from '../types'
import { motion, AnimatePresence } from 'framer-motion'

export default function CompliancePage() {
  const [dncList, setDncList] = useState<DNCEntry[]>([])
  const [email, setEmail] = useState('')
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { compliance.dncList().then(setDncList) }, [])

  const add = async () => {
    const val = email.trim().toLowerCase()
    if (!val || !val.includes('@')) { setError('Enter a valid email address'); return }
    setError('')
    setAdding(true)
    try {
      const entry = await compliance.addDnc(val)
      setDncList((prev) => [entry, ...prev])
      setEmail('')
    } catch (e: any) {
      setError(e?.response?.data?.detail ?? 'Failed to add entry')
    } finally {
      setAdding(false)
    }
  }

  const remove = async (id: string) => {
    await compliance.removeDnc(id)
    setDncList((prev) => prev.filter((d) => d.id !== id))
  }

  const emailEntries = dncList.filter((d) => d.identifier_type === 'email')

  return (
    <div className="h-full flex flex-col bg-transparent overflow-hidden">
      
      {/* Top Header */}
      <div className="bg-[#020e0c]/60 backdrop-blur-md border-b border-[#2dd4bf]/15 px-6 py-4 flex-shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/35 flex items-center justify-center shadow-lg shadow-red-500/10">
            <Shield className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h1 className="text-sm font-bold uppercase tracking-wider text-white">Compliance & Consent</h1>
            <p className="text-[10px] font-semibold tracking-wider text-red-400/60 mt-0.5">Do Not Contact (DNC) Registry</p>
          </div>
        </div>
      </div>

      {/* Main Content Workspace — Centered for better aesthetic layout */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col items-center z-0">
        <div className="w-full max-w-2xl space-y-6">

          {/* How DNC Works */}
          <div className="flex gap-3 bg-blue-500/10 border border-blue-500/20 rounded-2xl p-5 backdrop-blur-md">
            <Info className="w-4 h-4 text-blue-300 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-blue-200 space-y-1.5 leading-relaxed">
              <p className="font-bold uppercase tracking-wider text-blue-300 text-[10px]">Registry Mechanics</p>
              <p>Adding a customer's email to DNC blocks <strong>all active outbound communication channels</strong> (WhatsApp, Telegram, Instagram, Email). The system halts all campaigns or direct messages to this customer instantly.</p>
              <p>Customers can self-opt-out at any time by sending a message containing only <code className="bg-white/5 px-1.5 py-0.5 rounded text-blue-300 font-mono">"opt out"</code> on any connected channel.</p>
            </div>
          </div>

          {/* Block Action Form */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-2xl backdrop-blur-md">
            <h3 className="text-xs font-bold uppercase tracking-widest text-white/60 mb-4 flex items-center gap-2">
              <Mail className="w-4 h-4 text-white/40" />
              Add Customer to Registry
            </h3>
            <div className="flex gap-3">
              <input
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError('') }}
                onKeyDown={(e) => e.key === 'Enter' && add()}
                placeholder="customer@example.com"
                type="email"
                className="flex-1 border border-white/10 bg-[#020e0c]/55 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-red-400 text-white"
              />
              <button
                onClick={add}
                disabled={adding}
                className="px-5 py-3 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap active:scale-98 shadow-md shadow-red-500/10"
              >
                {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Block Identity'}
              </button>
            </div>
            <AnimatePresence>
              {error && (
                <motion.p 
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="mt-3 text-xs text-red-400 flex items-center gap-1.5 font-semibold"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />{error}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Blocked Identities Registry List */}
          <div className="bg-white/5 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-md overflow-hidden">
            <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-widest text-white/60">Active Blocks</p>
              <span className="text-[9px] bg-red-500/10 border border-red-500/20 text-red-300 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
                {emailEntries.length} Identity Registry
              </span>
            </div>

            <div className="divide-y divide-white/5 max-h-[30rem] overflow-y-auto">
              {emailEntries.length === 0 ? (
                <div className="px-5 py-16 text-center text-white/30 text-xs font-medium">No identities blocked in database</div>
              ) : (
                emailEntries.map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between px-5 py-4 hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center flex-shrink-0">
                        <Mail className="w-4 h-4 text-red-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-mono font-bold text-white truncate">{entry.identifier}</p>
                        {entry.customer_name ? (
                          <p className="text-[10px] text-white/40 mt-0.5 truncate font-semibold">Customer: {entry.customer_name}</p>
                        ) : (
                          <p className="text-[10px] text-white/30 mt-0.5 truncate font-semibold italic">Identity reference unlinked</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                      <span className="text-[9px] font-semibold text-white/30 uppercase tracking-wider">
                        {new Date(entry.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </span>
                      <button
                        onClick={() => remove(entry.id)}
                        title="Remove from DNC registry"
                        className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
