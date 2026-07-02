import { useState, useEffect, useCallback } from 'react'

export type ThemeName = 'teal' | 'ocean' | 'violet' | 'sunset' | 'rose'

const STORAGE_KEY = 'cf-theme'

function getInitialTheme(): ThemeName {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored && ['teal', 'ocean', 'violet', 'sunset', 'rose'].includes(stored)) {
      return stored as ThemeName
    }
  } catch {}
  return 'teal'
}

// Apply theme to <html> immediately (before React hydrates)
function applyTheme(name: ThemeName) {
  document.documentElement.setAttribute('data-theme', name)
  try { localStorage.setItem(STORAGE_KEY, name) } catch {}
}

// Initialize on load
applyTheme(getInitialTheme())

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeName>(getInitialTheme)

  const setTheme = useCallback((name: ThemeName) => {
    applyTheme(name)
    setThemeState(name)
  }, [])

  // Sync across tabs
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        const t = e.newValue as ThemeName
        document.documentElement.setAttribute('data-theme', t)
        setThemeState(t)
      }
    }
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }, [])

  return { theme, setTheme }
}

export const themeOptions: { name: ThemeName; label: string; swatch: string }[] = [
  { name: 'teal',   label: 'Teal',    swatch: '#14b8a6' },
  { name: 'ocean',  label: 'Ocean',   swatch: '#3b82f6' },
  { name: 'violet', label: 'Violet',  swatch: '#8b5cf6' },
  { name: 'sunset', label: 'Sunset',  swatch: '#f59e0b' },
  { name: 'rose',   label: 'Rose',    swatch: '#f43f5e' },
]
