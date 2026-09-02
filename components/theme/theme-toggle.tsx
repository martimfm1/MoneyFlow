'use client'

import { useEffect, useState } from 'react'
import { Monitor, Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'

type Theme = 'system' | 'light' | 'dark'

const STORAGE_KEY = 'moneyflow-theme'

function getStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'system'
  const value = window.localStorage.getItem(STORAGE_KEY)
  return value === 'light' || value === 'dark' || value === 'system'
    ? value
    : 'system'
}

function getSystemTheme(): 'light' | 'dark' {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

function applyTheme(theme: Theme) {
  const resolved = theme === 'system' ? getSystemTheme() : theme
  document.documentElement.dataset.theme = resolved
  document.documentElement.style.colorScheme = resolved
}

const nextTheme: Record<Theme, Theme> = {
  system: 'light',
  light: 'dark',
  dark: 'system',
}

const labels: Record<Theme, string> = {
  system: 'Tema do sistema',
  light: 'Tema claro',
  dark: 'Tema escuro',
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() => getStoredTheme())

  useEffect(() => {
    applyTheme(theme)

    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      if (theme === 'system') applyTheme('system')
    }

    media.addEventListener('change', handleChange)
    return () => media.removeEventListener('change', handleChange)
  }, [theme])

  function handleToggle() {
    const next = nextTheme[theme]
    setTheme(next)
    window.localStorage.setItem(STORAGE_KEY, next)
  }

  const Icon = theme === 'dark' ? Moon : theme === 'light' ? Sun : Monitor

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={handleToggle}
      aria-label={`${labels[theme]}. Alterar tema`}
      title={`${labels[theme]} · clicar para alterar`}
    >
      <Icon className="size-4" aria-hidden="true" />
      <span className="sr-only">{labels[theme]}</span>
    </Button>
  )
}
