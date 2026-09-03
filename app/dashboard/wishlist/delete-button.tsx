'use client'

import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { deleteWishlistItem } from './actions'

export function DeleteWishlistItemButton({
  id,
  name,
}: {
  id: string
  name: string
}) {
  return (
    <form
      action={deleteWishlistItem}
      onSubmit={(event) => {
        if (!window.confirm(`Apagar “${name}”?`)) event.preventDefault()
      }}
    >
      <input type="hidden" name="id" value={id} />
      <Button
        type="submit"
        size="icon"
        variant="ghost"
        aria-label={`Apagar ${name}`}
        title="Apagar item"
        className="text-[hsl(var(--danger))] hover:text-[hsl(var(--danger))]"
      >
        <Trash2 className="size-4" aria-hidden="true" />
      </Button>
    </form>
  )
}
