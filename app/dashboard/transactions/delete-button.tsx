'use client'

import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { deleteTransaction } from './actions'

export function DeleteTransactionButton({
  id,
  label,
}: {
  id: string
  label: string
}) {
  return (
    <form
      action={deleteTransaction}
      onSubmit={(event) => {
        if (
          !window.confirm(
            `Apagar “${label}”? O saldo da conta será atualizado.`,
          )
        )
          event.preventDefault()
      }}
    >
      <input type="hidden" name="id" value={id} />
      <Button
        type="submit"
        size="icon"
        variant="ghost"
        aria-label={`Apagar ${label}`}
        title="Apagar movimento"
        className="text-[hsl(var(--danger))] hover:text-[hsl(var(--danger))]"
      >
        <Trash2 className="size-4" aria-hidden="true" />
      </Button>
    </form>
  )
}
