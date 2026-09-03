'use client'

import { useState } from 'react'
import { CalendarIcon, ChevronDown, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { AccountCombobox, type AccountOption } from '@/components/account-combobox'
import { createRecurringExpense } from './actions'

const frequencies = [
  { value: 'monthly', label: 'Mensal' },
  { value: 'quarterly', label: 'Trimestral' },
  { value: 'yearly', label: 'Anual' },
] as const

type Props = { currency: string; accounts: AccountOption[] }

export function RecurringExpenseCreateDialog({ currency, accounts }: Props) {
  const [open, setOpen] = useState(false)
  const [frequency, setFrequency] = useState<(typeof frequencies)[number]['value']>('monthly')
  const [date, setDate] = useState(new Date())
  const [dateOpen, setDateOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus className="size-4" /> Nova
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>Nova despesa recorrente</DialogTitle></DialogHeader>
        <form action={createRecurringExpense} className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium">Nome<Input name="name" required maxLength={120} placeholder="Netflix" /></label>
            <label className="grid gap-2 text-sm font-medium">Fornecedor<Input name="provider" maxLength={120} placeholder="Empresa" /></label>
          </div>
          <label className="grid gap-2 text-sm font-medium">Valor<Input name="amount" type="text" inputMode="decimal" required placeholder="0,00" /></label>
          <AccountCombobox name="accountId" accounts={accounts} required />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2 text-sm font-medium">
              <span>Frequência</span>
              <Popover>
                <PopoverTrigger render={<Button variant="outline" className="w-full justify-between font-normal" />}>
                  {frequencies.find((item) => item.value === frequency)?.label}<ChevronDown className="size-4 opacity-60" />
                </PopoverTrigger>
                <PopoverContent className="w-48 p-1">
                  {frequencies.map((item) => <Button key={item.value} type="button" variant={frequency === item.value ? 'secondary' : 'ghost'} className="w-full justify-start" onClick={() => setFrequency(item.value)}>{item.label}</Button>)}
                </PopoverContent>
              </Popover>
              <input type="hidden" name="frequency" value={frequency} />
            </div>
            <div className="grid gap-2 text-sm font-medium">
              <span>Próxima cobrança</span>
              <Popover open={dateOpen} onOpenChange={setDateOpen}>
                <PopoverTrigger render={<Button variant="outline" className="w-full justify-start font-normal" />}>
                  <CalendarIcon className="size-4" /> {date.toLocaleDateString('pt-PT')}
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={date} onSelect={(next) => { if (next) { setDate(next); setDateOpen(false) } }} />
                </PopoverContent>
              </Popover>
              <input type="hidden" name="nextDueDate" value={date.toISOString().slice(0, 10)} />
            </div>
          </div>
          <Separator />
          <input type="hidden" name="currencyCode" value={currency} />
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={!accounts.length}>Guardar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
