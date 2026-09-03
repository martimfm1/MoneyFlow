'use client'

import { Trash2 } from 'lucide-react'
import { useActionState } from 'react'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
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
      <AlertDialog>
        <AlertDialogTrigger
          render={
            <Button
              variant="destructive"
              size="icon-sm"
              aria-label={`Apagar ${name}`}
              title="Apagar conta"
            />
          }
        >
          <Trash2 className="size-4" />
        </AlertDialogTrigger>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Apagar conta?</AlertDialogTitle>
            <AlertDialogDescription>
              “{name}” só pode ser apagada se não tiver movimentos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <form action={formAction}>
              <input type="hidden" name="id" value={id} />
              <Button type="submit" variant="destructive" disabled={isPending}>
                {isPending ? 'A apagar…' : 'Apagar'}
              </Button>
            </form>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {state.error ? (
        <p
          role="alert"
          aria-live="assertive"
          className="max-w-xs text-xs text-destructive"
        >
          {state.error}
        </p>
      ) : null}
    </div>
  )
}
