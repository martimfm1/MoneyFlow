'use client'

import { ArrowDownLeft, ArrowUpRight } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'

export function TransactionTypeSelector({
  defaultType,
}: {
  defaultType: 'income' | 'expense'
}) {
  const [type, setType] = useState(defaultType)

  return (
    <fieldset className="grid gap-2 border-0 p-0">
      <legend className="text-sm font-medium">Tipo de movimento</legend>
      <input type="hidden" name="transactionType" value={type} />
      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant={type === 'expense' ? 'secondary' : 'outline'}
          aria-pressed={type === 'expense'}
          className="min-h-11"
          onClick={() => setType('expense')}
        >
          <ArrowUpRight className="size-4" aria-hidden="true" />
          Despesa
        </Button>
        <Button
          type="button"
          variant={type === 'income' ? 'secondary' : 'outline'}
          aria-pressed={type === 'income'}
          className="min-h-11"
          onClick={() => setType('income')}
        >
          <ArrowDownLeft className="size-4" aria-hidden="true" />
          Receita
        </Button>
      </div>
    </fieldset>
  )
}
