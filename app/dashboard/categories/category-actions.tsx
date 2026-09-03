'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Pencil, Trash2, X, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { deleteCategory, moveCategory, updateCategory } from './actions'

export function CategoryActions({
  id,
  name,
  canMoveUp,
  canMoveDown,
}: {
  id: string
  name: string
  canMoveUp: boolean
  canMoveDown: boolean
}) {
  const [editing, setEditing] = useState(false)

  if (editing) {
    return (
      <form
        action={updateCategory}
        className="flex min-w-0 flex-1 items-center gap-2"
      >
        <input type="hidden" name="id" value={id} />
        <input
          name="name"
          defaultValue={name}
          maxLength={50}
          required
          autoFocus
          className="min-h-11 min-w-0 flex-1 rounded-[var(--radius-md)] border bg-transparent px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
          aria-label={`Editar ${name}`}
        />
        <Button
          type="submit"
          size="icon"
          variant="ghost"
          aria-label="Guardar categoria"
        >
          <Check className="size-4" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          aria-label="Cancelar edição"
          onClick={() => setEditing(false)}
        >
          <X className="size-4" />
        </Button>
      </form>
    )
  }

  return (
    <div className="flex items-center gap-1">
      <form action={moveCategory}>
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="direction" value="up" />
        <Button
          type="submit"
          size="icon"
          variant="ghost"
          disabled={!canMoveUp}
          aria-label={`Mover ${name} para cima`}
        >
          <ChevronUp className="size-4" />
        </Button>
      </form>
      <form action={moveCategory}>
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="direction" value="down" />
        <Button
          type="submit"
          size="icon"
          variant="ghost"
          disabled={!canMoveDown}
          aria-label={`Mover ${name} para baixo`}
        >
          <ChevronDown className="size-4" />
        </Button>
      </form>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        aria-label={`Editar ${name}`}
        title="Editar categoria"
        onClick={() => setEditing(true)}
      >
        <Pencil className="size-4" />
      </Button>
      <form
        action={deleteCategory}
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
          title="Apagar categoria"
          className="text-[hsl(var(--danger))] hover:text-[hsl(var(--danger))]"
        >
          <Trash2 className="size-4" />
        </Button>
      </form>
    </div>
  )
}
