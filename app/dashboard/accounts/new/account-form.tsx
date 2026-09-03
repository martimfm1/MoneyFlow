'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { createAccount } from './actions'

type AccountFormState = {
  error?: string
}

const initialState: AccountFormState = {}

export function AccountForm() {
  const [state, formAction, isPending] = useActionState(
    createAccount,
    initialState,
  )

  return (
    <form action={formAction} className="mt-7 grid gap-5 lg:grid-cols-2">
      <label className="grid gap-2 text-sm font-medium">
        <span>Nome</span>
        <input
          name="name"
          required
          maxLength={80}
          placeholder="Conta principal"
          disabled={isPending}
          className="min-h-11 w-full rounded-[var(--radius-md)] border bg-transparent px-3 font-normal outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] disabled:cursor-not-allowed disabled:opacity-60"
        />
      </label>
      <label className="grid gap-2 text-sm font-medium">
        <span>Tipo</span>
        <select
          name="accountType"
          defaultValue="bank"
          disabled={isPending}
          className="min-h-11 w-full rounded-[var(--radius-md)] border bg-[hsl(var(--surface))] px-3 font-normal outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <option value="bank">Banco</option>
          <option value="cash">Dinheiro</option>
          <option value="card">Cartão</option>
          <option value="savings">Poupança</option>
          <option value="other">Outro</option>
        </select>
      </label>
      <label className="grid gap-2 text-sm font-medium">
        <span>Saldo atual</span>
        <input
          name="balance"
          type="text"
          inputMode="decimal"
          autoComplete="off"
          required
          placeholder="0,00"
          disabled={isPending}
          className="min-h-11 w-full rounded-[var(--radius-md)] border bg-transparent px-3 font-normal outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] disabled:cursor-not-allowed disabled:opacity-60"
        />
      </label>
      <div className="flex items-end lg:justify-end">
        <Button
          type="submit"
          disabled={isPending}
          className="w-full lg:w-auto"
        >
          {isPending ? 'A criar…' : 'Criar conta'}
        </Button>
      </div>
      {state.error ? (
        <p
          role="alert"
          aria-live="assertive"
          className="rounded-[var(--radius-md)] bg-[hsl(var(--danger)/0.08)] px-3 py-2 text-sm lg:col-span-2"
        >
          {state.error}
        </p>
      ) : null}
    </form>
  )
}
