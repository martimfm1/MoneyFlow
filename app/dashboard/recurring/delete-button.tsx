'use client'

import { Trash2 } from 'lucide-react'
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { deleteRecurringExpense } from './actions'

export function DeleteRecurringExpenseButton({ id, name }: { id: string; name: string }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger render={<Button variant="destructive" size="icon" aria-label={`Apagar ${name}`} />}>
        <Trash2 className="size-4" />
      </AlertDialogTrigger>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogTitle>Apagar despesa?</AlertDialogTitle>
          <AlertDialogDescription>“{name}” será removida.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <form action={deleteRecurringExpense}>
            <input type="hidden" name="id" value={id} />
            <Button type="submit" variant="destructive">Apagar</Button>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
