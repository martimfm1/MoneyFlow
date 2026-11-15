'use client'

import Link from 'next/link'
import type { FinancialContextSelection } from '@/lib/financial-context'
import { switchFinancialContext } from '@/app/dashboard/actions'

type Props = {
  active: FinancialContextSelection
  locale: 'pt-PT' | 'en'
}

export function FinancialContextSwitcher({ active, locale }: Props) {
  const isEnglish = locale === 'en'

  return (
    <div className="flex min-w-0 items-center gap-2">
      <form action={switchFinancialContext} className="min-w-0">
        <label className="sr-only" htmlFor="financial-context-switcher">
          {isEnglish ? 'Financial space' : 'Espaço financeiro'}
        </label>
        <select
          id="financial-context-switcher"
          name="slug"
          defaultValue={active}
          onChange={(event) => event.currentTarget.form?.requestSubmit()}
          className="min-h-10 max-w-full rounded-xl border bg-[hsl(var(--surface))] px-3 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
        >
          <option value="personal">{isEnglish ? 'Personal' : 'Pessoal'}</option>
          <option value="silentra">Silentra</option>
          <option value="general">{isEnglish ? 'Overview' : 'Geral'}</option>
        </select>
      </form>
      {active !== 'general' ? (
        <Link
          href="/dashboard/overview"
          className="inline-flex min-h-10 shrink-0 items-center rounded-xl border px-3 text-sm font-medium text-[hsl(var(--muted-foreground))] transition-colors hover:bg-[hsl(var(--surface-muted))] hover:text-[hsl(var(--foreground))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
        >
          {isEnglish ? 'Overview' : 'Geral'}
        </Link>
      ) : null}
    </div>
  )
}
