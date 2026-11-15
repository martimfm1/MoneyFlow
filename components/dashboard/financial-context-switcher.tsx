'use client'

import { useState } from 'react'
import { Check, ChevronDown, Layers3 } from 'lucide-react'
import type { FinancialContextSelection } from '@/lib/financial-context'
import { switchFinancialContext } from '@/app/dashboard/actions'

type Props = {
  active: FinancialContextSelection
  locale: 'pt-PT' | 'en'
}

export function FinancialContextSwitcher({ active, locale }: Props) {
  const isEnglish = locale === 'en'
  const [isChanging, setIsChanging] = useState(false)
  const currentLabel =
    active === 'silentra'
      ? 'Silentra'
      : active === 'general'
        ? isEnglish
          ? 'Overview'
          : 'Geral'
        : isEnglish
          ? 'Personal'
          : 'Pessoal'

  return (
    <div className="flex min-w-0 items-center gap-2">
      <span className="hidden size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary sm:inline-flex">
        <Layers3 className="size-4" aria-hidden="true" />
      </span>
      <form action={switchFinancialContext} className="relative min-w-0">
        <label className="sr-only" htmlFor="financial-context-switcher">
          {isEnglish ? 'Financial space' : 'Espaço financeiro'}
        </label>
        <select
          id="financial-context-switcher"
          name="slug"
          defaultValue={active}
          onChange={(event) => {
            setIsChanging(true)
            event.currentTarget.form?.requestSubmit()
          }}
          className="min-h-10 max-w-[52vw] appearance-none rounded-xl border border-border/80 bg-card/80 py-2 pl-3 pr-9 text-sm font-semibold text-foreground shadow-sm outline-none transition-all hover:border-primary/35 focus-visible:border-primary/50 focus-visible:ring-2 focus-visible:ring-ring/30 sm:max-w-56"
        >
          <option value="personal">{isEnglish ? 'Personal' : 'Pessoal'}</option>
          <option value="silentra">Silentra</option>
          <option value="general">{isEnglish ? 'Overview' : 'Geral'}</option>
        </select>
        <span className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-muted-foreground">
          {isChanging ? (
            <Check className="size-3.5 text-primary" aria-hidden="true" />
          ) : (
            <ChevronDown className="size-3.5" aria-hidden="true" />
          )}
        </span>
        <span className="sr-only" aria-live="polite">
          {isChanging
            ? (isEnglish ? 'Switching to ' : 'A mudar para ') + currentLabel
            : ''}
        </span>
      </form>
    </div>
  )
}
