'use client'

import Link from 'next/link'
import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarClock,
  Plus,
  Target,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'

const actions = [
  {
    href: '/dashboard/transactions/new?type=expense',
    label: 'Despesa',
    icon: ArrowUpRight,
    tone: 'bg-[hsl(var(--danger)/0.1)] text-[hsl(var(--danger))]',
  },
  {
    href: '/dashboard/transactions/new?type=income',
    label: 'Receita',
    icon: ArrowDownLeft,
    tone: 'bg-[hsl(var(--success)/0.1)] text-[hsl(var(--success))]',
  },
  {
    href: '/dashboard/recurring/income#novo-ganho',
    label: 'Ganho recorrente',
    icon: CalendarClock,
    tone: 'bg-[hsl(var(--success)/0.1)] text-[hsl(var(--success))]',
  },
  {
    href: '/dashboard/goals/new',
    label: 'Objetivo',
    icon: Target,
    tone: 'bg-[hsl(var(--surface-muted))] text-[hsl(var(--foreground))]',
  },
] as const

export function QuickAdd() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    const onPopState = () => setOpen(false)
    document.addEventListener('keydown', onKeyDown)
    window.addEventListener('popstate', onPopState)
    document.body.classList.add('overflow-hidden')
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('popstate', onPopState)
      document.body.classList.remove('overflow-hidden')
    }
  }, [open])

  return (
    <>
      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Fechar ações rápidas"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/25 backdrop-blur-[3px]"
          />
          <section
            role="dialog"
            aria-modal="true"
            aria-label="Adicionar"
            className="absolute inset-x-3 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] mx-auto max-w-sm rounded-[1.5rem] border bg-[hsl(var(--surface))] p-3 shadow-2xl animate-in slide-in-from-bottom-3"
          >
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-[hsl(var(--border))]" />
            <div className="grid gap-1">
              {actions.map(({ href, label, icon: Icon, tone }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className="flex min-h-14 items-center gap-3 rounded-xl px-3 font-medium transition-colors active:bg-[hsl(var(--surface-muted))]"
                >
                  <span
                    className={`flex size-10 items-center justify-center rounded-full ${tone}`}
                  >
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                  <span>{label}</span>
                </Link>
              ))}
            </div>
          </section>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label={open ? 'Fechar adicionar' : 'Adicionar'}
        className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom))] right-4 z-40 inline-flex size-14 items-center justify-center rounded-full bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] shadow-lg transition-transform active:scale-95 lg:hidden"
      >
        {open ? (
          <X className="size-5" aria-hidden="true" />
        ) : (
          <Plus className="size-5" aria-hidden="true" />
        )}
      </button>
    </>
  )
}
