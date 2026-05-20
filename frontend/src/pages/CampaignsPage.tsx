import { useState, useEffect } from 'react'
import { campaignsApi } from '../services/api'
import type { Campaign } from '../types'

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  pending_approval: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-blue-100 text-blue-700',
  scheduled: 'bg-purple-100 text-purple-700',
  running: 'bg-green-100 text-green-700',
  completed: 'bg-teal-100 text-teal-700',
  cancelled: 'bg-red-100 text-red-700',
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ name: '', content_template: '', target_channels: 'whatsapp' })

  useEffect(() => { campaignsApi.list().then(setCampaigns) }, [])

  const create = async () => {
    const c = await campaignsApi.create({
      name: form.name,
      content_template: form.content_template,
      target_channels_json: JSON.stringify([form.target_channels]),
    })
    setCampaigns((prev) => [c, ...prev])
    setForm({ name: '', content_template: '', target_channels: 'whatsapp' })
    setCreating(false)
  }

  const approve = async (id: string) => {
    await campaignsApi.approve(id)
    setCampaigns((prev) => prev.map((c) => c.id === id ? { ...c, status: 'approved' } : c))
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Campaigns</h1>
          <p className="text-sm text-gray-500 mt-0.5">{campaigns.length} campaigns</p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          New Campaign
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {creating && (
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 space-y-3">
            <h3 className="font-medium text-gray-900 text-sm">New Campaign</h3>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Campaign name"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <select
              value={form.target_channels}
              onChange={(e) => setForm({ ...form, target_channels: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="whatsapp">WhatsApp</option>
              <option value="email">Email</option>
              <option value="telegram">Telegram</option>
            </select>
            <textarea
              value={form.content_template}
              onChange={(e) => setForm({ ...form, content_template: e.target.value })}
              placeholder="Message template (use {{name}} for customer name)"
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />
            <div className="flex gap-2">
              <button onClick={create} className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium">Create</button>
              <button onClick={() => setCreating(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm">Cancel</button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {campaigns.map((c) => (
            <div key={c.id} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-gray-900 text-sm">{c.name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full capitalize font-medium ${statusColors[c.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {c.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{c.content_template}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    <span>Sent: {c.sent_count}</span>
                    <span>Delivered: {c.delivered_count}</span>
                  </div>
                </div>
                {c.status === 'pending_approval' && (
                  <button onClick={() => approve(c.id)} className="text-xs px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded-lg font-medium">
                    Approve
                  </button>
                )}
              </div>
            </div>
          ))}
          {campaigns.length === 0 && !creating && (
            <div className="text-center py-16 text-gray-400 text-sm">No campaigns yet</div>
          )}
        </div>
      </div>
    </div>
  )
}
