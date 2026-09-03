'use client'

import { useState } from 'react'
import { ChevronDown, Plus } from 'lucide-react'
import {
  AccountCombobox,
  type AccountOption,
} from '@/components/account-combobox'
import { FormDatePicker } from '@/components/form-date-picker'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { createRecurringIncome } from './actions'

type Props = { currency: string; accounts: AccountOption[] }
const frequencies = [
  { value: 'monthly', label: 'Mensal' },
  { value: 'quarterly', label: 'Trimestral' },
  { value: 'yearly', label: 'Anual' },
] as const

export function RecurringIncomeCreateDialog({ currency, accounts }: Props) {
  const [open, setOpen] = useState(false)
  const [frequency, setFrequency] =
    useState<(typeof frequencies)[number]['value']>('monthly')

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus className="size-4" /> Novo
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Novo ganho recorrente</DialogTitle>
        </DialogHeader>
        <form action={createRecurringIncome} className="grid gap-4">
          <label className="grid gap-2 text-sm font-medium">
            Nome
            <Input name="name" required maxLength={120} placeholder="Salário" />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium">
              Origem
              <Input name="source" maxLength={120} placeholder="Empresa" />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Valor
              <Input
                name="amount"
                type="text"
                inputMode="decimal"
                required
                placeholder="0,00"
              />
            </label>
          </div>
          <AccountCombobox name="accountId" accounts={accounts} required />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2 text-sm font-medium">
              <span>Frequência</span>
              <Popover>
                <PopoverTrigger
                  render={
                    <Button
                      variant="outline"
                      className="w-full justify-between font-normal"
                    />
                  }
                >
                  {frequencies.find((item) => item.value === frequency)?.label}
                  <ChevronDown className="size-4 opacity-60" />
                </PopoverTrigger>
                <PopoverContent className="w-48 p-1">
                  {frequencies.map((item) => (
                    <Button
                      key={item.value}
                      type="button"
                      variant={frequency === item.value ? 'secondary' : 'ghost'}
                      className="w-full justify-start"
                      onClick={() => setFrequency(item.value)}
                    >
                      {item.label}
                    </Button>
                  ))}
                </PopoverContent>
              </Popover>
              <input type="hidden" name="frequency" value={frequency} />
            </div>
            <FormDatePicker
              name="nextIncomeDate"
              defaultValue={new Date().toISOString().slice(0, 10)}
              label="Próxima entrada"
            />
          </div>
          <Separator />
          <input type="hidden" name="currencyCode" value={currency} />
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={!accounts.length}>
              Guardar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
