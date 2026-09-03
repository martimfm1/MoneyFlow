'use client'

import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { deleteRecurringExpense } from './actions'

export function DeleteRecurringExpenseButton({
  id,
  name,
}: {
  id: string
  name: string
}) {
  return (
    <form
      action={deleteRecurringExpense}
      onSubmit={(event) => {
        if (!window.confirm(`Apagar “${name}”?`)) event.preventDefault()
      }}
    >
      <input type="hidden" name="id" value={id} />
      <Button
        type="submit"
        variant="ghost"
        size="icon"
        aria-label={`Apagar ${name}`}
        className="text-[hsl(var(--danger))] hover:text-[hsl(var(--danger))]"
      >
        <Trash2 className="size-4" />
      </Button>
    </form>
  )
}
