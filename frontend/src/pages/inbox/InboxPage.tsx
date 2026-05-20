import { useEffect, useState } from 'react'
import { Mail, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { useConversationStore } from '../../stores/conversationStore'
import { conversations as convApi, test as testApi } from '../../services/api'
import type { Conversation } from '../../types'
import ConversationList from './ConversationList'
import ConversationThread from './ConversationThread'
import Customer360Panel from './Customer360Panel'

type TestState = 'idle' | 'sending' | 'ok' | 'error'

export default function InboxPage() {
  const { conversations, activeId, setConversations, setActive } = useConversationStore()
  const [history, setHistory] = useState<Conversation[]>([])
  const [tab, setTab] = useState<'active' | 'history'>('active')
  const [search, setSearch] = useState('')
  const [testState, setTestState] = useState<TestState>('idle')

  const active = conversations.find((c) => c.id === activeId) ?? history.find((c) => c.id === activeId) ?? null

  useEffect(() => {
    const loadActive = () =>
      Promise.all([convApi.list({ status: 'open' }), convApi.list({ status: 'waiting' })]).then(
        ([open, waiting]) =>
          setConversations(
            [...open, ...waiting].sort(
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

  const displayList = tab === 'active' ? conversations : history

  const filtered = displayList.filter((c) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      c.customer_name?.toLowerCase().includes(q) ||
      c.topic?.toLowerCase().includes(q) ||
      c.one_liner?.toLowerCase().includes(q)
    )
  })

  const sendTestEmail = async () => {
    setTestState('sending')
    try {
      await testApi.sendEmail()
      setTestState('ok')
      setTimeout(() => setTestState('idle'), 4000)
    } catch {
      setTestState('error')
      setTimeout(() => setTestState('idle'), 4000)
    }
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">

      {/* Live test banner */}
      <div className="flex-shrink-0 flex items-center justify-between gap-3 px-4 py-2 bg-teal-50 border-b border-teal-100 text-xs">
        <div className="flex items-center gap-2 text-teal-700">
          <Mail className="w-3.5 h-3.5 flex-shrink-0" />
          <span>Live test — send an email to <strong>virajbhatia1611@gmail.com</strong> to see it appear here as a new ticket</span>
        </div>
        <button
          onClick={sendTestEmail}
          disabled={testState === 'sending'}
          className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-medium transition-colors disabled:opacity-60 whitespace-nowrap"
        >
          {testState === 'sending' && <Loader2 className="w-3 h-3 animate-spin" />}
          {testState === 'ok'      && <CheckCircle className="w-3 h-3" />}
          {testState === 'error'   && <AlertCircle className="w-3 h-3" />}
          {testState === 'idle'    && <Mail className="w-3 h-3" />}
          {testState === 'sending' ? 'Sending…' : testState === 'ok' ? 'Sent!' : testState === 'error' ? 'Failed' : 'Send test email'}
        </button>
      </div>

    <div className="flex-1 grid overflow-hidden min-h-0" style={{ gridTemplateColumns: '320px 1fr 360px' }}>
      <ConversationList
        conversations={filtered}
        onSelect={setActive}
        tab={tab}
        setTab={setTab}
        search={search}
        setSearch={setSearch}
        activeCount={conversations.length}
        historyCount={history.length}
      />
      <ConversationThread conversation={active} onClose={(id) => {
        setConversations(conversations.filter((c) => c.id !== id))
        setActive('')
      }} />
      <Customer360Panel conversation={active} />
    </div>
    </div>
  )
}
