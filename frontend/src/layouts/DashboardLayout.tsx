import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  MessageSquare, Megaphone, Shield, BarChart3,
  Home, ChevronLeft, ChevronRight,
} from 'lucide-react'
import { useWebSocket } from '../hooks/useWebSocket'

const navItems = [
  { to: '/inbox',      label: 'Inbox',      icon: MessageSquare, num: '01' },
  { to: '/campaigns',  label: 'Campaigns',  icon: Megaphone,     num: '02' },
  { to: '/compliance', label: 'Compliance', icon: Shield,        num: '03' },
  { to: '/analytics',  label: 'Analytics',  icon: BarChart3,     num: '04' },
]

export default function DashboardLayout() {
  useWebSocket('demo-agent')
  const navigate = useNavigate()
  const [open, setOpen] = useState(true)

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: '#F9F8F4' }}
      data-testid="dashboard-layout"
    >
      {/* ── Sidebar ────────────────────────────────────── */}
      <aside
        data-testid="dashboard-sidebar"
        style={{
          width: open ? 224 : 60,
          background: '#F9F8F4',
          borderRight: '1px solid rgba(28,28,26,0.08)',
          transition: 'width 320ms cubic-bezier(0.22,1,0.36,1)',
        }}
        className="relative flex-shrink-0 flex flex-col overflow-hidden"
      >
        {/* Logo block */}
        <div
          className="h-14 flex items-center justify-between px-4 flex-shrink-0"
          style={{ borderBottom: '1px solid rgba(28,28,26,0.08)' }}
        >
          <button
            onClick={() => navigate('/home')}
            className="flex items-center gap-2.5 min-w-0 group"
            data-testid="sidebar-logo"
            title="ContextFlow home"
          >
            <div
              className="w-7 h-7 rounded flex items-center justify-center flex-shrink-0 group-hover:opacity-80"
              style={{ background: '#1E4237' }}
            >
              <MessageSquare className="w-3.5 h-3.5" style={{ color: '#FDFBF7' }} />
            </div>
            {open && (
              <span
                className="truncate"
                style={{ fontFamily: '"Cormorant Garamond", Georgia, serif', fontSize: 18, color: '#1C1C1A', fontWeight: 500 }}
              >
                ContextFlow
              </span>
            )}
          </button>

          {open && (
            <button
              onClick={() => setOpen(false)}
              data-testid="sidebar-collapse"
              className="flex-shrink-0 hover:opacity-70"
              style={{ color: '#8A8A85' }}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-5 px-3 space-y-0.5 overflow-hidden">
          {open && (
            <p className="px-2 mb-3" style={{ fontFamily: '"Manrope",sans-serif', fontWeight: 700, fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#B5B3AC' }}>
              Sections
            </p>
          )}

          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                title={!open ? item.label : undefined}
                data-testid={`sidebar-nav-${item.label.toLowerCase()}`}
                className={({ isActive }) =>
                  `relative flex items-center gap-2.5 px-2.5 py-2 rounded text-sm font-medium border ${
                    isActive
                      ? 'border-black/[0.08] bg-white text-ink-900 shadow-[0_1px_3px_rgba(28,28,26,0.06)]'
                      : 'border-transparent text-ink-500 hover:bg-ivory-200 hover:text-ink-900'
                  }`
                }
                style={{ fontFamily: '"Manrope",sans-serif', fontWeight: 500 }}
              >
                {({ isActive }) => (
                  <>
                    {open && (
                      <span
                        className="flex-shrink-0"
                        style={{
                          fontFamily: '"JetBrains Mono",monospace',
                          fontSize: 9,
                          letterSpacing: '0.12em',
                          color: isActive ? '#D37B5C' : '#B5B3AC',
                        }}
                      >
                        {item.num}
                      </span>
                    )}
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    {open && <span className="truncate">{item.label}</span>}
                    {isActive && open && (
                      <motion.span
                        layoutId="sidebar-pip"
                        className="absolute right-2.5 w-1 h-1 rounded-full"
                        style={{ background: '#D37B5C' }}
                      />
                    )}
                  </>
                )}
              </NavLink>
            )
          })}
        </nav>

        {/* Footer */}
        <div
          className="px-3 pb-4 pt-3 flex-shrink-0"
          style={{ borderTop: '1px solid rgba(28,28,26,0.08)' }}
        >
          <NavLink
            to="/home"
            title={!open ? 'Back to landing' : undefined}
            data-testid="sidebar-home"
            className="flex items-center gap-2.5 px-2.5 py-2 rounded text-ink-500 hover:bg-ivory-200 hover:text-ink-900 text-xs"
            style={{ fontFamily: '"Manrope",sans-serif' }}
          >
            <Home className="w-4 h-4 flex-shrink-0" />
            {open && <span>Back to landing</span>}
          </NavLink>

          {open && (
            <div
              className="mt-3 mx-0.5 pt-3 flex items-center gap-2.5"
              style={{ borderTop: '1px solid rgba(28,28,26,0.08)' }}
            >
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{
                  fontFamily: '"Cormorant Garamond",Georgia,serif',
                  fontSize: 14,
                  fontWeight: 600,
                  background: '#FAEEE5',
                  border: '1px solid rgba(211,123,92,0.3)',
                  color: '#8C4C32',
                }}
              >
                N
              </div>
              <div className="min-w-0">
                <p style={{ fontFamily: '"Manrope",sans-serif', fontSize: 12, fontWeight: 600, color: '#1C1C1A' }} className="truncate leading-none">
                  NeoBank
                </p>
                <p style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9.5, color: '#8A8A85', marginTop: 2 }} className="truncate">
                  demo · agent
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Expand toggle */}
        {!open && (
          <button
            onClick={() => setOpen(true)}
            data-testid="sidebar-expand"
            className="absolute top-5 -right-3 z-10 w-6 h-6 rounded-full flex items-center justify-center hover:opacity-90"
            style={{
              background: '#FDFBF7',
              border: '1px solid rgba(28,28,26,0.14)',
              boxShadow: '0 1px 4px rgba(28,28,26,0.08)',
              color: '#5C5C58',
            }}
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </aside>

      {/* ── Main ───────────────────────────────────────── */}
      <main
        className="flex-1 min-h-0 min-w-0 overflow-hidden"
        style={{ background: '#FDFBF7' }}
        data-testid="dashboard-main"
      >
        <Outlet />
      </main>
    </div>
  )
}
