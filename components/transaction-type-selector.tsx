'use client'

import { ArrowDownLeft, ArrowUpRight } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'

export function TransactionTypeSelector({ defaultType }: { defaultType: 'income' | 'expense' }) {
  const [type, setType] = useState(defaultType)
  return (
    <div className="grid grid-cols-2 gap-2">
      <input type="hidden" name="transactionType" value={type} />
      <Button type="button" variant={type === 'expense' ? 'secondary' : 'outline'} className="h-10" onClick={() => setType('expense')}><ArrowUpRight className="size-4" /> Despesa</Button>
      <Button type="button" variant={type === 'income' ? 'secondary' : 'outline'} className="h-10" onClick={() => setType('income')}><ArrowDownLeft className="size-4" /> Receita</Button>
    </div>
  )
}
