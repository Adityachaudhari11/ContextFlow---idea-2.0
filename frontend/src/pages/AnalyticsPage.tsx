import { useState, useEffect } from 'react'
import { analytics } from '../services/api'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts'
import { MessageSquare, CheckCircle, Clock, AlertTriangle, TrendingUp, Inbox, Ban, Loader2 } from 'lucide-react'

const CHANNEL_COLORS: Record<string, string> = {
  whatsapp: '#22c55e',
  instagram: '#ec4899',
  email: '#3b82f6',
  telegram: '#0ea5e9',
}

const SENTIMENT_COLORS: Record<string, string> = {
  positive: '#10b981',
  neutral: '#94a3b8',
  negative: '#f87171',
  frustrated: '#fb923c',
}

const SENTIMENT_LABELS: Record<string, string> = {
  positive: 'Positive',
  neutral: 'Neutral',
  negative: 'Negative',
  frustrated: 'Frustrated',
}

interface DashData {
  total_conversations: number
  active_conversations: number
  open_conversations: number
  waiting_conversations: number
  awaiting_acc_no: number
  resolved_conversations: number
  closed_conversations: number
  resolved_today: number
  resolved_this_week: number
  total_messages: number
  dnc_count: number
  sla_breached: number
  resolution_rate: number
  avg_response_minutes: number
  channel_breakdown: { channel: string; count: number }[]
  volume_by_day: { date: string; count: number }[]
  sentiment_distribution: { sentiment: string; count: number }[]
  status_breakdown: { status: string; count: number; color: string }[]
  top_issues: { issue: string; count: number }[]
}

function KpiCard({
  label, value, sub, icon, color = 'teal',
}: {
  label: string
  value: string | number
  sub?: string
  icon: React.ReactNode
  color?: 'teal' | 'amber' | 'red' | 'blue' | 'green' | 'purple' | 'gray'
}) {
  const colorMap = {
    teal:   { border: 'border-teal-500/30',   text: 'text-teal-300',   iconBg: 'bg-teal-500/10'   },
    amber:  { border: 'border-amber-500/30',  text: 'text-amber-300',  iconBg: 'bg-amber-500/10'  },
    red:    { border: 'border-red-500/30',    text: 'text-red-400',    iconBg: 'bg-red-500/10'    },
    blue:   { border: 'border-blue-500/30',   text: 'text-blue-300',   iconBg: 'bg-blue-500/10'   },
    green:  { border: 'border-emerald-500/30',text: 'text-emerald-300',iconBg: 'bg-emerald-500/10'},
    purple: { border: 'border-purple-500/30', text: 'text-purple-300', iconBg: 'bg-purple-500/10' },
    gray:   { border: 'border-white/10',       text: 'text-white/80',   iconBg: 'bg-white/5'       },
  }
  const c = colorMap[color]
  return (
    <div className={`bg-white/5 rounded-xl border ${c.border} p-4 flex items-start gap-3 backdrop-blur-md shadow-lg`}>
      <div className={`w-9 h-9 rounded-lg ${c.iconBg} flex items-center justify-center flex-shrink-0 border border-white/5`}>
        <div className={c.text}>{icon}</div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider">{label}</p>
        <p className={`text-2xl font-bold mt-1 tracking-tight ${c.text}`}>{value}</p>
        {sub && <p className="text-[10px] text-white/55 font-medium mt-1 leading-none">{sub}</p>}
      </div>
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-[#020e0c]/90 border border-white/10 rounded-xl px-3 py-2 shadow-2xl text-[10px] font-semibold uppercase tracking-wider text-white backdrop-blur-md">
        <p className="text-teal-400 font-bold mb-1">{label}</p>
        {payload.map((p: any) => (
          <p key={p.name} style={{ color: p.fill || p.stroke }} className="mt-0.5">
            {p.value} {p.name}
          </p>
        ))}
      </div>
    )
  }
  return null
}

