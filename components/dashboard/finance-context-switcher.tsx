'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { setFinanceContext } from '@/app/dashboard/finance-context-actions'
import type { MoneyFlowLocale } from '@/lib/i18n'

type FinanceContext = 'personal' | 'silentra' | 'general'

type Props = {
  value: FinanceContext
  locale: MoneyFlowLocale
}

const labels = {
  'pt-PT': {
    label: 'Contexto financeiro',
    personal: 'Pessoal',
    silencra: 'Silentra',
    general: 'Geral',
    saving: 'A atualizar…',
    error: 'Não foi possível alterar o contexto.',
  },
  en: {
    label: 'Finance context',
    personal: 'Personal',
    silencra: 'Silentra',
    general: 'All finances',
    saving: 'Updating…',
    error: 'Could not change the context.',
  },
} as const

export function FinanceContextSwitcher({ value, locale }: Props) {
  const [selected, setSelected] = useState(value)
  const [message, setMessage] = useState('')
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const copy = labels[locale]

  function handleChange(nextValue: string) {
    if (
      nextValue !== 'personal' &&
      nextValue !== 'silentra' &&
      nextValue !== 'general'
    ) {
      return
    }

    setMessage('')
    startTransition(async () => {
      const result = await setFinanceContext(nextValue)
      if ('error' in result) {
        setMessage(result.error || copy.error)
        return
      }
      setSelected(nextValue)
      router.refresh()
    })
  }

  return (
    <div className="flex min-w-0 flex-col items-end gap-1">
      <label className="flex min-h-10 items-center gap-2 rounded-full border bg-[hsl(var(--surface)/0.92)] px-3 text-xs font-medium shadow-sm backdrop-blur">
        <span className="shrink-0 text-[hsl(var(--muted-foreground))]">
          {copy.label}
        </span>
        <select
          aria-label={copy.label}
          value={selected}
          disabled={isPending}
          onChange={(event) => handleChange(event.target.value)}
          className="max-w-[9rem] bg-transparent text-sm font-semibold outline-none disabled:opacity-60"
        >
          <option value="personal">{copy.personal}</option>
          <option value="silentra">{copy.silencra}</option>
          <option value="general">{copy.general}</option>
        </select>
        {isPending ? (
          <span className="text-[hsl(var(--muted-foreground))]">
            {copy.saving}
          </span>
        ) : null}
      </label>
      {message ? (
        <p role="alert" className="px-2 text-xs text-[hsl(var(--danger))]">
          {message}
        </p>
      ) : null}
    </div>
  )
}
