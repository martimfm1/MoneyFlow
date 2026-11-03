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
import { useState } from 'react'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import type { MoneyFlowLocale } from '@/lib/i18n'

const actions = [
  {
    href: '/dashboard/transactions/new?type=expense',
    label: { 'pt-PT': 'Despesa', en: 'Expense' },
    icon: ArrowUpRight,
    tone: 'bg-[hsl(var(--danger)/0.1)] text-[hsl(var(--danger))]',
  },
  {
    href: '/dashboard/transactions/new?type=income',
    label: { 'pt-PT': 'Receita', en: 'Income' },
    icon: ArrowDownLeft,
    tone: 'bg-[hsl(var(--success)/0.1)] text-[hsl(var(--success))]',
  },
  {
    href: '/dashboard/recurring/income#novo-ganho',
    label: { 'pt-PT': 'Rendimento recorrente', en: 'Recurring income' },
    icon: CalendarClock,
    tone: 'bg-[hsl(var(--success)/0.1)] text-[hsl(var(--success))]',
  },
  {
    href: '/dashboard/goals/new',
    label: { 'pt-PT': 'Objetivo', en: 'Goal' },
    icon: Target,
    tone: 'bg-[hsl(var(--surface-muted))] text-[hsl(var(--foreground))]',
  },
] as const

export function QuickAdd({ locale }: { locale: MoneyFlowLocale }) {
  const [open, setOpen] = useState(false)
  const isEnglish = locale === 'en'

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        showCloseButton={false}
        className="top-auto bottom-[calc(4.5rem+env(safe-area-inset-bottom))] left-1/2 w-[calc(100%-1.5rem)] max-w-sm -translate-x-1/2 translate-y-0 gap-2 rounded-[1.5rem] p-3 shadow-2xl motion-safe:animate-in motion-safe:slide-in-from-bottom-3 lg:hidden"
      >
        <DialogHeader className="flex-row items-center justify-between gap-3 px-2 pb-1">
          <div>
            <DialogTitle className="text-sm font-semibold">
              {isEnglish ? 'Add to MoneyFlow' : 'Adicionar ao MoneyFlow'}
            </DialogTitle>
            <DialogDescription className="sr-only">
              {isEnglish
                ? 'Choose what you would like to add.'
                : 'Escolhe o que pretendes adicionar.'}
            </DialogDescription>
          </div>
          <DialogClose
            render={
              <button
                type="button"
                aria-label={isEnglish ? 'Close actions' : 'Fechar ações'}
                className="inline-flex size-11 items-center justify-center rounded-full text-[hsl(var(--muted-foreground))] transition-colors hover:bg-[hsl(var(--brand-green)/0.08)] hover:text-[hsl(var(--foreground))]"
              />
            }
          >
            <X className="size-4" aria-hidden="true" />
          </DialogClose>
        </DialogHeader>
        <div className="grid gap-1">
          {actions.map(({ href, label, icon: Icon, tone }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className="flex min-h-14 items-center gap-3 rounded-xl px-3 font-medium transition-colors hover:bg-[hsl(var(--surface-muted))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] active:bg-[hsl(var(--surface-muted))]"
            >
              <span
                className={`flex size-10 shrink-0 items-center justify-center rounded-full ${tone}`}
              >
                <Icon className="size-4" aria-hidden="true" />
              </span>
              <span>{label[locale]}</span>
            </Link>
          ))}
        </div>
      </DialogContent>

      <DialogTrigger
        render={
          <button
            type="button"
            aria-expanded={open}
            aria-haspopup="dialog"
            aria-label={
              open
                ? isEnglish
                  ? 'Close add menu'
                  : 'Fechar adicionar'
                : isEnglish
                  ? 'Add'
                  : 'Adicionar'
            }
            className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom))] right-4 z-40 inline-flex size-14 items-center justify-center rounded-full bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] shadow-lg transition-transform hover:shadow-xl active:scale-95 lg:hidden"
          />
        }
      >
        {open ? (
          <X className="size-5" aria-hidden="true" />
        ) : (
          <Plus className="size-5" aria-hidden="true" />
        )}
      </DialogTrigger>
    </Dialog>
  )
}
