import React, { useState, useEffect, useRef } from 'react'
import { Mail, Send, Phone, Monitor, MessageSquare, XCircle, Trash2, Crown } from 'lucide-react'
import { useConversationStore } from '../../stores/conversationStore'
import { useSettingsStore } from '../../stores/settingsStore'
import { conversations as convApi, messages as msgApi, customers as custApi } from '../../services/api'
import type { Conversation, Message } from '../../types'

const channelLabels: Record<string, string> = {
  whatsapp: 'WhatsApp',
  instagram: 'Instagram',
  email: 'Email',
  telegram: 'Telegram',
  simulator: 'Simulator',
}

const channelBadgeColors: Record<string, string> = {
  whatsapp: 'bg-green-100 text-green-700',
  instagram: 'bg-pink-100 text-pink-700',
  email: 'bg-blue-100 text-blue-700',
  telegram: 'bg-sky-100 text-sky-700',
  simulator: 'bg-gray-100 text-gray-600',
}

const channelIcons: Record<string, React.ReactElement> = {
  whatsapp: <Phone className="w-3.5 h-3.5" />,
  instagram: <MessageSquare className="w-3.5 h-3.5" />,
  email: <Mail className="w-3.5 h-3.5" />,
  telegram: <Send className="w-3.5 h-3.5" />,
  simulator: <Monitor className="w-3.5 h-3.5" />,
}

interface Props {
  conversation: Conversation | null
  onClose?: (id: string) => void
}

