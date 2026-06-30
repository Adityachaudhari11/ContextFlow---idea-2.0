import { create } from 'zustand'
import type { Conversation, Message, AISummary } from '../types'

interface ConversationState {
  conversations: Conversation[]
  activeId: string | null
  messages: Record<string, Message[]>
  summaries: Record<string, AISummary>
  setConversations: (list: Conversation[]) => void
  setActive: (id: string) => void
  setMessages: (id: string, msgs: Message[]) => void
  appendMessage: (id: string, msg: Message) => void
  setSummary: (id: string, summary: AISummary) => void
  updateConversationOneLine: (id: string, one_liner: string, sentiment: string) => void
  removeConversation: (id: string) => void
  updateCustomerPriority: (customerId: string, isPriority: boolean, priorityTag?: string | null, preferences?: string | null) => void
}

export const useConversationStore = create<ConversationState>((set) => ({
  conversations: [],
  activeId: null,
  messages: {},
  summaries: {},
  setConversations: (list) => set({ conversations: list }),
  setActive: (id) => set({ activeId: id }),
  setMessages: (id, msgs) => set((s) => ({ messages: { ...s.messages, [id]: msgs } })),
  appendMessage: (id, msg) =>
    set((s) => ({
      messages: { ...s.messages, [id]: [...(s.messages[id] ?? []), msg] },
      conversations: s.conversations.map((c) =>
        c.id === id ? { ...c, last_message_at: msg.created_at } : c
      ),
    })),
  setSummary: (id, summary) => set((s) => ({ summaries: { ...s.summaries, [id]: summary } })),
  updateConversationOneLine: (id, one_liner, sentiment) =>
    set((s) => ({
      conversations: s.conversations.map((c) =>
        c.id === id ? { ...c, one_liner, sentiment } : c
      ),
    })),
  removeConversation: (id) =>
    set((s) => ({
      conversations: s.conversations.filter((c) => c.id !== id),
      activeId: s.activeId === id ? null : s.activeId,
    })),
  updateCustomerPriority: (customerId, isPriority, priorityTag, preferences) =>
    set((s) => ({
      conversations: s.conversations.map((c) =>
        c.customer_id === customerId
          ? {
              ...c,
              customer_is_priority: isPriority,
              customer_priority_tag: priorityTag !== undefined ? priorityTag : c.customer_priority_tag,
              customer_preferences: preferences !== undefined ? preferences : c.customer_preferences,
            }
          : c
      ),
    })),
}))
