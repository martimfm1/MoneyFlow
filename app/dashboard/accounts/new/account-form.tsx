'use client'

import { useActionState } from 'react'
import { createAccount, type AccountActionState } from '../actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

const initialState: AccountActionState = {}

export function AccountForm() {
  const [state, formAction, isPending] = useActionState(createAccount, initialState)

  return (
    <Card className="mt-5">
      <CardContent className="pt-6">
        <form action={formAction} className="grid gap-5 sm:grid-cols-2">
          <label className="grid gap-2 text-sm font-medium">Nome<Input name="name" required maxLength={80} placeholder="Conta principal" disabled={isPending} /></label>
          <label className="grid gap-2 text-sm font-medium">Tipo<select name="accountType" defaultValue="bank" disabled={isPending} className="h-8 rounded-lg border bg-background px-2 text-sm"><option value="bank">Banco</option><option value="cash">Dinheiro</option><option value="card">Cartão</option><option value="savings">Poupança</option><option value="other">Outro</option></select></label>
          <label className="grid gap-2 text-sm font-medium sm:col-span-2">Saldo atual<Input name="balance" type="text" inputMode="decimal" required placeholder="0,00" disabled={isPending} /></label>
          {state.error ? <p role="alert" aria-live="assertive" className="sm:col-span-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">{state.error}</p> : null}
          <div className="flex justify-end sm:col-span-2"><Button type="submit" disabled={isPending}>{isPending ? 'A criar…' : 'Criar conta'}</Button></div>
        </form>
      </CardContent>
    </Card>
  )
}
