'use client'

import { useEffect, useState } from 'react'
import { Laptop, Moon, Palette, Sun } from 'lucide-react'
import type { MoneyFlowLocale } from '@/lib/i18n'

type Theme = 'system' | 'light' | 'dark'
type Accent = 'mint' | 'blue' | 'violet' | 'amber'

const THEME_KEY = 'moneyflow-theme'
const ACCENT_KEY = 'moneyflow-accent'

const themeOptions: Record<MoneyFlowLocale, Array<{ value: Theme; label: string }>> = {
  'pt-PT': [
    { value: 'light', label: 'Claro' },
    { value: 'dark', label: 'Escuro' },
    { value: 'system', label: 'Sistema' },
  ],
  en: [
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
    { value: 'system', label: 'System' },
  ],
}

const accentOptions: Array<{ value: Accent; color: string; label: Record<MoneyFlowLocale, string> }> = [
  { value: 'mint', color: '#55d9a2', label: { 'pt-PT': 'Menta', en: 'Mint' } },
  { value: 'blue', color: '#68b7ef', label: { 'pt-PT': 'Azul', en: 'Blue' } },
  { value: 'violet', color: '#b497f4', label: { 'pt-PT': 'Violeta', en: 'Violet' } },
  { value: 'amber', color: '#edb955', label: { 'pt-PT': 'Âmbar', en: 'Amber' } },
]

function resolveTheme(theme: Theme): 'light' | 'dark' {
  if (theme !== 'system') return theme
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyPreferences(theme: Theme, accent: Accent) {
  const resolved = resolveTheme(theme)
  document.documentElement.dataset.theme = resolved
  document.documentElement.dataset.accent = accent
  document.documentElement.style.colorScheme = resolved
}

function readTheme(): Theme {
  const value = window.localStorage.getItem(THEME_KEY)
  return value === 'light' || value === 'dark' || value === 'system' ? value : 'system'
}

function readAccent(): Accent {
  const value = window.localStorage.getItem(ACCENT_KEY)
  return value === 'blue' || value === 'violet' || value === 'amber' || value === 'mint' ? value : 'mint'
}

export function ThemeToggle({ locale }: { locale: MoneyFlowLocale }) {
  const [theme, setTheme] = useState<Theme>('system')
  const [accent, setAccent] = useState<Accent>('mint')
  const isEnglish = locale === 'en'

  useEffect(() => {
    const storedTheme = readTheme()
    const storedAccent = readAccent()
    setTheme(storedTheme)
    setAccent(storedAccent)
    applyPreferences(storedTheme, storedAccent)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    applyPreferences(theme, accent)
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      if (theme === 'system') applyPreferences('system', accent)
    }
    media.addEventListener('change', handleChange)
    return () => media.removeEventListener('change', handleChange)
  }, [theme, accent])

  function changeTheme(value: Theme) {
    setTheme(value)
    window.localStorage.setItem(THEME_KEY, value)
  }

  function changeAccent(value: Accent) {
    setAccent(value)
    window.localStorage.setItem(ACCENT_KEY, value)
  }

  return (
    <div className="w-full space-y-5">
      <div>
        <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.13em] text-muted-foreground">
          <Sun className="size-3.5" aria-hidden="true" />
          {isEnglish ? 'Interface mode' : 'Modo da interface'}
        </div>
        <div className="grid grid-cols-3 gap-1 rounded-xl border bg-muted/60 p-1" role="group" aria-label={isEnglish ? 'Interface mode' : 'Modo da interface'}>
          {themeOptions[locale].map((option) => {
            const selected = theme === option.value
            const Icon = option.value === 'light' ? Sun : option.value === 'dark' ? Moon : Laptop
            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={selected}
                onClick={() => changeTheme(option.value)}
                className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-2 text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${selected ? 'bg-card text-foreground shadow-sm ring-1 ring-border' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <Icon className="size-3.5" aria-hidden="true" />
                {option.label}
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.13em] text-muted-foreground">
          <Palette className="size-3.5" aria-hidden="true" />
          {isEnglish ? 'Accent colour' : 'Cor de destaque'}
        </div>
        <div className="flex flex-wrap gap-2">
          {accentOptions.map((option) => {
            const selected = accent === option.value
            return (
              <button
                key={option.value}
                type="button"
                aria-label={option.label[locale]}
                aria-pressed={selected}
                onClick={() => changeAccent(option.value)}
                className={`inline-flex min-h-10 items-center gap-2 rounded-full border px-3 text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${selected ? 'border-primary/60 bg-primary/10 text-foreground ring-1 ring-primary/30' : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground'}`}
              >
                <span className="size-3 rounded-full ring-2 ring-background" style={{ backgroundColor: option.color }} />
                {option.label[locale]}
              </button>
            )
          })}
        </div>
      </div>
      <p className="text-xs leading-5 text-muted-foreground">
        {isEnglish
          ? 'Your choices are saved on this device and apply across MoneyFlow.'
          : 'As tuas escolhas ficam guardadas neste dispositivo e aplicam-se a todo o MoneyFlow.'}
      </p>
    </div>
  )
}
