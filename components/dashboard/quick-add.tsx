'use client'

import Link from 'next/link'
import { ArrowDownLeft, ArrowUpRight, Plus, Target, X } from 'lucide-react'
import { useEffect, useState } from 'react'

export function QuickAdd() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open])

  return (
    <>
      {open ? (
        <>
          <button type="button" aria-label="Fechar ações rápidas" onClick={() => setOpen(false)} className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px] lg:hidden" />
          <section role="dialog" aria-modal="true" aria-label="Adicionar" className="fixed inset-x-3 bottom-[5.75rem] z-50 mx-auto max-w-sm rounded-[1.5rem] border bg-[hsl(var(--surface))] p-3 shadow-2xl lg:hidden">
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-[hsl(var(--border))]" />
            <div className="grid gap-2">
              <Link href="/dashboard/transactions/new?type=expense" onClick={() => setOpen(false)} className="flex min-h-14 items-center gap-3 rounded-xl border px-4 font-medium transition-colors hover:bg-[hsl(var(--surface-muted))]"><span className="flex size-9 items-center justify-center rounded-full bg-[hsl(var(--danger)/0.1)]"><ArrowUpRight className="size-4" /></span><span>Despesa</span></Link>
              <Link href="/dashboard/transactions/new?type=income" onClick={() => setOpen(false)} className="flex min-h-14 items-center gap-3 rounded-xl border px-4 font-medium transition-colors hover:bg-[hsl(var(--surface-muted))]"><span className="flex size-9 items-center justify-center rounded-full bg-[hsl(var(--success)/0.1)]"><ArrowDownLeft className="size-4" /></span><span>Receita</span></Link>
              <Link href="/dashboard/goals/new" onClick={() => setOpen(false)} className="flex min-h-14 items-center gap-3 rounded-xl border px-4 font-medium transition-colors hover:bg-[hsl(var(--surface-muted))]"><span className="flex size-9 items-center justify-center rounded-full bg-[hsl(var(--surface-muted))]"><Target className="size-4" /></span><span>Objetivo</span></Link>
            </div>
          </section>
        </>
      ) : null}
      <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-label={open ? 'Fechar adicionar' : 'Adicionar'} className="fixed bottom-[5.9rem] right-4 z-30 inline-flex size-12 items-center justify-center rounded-full bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] shadow-lg transition-transform hover:scale-105 active:scale-95 lg:hidden">
        {open ? <X className="size-5" /> : <Plus className="size-5" />}
      </button>
    </>
  )
}
