'use client'

import { useState } from 'react'
import { CalendarDays, ChevronDown, Plus, WalletCards } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { createRecurringIncome } from './actions'

type Props = {
  currency: string
}

const frequencies = [
  { value: 'monthly', label: 'Mensal' },
  { value: 'quarterly', label: 'Trimestral' },
  { value: 'yearly', label: 'Anual' },
] as const

export function RecurringIncomeCreateDialog({ currency }: Props) {
  const [open, setOpen] = useState(false)
  const [frequency, setFrequency] = useState<(typeof frequencies)[number]['value']>('monthly')
  const today = new Date().toISOString().slice(0, 10)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="inline-flex min-h-10 items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[hsl(var(--primary))] px-4 text-sm font-medium text-[hsl(var(--primary-foreground))] transition-opacity hover:opacity-90">
        <Plus className="size-4" aria-hidden="true" /> Novo
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo ganho recorrente</DialogTitle>
        </DialogHeader>
        <form action={createRecurringIncome} className="mt-5 space-y-4">
          <label className="grid gap-2 text-sm font-medium">
            Nome
            <input name="name" required maxLength={120} placeholder="Salário" className="min-h-11 rounded-xl border bg-transparent px-3 font-normal outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]" />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium">
              Origem
              <input name="source" maxLength={120} placeholder="Empresa" className="min-h-11 rounded-xl border bg-transparent px-3 font-normal outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]" />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Valor
              <input name="amount" type="number" inputMode="decimal" min="0.01" step="0.01" required placeholder="0,00" className="min-h-11 rounded-xl border bg-transparent px-3 font-normal tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]" />
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2 text-sm font-medium">
              <span>Frequência</span>
              <Popover>
                <PopoverTrigger className="flex min-h-11 w-full items-center justify-between rounded-xl border px-3 font-normal hover:bg-[hsl(var(--surface-muted))]">
                  <span>{frequencies.find((item) => item.value === frequency)?.label}</span>
                  <ChevronDown className="size-4 text-[hsl(var(--muted-foreground))]" />
                </PopoverTrigger>
                <PopoverContent className="w-48">
                  {frequencies.map((item) => (
                    <button key={item.value} type="button" className={`flex w-full items-center rounded-lg px-3 py-2 text-left text-sm ${frequency === item.value ? 'bg-[hsl(var(--surface-muted))] font-medium' : 'hover:bg-[hsl(var(--surface-muted))]'}`} onClick={() => setFrequency(item.value)}>
                      {item.label}
                    </button>
                  ))}
                </PopoverContent>
              </Popover>
              <input type="hidden" name="frequency" value={frequency} />
            </div>
            <label className="grid gap-2 text-sm font-medium">
              Próxima entrada
              <span className="relative">
                <CalendarDays className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
                <input name="nextIncomeDate" type="date" defaultValue={today} required className="min-h-11 w-full rounded-xl border bg-transparent pl-9 pr-3 font-normal outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]" />
              </span>
            </label>
          </div>
          <div className="flex min-h-11 items-center gap-2 rounded-xl border px-3 text-sm">
            <WalletCards className="size-4 text-[hsl(var(--muted-foreground))]" />
            <span>{currency}</span>
            <input type="hidden" name="currencyCode" value={currency} />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit">Guardar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