export default function AnalyticsPage() {
  const [data, setData] = useState<DashData | null>(null)

  useEffect(() => { analytics.dashboard().then(setData) }, [])

  if (!data) return (
    <div className="h-full flex items-center justify-center text-white/35 text-xs font-semibold uppercase tracking-widest bg-transparent">
      <Loader2 className="w-5 h-5 animate-spin text-teal-400 mr-2" /> Loading stats ledger…
    </div>
  )

  const totalSentiment = data.sentiment_distribution.reduce((s, x) => s + x.count, 0)

  return (
    <div className="h-full flex flex-col bg-transparent overflow-y-auto z-0 select-none">
      
      {/* Top Header */}
      <div className="bg-[#020e0c]/60 backdrop-blur-md border-b border-[#2dd4bf]/15 px-6 py-4 flex-shrink-0 z-10">
        <h1 className="text-sm font-bold uppercase tracking-wider text-white">Analytics Desk</h1>
        <p className="text-[10px] font-semibold tracking-wider text-teal-400/60 mt-0.5">Support operations overview — NeoBank</p>
      </div>

      <div className="p-6 space-y-6 max-w-5xl mx-auto w-full">

        {/* KPI row 1 — ticket health */}
        <div>
          <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3">Ticket Health Registry</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard label="Total Conversations" value={data.total_conversations} icon={<MessageSquare className="w-4 h-4" />} color="teal" />
            <KpiCard label="Active Tickets" value={data.active_conversations} sub={`${data.open_conversations} open · ${data.waiting_conversations} waiting`} icon={<Inbox className="w-4 h-4" />} color="blue" />
            <KpiCard label="Resolved This Week" value={data.resolved_this_week} sub={`${data.resolved_today} resolved today`} icon={<CheckCircle className="w-4 h-4" />} color="green" />
            <KpiCard label="SLA Breached" value={data.sla_breached} sub="Open tickets > 24h" icon={<AlertTriangle className="w-4 h-4" />} color={data.sla_breached > 0 ? 'red' : 'gray'} />
          </div>
        </div>

        {/* KPI row 2 — performance */}
        <div>
          <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3">Response Performance Metrics</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard label="Avg First Response" value={`${data.avg_response_minutes?.toFixed(0) ?? '–'} min`} sub="Inbound to first agent reply" icon={<Clock className="w-4 h-4" />} color="amber" />
            <KpiCard label="Resolution Rate" value={`${data.resolution_rate}%`} sub="Resolved + Closed / Total" icon={<TrendingUp className="w-4 h-4" />} color="teal" />
            <KpiCard label="Total Messages" value={data.total_messages} sub="Across all channels" icon={<MessageSquare className="w-4 h-4" />} color="purple" />
            <KpiCard label="DNC Entries" value={data.dnc_count} sub="Opted-out customer contacts" icon={<Ban className="w-4 h-4" />} color="gray" />
          </div>
        </div>

        {/* Charts row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Volume chart */}
          <div className="bg-white/5 rounded-2xl border border-white/10 p-5 backdrop-blur-md shadow-xl">
            <p className="text-xs font-bold uppercase tracking-widest text-white/80">Conversation Volume</p>
            <p className="text-[10px] text-white/40 font-semibold mt-1 mb-5">New incoming tickets per day (14 days)</p>
            <div className="w-full">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={data.volume_by_day} barSize={12}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: 600 }} axisLine={false} tickLine={false} interval={1} />
                  <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: 600 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                  <Bar dataKey="count" name="tickets" fill="#00f2fe" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Channel breakdown */}
          <div className="bg-white/5 rounded-2xl border border-white/10 p-5 backdrop-blur-md shadow-xl">
            <p className="text-xs font-bold uppercase tracking-widest text-white/80">Channel Breakdown</p>
            <p className="text-[10px] text-white/40 font-semibold mt-1 mb-5">Outgoing messages volume by network</p>
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="w-full sm:w-[50%] flex justify-center">
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={data.channel_breakdown} dataKey="count" nameKey="channel" cx="50%" cy="50%" outerRadius={70} innerRadius={42}>
                      {data.channel_breakdown.map((entry) => (
                        <Cell key={entry.channel} fill={CHANNEL_COLORS[entry.channel] ?? 'rgba(255,255,255,0.2)'} stroke="rgba(3, 21, 18, 0.8)" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 w-full space-y-2.5">
                {data.channel_breakdown.map((entry) => {
                  const total = data.channel_breakdown.reduce((s, x) => s + x.count, 0)
                  const pct = total > 0 ? Math.round(entry.count / total * 100) : 0
                  return (
                    <div key={entry.channel}>
                      <div className="flex items-center justify-between mb-1 text-[10px] font-semibold uppercase tracking-wider">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-md" style={{ background: CHANNEL_COLORS[entry.channel] ?? '#9ca3af' }} />
                          <span className="text-white/70 capitalize">{entry.channel}</span>
                        </div>
                        <span className="text-white font-bold">{entry.count} ({pct}%)</span>
                      </div>
                      <div className="h-1 rounded-full bg-white/5">
                        <div className="h-1 rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: CHANNEL_COLORS[entry.channel] ?? '#9ca3af' }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Charts row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Ticket status breakdown */}
          <div className="bg-white/5 rounded-2xl border border-white/10 p-5 backdrop-blur-md shadow-xl">
            <p className="text-xs font-bold uppercase tracking-widest text-white/80">Ticket Status Distribution</p>
            <p className="text-[10px] text-white/40 font-semibold mt-1 mb-5">Current proportion of active queues</p>
            <div className="space-y-3.5">
              {data.status_breakdown.filter(s => s.count > 0).map((s) => {
                const pct = data.total_conversations > 0 ? Math.round(s.count / data.total_conversations * 100) : 0
                return (
                  <div key={s.status}>
                    <div className="flex items-center justify-between mb-1.5 text-[10px] font-semibold uppercase tracking-wider">
                      <span className="text-white/70">{s.status}</span>
                      <span className="text-white font-bold">{s.count} <span className="text-white/30">({pct}%)</span></span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/5">
                      <div className="h-1.5 rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: s.color || '#2dd4bf' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Sentiment distribution */}
          <div className="bg-white/5 rounded-2xl border border-white/10 p-5 backdrop-blur-md shadow-xl">
            <p className="text-xs font-bold uppercase tracking-widest text-white/80">Customer Sentiment Analysis</p>
            <p className="text-[10px] text-white/40 font-semibold mt-1 mb-5">AI-classified conversation tone distribution</p>
            <div className="space-y-3.5">
              {data.sentiment_distribution.map((s) => {
                const pct = totalSentiment > 0 ? Math.round(s.count / totalSentiment * 100) : 0
                const label = SENTIMENT_LABELS[s.sentiment] ?? s.sentiment
                const color = SENTIMENT_COLORS[s.sentiment] ?? '#9ca3af'
                return (
                  <div key={s.sentiment}>
                    <div className="flex items-center justify-between mb-1.5 text-[10px] font-semibold uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                        <span className="text-white/70">{label}</span>
                      </div>
                      <span className="text-white font-bold">{s.count} <span className="text-white/30">({pct}%)</span></span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/5">
                      <div className="h-1.5 rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Top complaint categories */}
        {data.top_issues.length > 0 && (
          <div className="bg-white/5 rounded-2xl border border-white/10 p-5 backdrop-blur-md shadow-xl">
            <p className="text-xs font-bold uppercase tracking-widest text-white/80">Top Complaint Categories</p>
            <p className="text-[10px] text-white/40 font-semibold mt-1 mb-5">Most frequent issues processed by GPT analytics</p>
            <div className="w-full">
              <ResponsiveContainer width="100%" height={Math.max(160, data.top_issues.length * 36)}>
                <BarChart data={data.top_issues} layout="vertical" barSize={12}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
                  <XAxis type="number" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: 600 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <YAxis type="category" dataKey="issue" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 9, fontWeight: 600 }} width={160} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                  <Bar dataKey="count" name="cases" fill="#818cf8" radius={[0, 3, 3, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
