'use client'

import Link from 'next/link'
import { MoreHorizontal, Pause, Play, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { deleteRecurringIncome, toggleRecurringIncome } from './actions'

type Props = { id: string; name: string; isActive: boolean }

export function RecurringIncomeActionMenu({ id, name, isActive }: Props) {
  return (
    <AlertDialog>
      <Popover>
        <PopoverTrigger render={<Button variant="ghost" size="icon" aria-label={`Ações de ${name}`} />}>
          <MoreHorizontal className="size-4" aria-hidden="true" />
        </PopoverTrigger>
        <PopoverContent className="w-44 p-1" align="end">
          <Button asChild variant="ghost" className="w-full justify-start">
            <Link href={`/dashboard/recurring/income/${id}/edit`}><Pencil className="size-4" /> Editar</Link>
          </Button>
          <form action={toggleRecurringIncome}>
            <input type="hidden" name="id" value={id} />
            <input type="hidden" name="isActive" value={isActive ? 'false' : 'true'} />
            <Button type="submit" variant="ghost" className="w-full justify-start">
              {isActive ? <Pause className="size-4" /> : <Play className="size-4" />}
              {isActive ? 'Pausar' : 'Ativar'}
            </Button>
          </form>
          <Separator className="my-1" />
          <AlertDialogTrigger render={<Button variant="destructive" className="w-full justify-start" />}>
            <Trash2 className="size-4" /> Apagar
          </AlertDialogTrigger>
        </PopoverContent>
      </Popover>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogTitle>Apagar ganho?</AlertDialogTitle>
          <AlertDialogDescription>“{name}” será removido.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <form action={deleteRecurringIncome}>
            <input type="hidden" name="id" value={id} />
            <AlertDialogAction asChild>
              <Button type="submit" variant="destructive">Apagar</Button>
            </AlertDialogAction>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
