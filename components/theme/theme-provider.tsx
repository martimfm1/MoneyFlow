'use client'

import { useEffect } from 'react'

type Theme = 'system' | 'light' | 'dark'
type Accent = 'mint' | 'blue' | 'violet' | 'amber'

const THEME_KEY = 'moneyflow-theme'
const ACCENT_KEY = 'moneyflow-accent'

function readTheme(): Theme {
  const value = window.localStorage.getItem(THEME_KEY)
  return value === 'light' || value === 'dark' || value === 'system'
    ? value
    : 'system'
}

function readAccent(): Accent {
  const value = window.localStorage.getItem(ACCENT_KEY)
  return value === 'blue' ||
    value === 'violet' ||
    value === 'amber' ||
    value === 'mint'
    ? value
    : 'mint'
}

function applyThemePreferences() {
  const theme = readTheme()
  const accent = readAccent()
  const resolved =
    theme === 'system'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      : theme

  document.documentElement.dataset.theme = resolved
  document.documentElement.dataset.accent = accent
  document.documentElement.style.colorScheme = resolved
}

export function ThemeProvider() {
  useEffect(() => {
    applyThemePreferences()

    const handlePreferenceChange = () => applyThemePreferences()
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const handleSystemChange = () => {
      if (readTheme() === 'system') applyThemePreferences()
    }

    window.addEventListener('storage', handlePreferenceChange)
    window.addEventListener(
      'moneyflow-preferences-change',
      handlePreferenceChange,
    )
    media.addEventListener('change', handleSystemChange)

    return () => {
      window.removeEventListener('storage', handlePreferenceChange)
      window.removeEventListener(
        'moneyflow-preferences-change',
        handlePreferenceChange,
      )
      media.removeEventListener('change', handleSystemChange)
    }
  }, [])

  return null
}