export default function ConversationThread({ conversation, onClose }: Props) {
  const [replyText, setReplyText] = useState('')
  const [sending, setSending] = useState(false)
  const updateCustomerPriority = useConversationStore((s) => s.updateCustomerPriority)
  const [selectedChannel, setSelectedChannel] = useState<string>('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const { messages, setMessages, appendMessage } = useConversationStore()
  const { privilegeCategories } = useSettingsStore()

  const msgs = conversation ? (messages[conversation.id] ?? []) : []

  // Load messages when conversation changes
  useEffect(() => {
    if (!conversation) return
    convApi.messages(conversation.id).then((data) => setMessages(conversation.id, data))
  }, [conversation?.id])

  // Default channel selection when conversation changes
  useEffect(() => {
    const first = conversation?.active_channels?.[0] ?? 'simulator'
    setSelectedChannel(first)
  }, [conversation?.id])

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs.length])

  const handleClose = async () => {
    if (!conversation) return
    try {
      await convApi.close(conversation.id)
      // Brief pause so the auto-reply from the server appears in the thread
      await new Promise((res) => setTimeout(res, 1500))
      onClose?.(conversation.id)
    } catch (e) {
      console.error(e)
    }
  }

  const handleDelete = async () => {
    if (!conversation) return
    try {
      await convApi.delete(conversation.id)
      onClose?.(conversation.id)
    } catch (e) {
      console.error(e)
    }
  }

  const send = async () => {
    if (!replyText.trim() || !conversation) return
    setSending(true)
    try {
      const msg = await msgApi.send(conversation.id, replyText, selectedChannel)
      appendMessage(conversation.id, msg)
      setReplyText('')
    } catch (e) {
      console.error(e)
    } finally {
      setSending(false)
    }
  }

  if (!conversation) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center text-gray-400">
          <MessageSquare className="w-16 h-16 mx-auto mb-3 opacity-20" />
          <p className="text-sm">Select a conversation</p>
        </div>
      </div>
    )
  }

  const activeChannels = conversation.active_channels ?? []

  return (
    <div className="h-full flex flex-col bg-gray-50 overflow-hidden min-h-0">
      {/* Header */}
      <div className="h-auto min-h-[56px] px-4 py-2 flex items-center gap-3 bg-white border-b border-gray-200 flex-shrink-0">
        <div className="flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="font-semibold text-gray-900 text-sm">{conversation.customer_name ?? 'Customer'}</p>
            {conversation.customer_is_priority && (
              <span
                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold"
                style={{
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                  color: 'white',
                  boxShadow: '0 0 6px rgba(245,158,11,0.35)',
                }}
                title="Privileged Customer"
              >
                <Crown className="w-2.5 h-2.5" style={{ fill: 'white' }} />
                {conversation.customer_priority_tag ?? 'VIP'}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 capitalize">{conversation.status}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {activeChannels.map((ch) => (
              <span key={ch} className={`text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${channelBadgeColors[ch] ?? 'bg-gray-100 text-gray-600'}`}>
                {channelIcons[ch]}
                {channelLabels[ch] ?? ch}
              </span>
            ))}
          </div>
          {conversation.customer_is_priority ? (
            <button
              onClick={async () => {
                if (!conversation) return
                try {
                  await custApi.removePrivilegeAllSources(conversation.customer_id)
                  updateCustomerPriority(conversation.customer_id, false)
                } catch (e) {
                  console.error(e)
                  alert('Failed to update VIP status')
                }
              }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors bg-amber-100 text-amber-700 hover:bg-amber-200 border-amber-300"
            >
              <Crown className="w-3.5 h-3.5 text-amber-600 fill-amber-500" aria-hidden="true" />
              Remove Privilege
            </button>
          ) : (
            <div className="relative flex items-center">
              <select
                className="appearance-none bg-amber-50 text-amber-600 border border-amber-200 rounded-lg pl-7 pr-6 py-1 text-xs font-medium focus:outline-none cursor-pointer hover:bg-amber-100 transition-colors"
                value=""
                onChange={async (e) => {
                  if (!conversation) return
                  const tag = e.target.value
                  if (!tag) return
                  try {
                    await custApi.updatePrivilege(conversation.customer_id, { is_priority: true, priority_tag: tag })
                    updateCustomerPriority(conversation.customer_id, true, tag)
                  } catch (e) {
                    console.error(e)
                    alert('Failed to update VIP status')
                  }
                }}
              >
                <option value="" disabled hidden>Add Privilege</option>
                {privilegeCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <Crown className="w-3.5 h-3.5 absolute left-2 text-amber-500 fill-amber-400 pointer-events-none" aria-hidden="true" />
              <svg className="w-3 h-3 absolute right-2 text-amber-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
          )}
          {conversation.status !== 'resolved' && conversation.status !== 'closed' && (
            <button
              onClick={handleClose}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-600 border border-gray-200 hover:border-red-200 transition-colors"
            >
              <XCircle className="w-3.5 h-3.5" />
              Close ticket
            </button>
          )}
          <button
            onClick={handleDelete}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-600 border border-gray-200 hover:border-red-200 transition-colors"
            aria-label="Delete conversation"
          >
            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {msgs.map((msg) => (
          <MessageBubble key={msg.id} msg={msg} />
        ))}
        <div ref={bottomRef} aria-hidden="true" />
      </div>

      {/* Reply composer */}
      <div className="bg-white border-t border-gray-200 px-4 pt-3 pb-3 flex-shrink-0 space-y-2">

        {/* Channel selector */}
        {activeChannels.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-gray-400 mr-1">Reply via:</span>
            {activeChannels.map((ch) => (
              <button
                key={ch}
                onClick={() => setSelectedChannel(ch)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                  selectedChannel === ch
                    ? 'bg-primary-600 text-white border-primary-600'
                    : 'border-gray-200 text-gray-500 hover:border-primary-400 hover:text-primary-600'
                }`}
              >
                {channelIcons[ch]}
                {channelLabels[ch] ?? ch}
              </button>
            ))}
          </div>
        )}

        {/* Message textarea + send */}
        <div className="flex gap-2">
          <label htmlFor="reply-input" className="sr-only">
            Reply message via {channelLabels[selectedChannel] ?? selectedChannel}
          </label>
          <textarea
            id="reply-input"
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
            }}
            placeholder={`Type a reply via ${channelLabels[selectedChannel] ?? selectedChannel}… (Enter to send)`}
            rows={2}
            className="flex-1 resize-none border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          <button
            onClick={send}
            disabled={sending || !replyText.trim()}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 self-end flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            Send
          </button>
        </div>
      </div>
    </div>
  )
}

function MessageBubble({ msg }: { msg: Message }) {
  const isAgent = msg.sender_type === 'agent'
  const isSystem = msg.sender_type === 'system'

  if (isSystem) {
    return (
      <div className="flex justify-center my-1">
        <div className="max-w-sm px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-center">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-0.5">Auto-reply</p>
          <p className="text-xs text-gray-500 italic">{msg.content}</p>
          <span className="text-[10px] text-gray-300 mt-0.5 block">
            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className={`flex ${isAgent ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-xs lg:max-w-md xl:max-w-lg px-3 py-2 rounded-2xl text-sm ${
        isAgent
          ? 'bg-primary-600 text-white rounded-br-sm'
          : 'bg-white text-gray-900 shadow-sm rounded-bl-sm'
      }`}>
        <p className="whitespace-pre-wrap">{msg.content}</p>
        <div className={`flex items-center gap-1 mt-1 ${isAgent ? 'justify-end' : 'justify-start'}`}>
          <span className={`text-xs ${isAgent ? 'text-primary-200' : 'text-gray-400'}`}>
            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          <span className={`flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded ${
            isAgent ? 'bg-primary-700 text-primary-200' : 'bg-gray-100 text-gray-500'
          }`}>
            {channelIcons[msg.channel]}
            {channelLabels[msg.channel] ?? msg.channel}
          </span>
        </div>
      </div>
    </div>
  )
}
