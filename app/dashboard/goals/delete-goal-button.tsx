'use client'

import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { deleteGoal } from './actions'

export function DeleteGoalButton({ goalId }: { goalId: string }) {
  return (
    <form
      action={deleteGoal}
      onSubmit={(event) => {
        const confirmed = window.confirm(
          'Apagar este objetivo? As contribuições associadas também serão removidas.',
        )
        if (!confirmed) event.preventDefault()
      }}
    >
      <input type="hidden" name="goalId" value={goalId} />
      <Button
        type="submit"
        size="sm"
        variant="ghost"
        className="text-[hsl(var(--danger))] hover:bg-[hsl(var(--danger)/0.08)] hover:text-[hsl(var(--danger))]"
        aria-label="Apagar objetivo"
        title="Apagar objetivo"
      >
        <Trash2 className="size-4" aria-hidden="true" />
        <span className="hidden sm:inline">Apagar</span>
      </Button>
    </form>
  )
}
