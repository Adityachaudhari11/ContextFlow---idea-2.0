import { create } from 'zustand'
import type { Agent } from '../types'

interface AuthState {
  token: string | null
  agent: Agent | null
  setAuth: (token: string, agent: Agent) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('token'),
  agent: null,
  setAuth: (token, agent) => {
    localStorage.setItem('token', token)
    set({ token, agent })
  },
  logout: () => {
    localStorage.removeItem('token')
    set({ token: null, agent: null })
  },
}))
