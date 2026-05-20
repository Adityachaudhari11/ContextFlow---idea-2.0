import { useState, useEffect } from 'react'
import { analytics } from '../services/api'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

const CHANNEL_COLORS: Record<string, string> = {
  whatsapp: '#22c55e',
  instagram: '#ec4899',
  email: '#3b82f6',
  telegram: '#0ea5e9',
  simulator: '#9ca3af',
}

interface DashData {
  total_conversations: number
  open_conversations: number
  resolved_today: number
  avg_response_minutes: number
  channel_breakdown: { channel: string; count: number }[]
  volume_by_day: { date: string; count: number }[]
  sentiment_distribution: { sentiment: string; count: number }[]
}

export default function AnalyticsPage() {
  const [data, setData] = useState<DashData | null>(null)

  useEffect(() => { analytics.dashboard().then(setData) }, [])

  if (!data) return <div className="h-full flex items-center justify-center text-gray-400 text-sm">Loading…</div>

  const kpis = [
    { label: 'Total Conversations', value: data.total_conversations, color: 'text-gray-900' },
    { label: 'Open', value: data.open_conversations, color: 'text-green-600' },
    { label: 'Resolved Today', value: data.resolved_today, color: 'text-blue-600' },
    { label: 'Avg Response (min)', value: data.avg_response_minutes?.toFixed(0) ?? '–', color: 'text-primary-600' },
  ]

  return (
    <div className="h-full flex flex-col bg-gray-50 overflow-y-auto">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-lg font-semibold text-gray-900">Analytics</h1>
      </div>

      <div className="p-6 space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-4 gap-4">
          {kpis.map((kpi) => (
            <div key={kpi.label} className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs text-gray-500 font-medium">{kpi.label}</p>
              <p className={`text-3xl font-bold mt-1 ${kpi.color}`}>{kpi.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Volume chart */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm font-medium text-gray-700 mb-3">Conversation Volume (Last 7 Days)</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.volume_by_day}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#0d9488" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Channel pie */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm font-medium text-gray-700 mb-3">Channel Breakdown</p>
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="60%" height={180}>
                <PieChart>
                  <Pie data={data.channel_breakdown} dataKey="count" nameKey="channel" cx="50%" cy="50%" outerRadius={70}>
                    {data.channel_breakdown.map((entry) => (
                      <Cell key={entry.channel} fill={CHANNEL_COLORS[entry.channel] ?? '#9ca3af'} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-1.5">
                {data.channel_breakdown.map((entry) => (
                  <div key={entry.channel} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: CHANNEL_COLORS[entry.channel] ?? '#9ca3af' }} />
                    <span className="text-xs text-gray-600 capitalize">{entry.channel}</span>
                    <span className="ml-auto text-xs font-medium text-gray-900">{entry.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Sentiment */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm font-medium text-gray-700 mb-3">Sentiment Distribution</p>
          <div className="flex gap-6">
            {data.sentiment_distribution.map((s) => (
              <div key={s.sentiment} className="text-center">
                <p className="text-2xl font-bold text-gray-900">{s.count}</p>
                <p className="text-xs text-gray-500 capitalize mt-0.5">{s.sentiment}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
