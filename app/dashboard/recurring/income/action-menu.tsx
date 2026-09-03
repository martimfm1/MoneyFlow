'use client'

import Link from 'next/link'
import { MoreHorizontal, Pause, Pencil, Play, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { deleteRecurringIncome, toggleRecurringIncome } from './actions'

type Props = {
  id: string
  name: string
  isActive: boolean
}

export function RecurringIncomeActionMenu({ id, name, isActive }: Props) {
  const [confirmOpen, setConfirmOpen] = useState(false)

  return (
    <>
      <Popover>
        <PopoverTrigger className="inline-flex size-9 items-center justify-center rounded-full text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--surface-muted))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]">
          <MoreHorizontal className="size-4" aria-hidden="true" />
          <span className="sr-only">Ações de {name}</span>
        </PopoverTrigger>
        <PopoverContent className="w-44" align="end">
          <Link href={`/dashboard/recurring/${id}/edit`} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-[hsl(var(--surface-muted))]">
            <Pencil className="size-4" /> Editar
          </Link>
          <form action={toggleRecurringIncome}>
            <input type="hidden" name="id" value={id} />
            <input type="hidden" name="isActive" value={isActive ? 'false' : 'true'} />
            <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-[hsl(var(--surface-muted))]" type="submit">
              {isActive ? <Pause className="size-4" /> : <Play className="size-4" />}
              {isActive ? 'Pausar' : 'Ativar'}
            </button>
          </form>
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-[hsl(var(--danger))] hover:bg-[hsl(var(--danger)/0.08)]"
          >
            <Trash2 className="size-4" /> Apagar
          </button>
        </PopoverContent>
      </Popover>
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Apagar ganho?</DialogTitle>
          </DialogHeader>
          <p className="mt-3 text-sm text-[hsl(var(--muted-foreground))]">“{name}” será removido.</p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmOpen(false)}>Cancelar</Button>
            <form action={deleteRecurringIncome}>
              <input type="hidden" name="id" value={id} />
              <Button type="submit" variant="danger">Apagar</Button>
            </form>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
