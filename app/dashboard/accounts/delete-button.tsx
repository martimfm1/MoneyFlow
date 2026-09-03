'use client'

import { Trash2 } from 'lucide-react'
import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { deleteAccount, type AccountActionState } from './actions'

const initialState: AccountActionState = {}

export function DeleteAccountButton({
  id,
  name,
}: {
  id: string
  name: string
}) {
  const [state, formAction, isPending] = useActionState(
    deleteAccount,
    initialState,
  )

  return (
    <div className="grid gap-2">
      <form
        action={formAction}
        onSubmit={(event) => {
          if (
            !window.confirm(
              `Apagar a conta “${name}”? Esta ação não pode ser anulada.`,
            )
          ) {
            event.preventDefault()
          }
        }}
      >
        <input type="hidden" name="id" value={id} />
        <Button
          type="submit"
          size="sm"
          variant="ghost"
          disabled={isPending}
          aria-label={`Apagar ${name}`}
          title="Apagar conta"
          className="text-[hsl(var(--danger))] hover:text-[hsl(var(--danger))] disabled:opacity-60"
        >
          <Trash2 className="size-4" aria-hidden="true" />
          {isPending ? 'A apagar…' : 'Apagar'}
        </Button>
      </form>
      {state.error ? (
        <p
          role="alert"
          aria-live="assertive"
          className="max-w-xs text-xs text-[hsl(var(--danger))]"
        >
          {state.error}
        </p>
      ) : null}
    </div>
  )
}
