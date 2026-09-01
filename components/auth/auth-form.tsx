'use client'

import { useActionState } from 'react'
import { ArrowRight, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { signIn, signUp, type AuthState } from '@/app/(auth)/actions'

const initialState: AuthState = {}

export function AuthForm({ mode }: { mode: 'signin' | 'signup' }) {
  const action = mode === 'signup' ? signUp : signIn
  const [state, formAction, pending] = useActionState(action, initialState)
  const isSignUp = mode === 'signup'

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {isSignUp && (
        <label className="block space-y-2 text-sm font-medium">
          <span>Nome</span>
          <input name="displayName" autoComplete="name" className="min-h-11 w-full rounded-[var(--radius-md)] border bg-[hsl(var(--surface))] px-3 outline-none" placeholder="Como te devemos tratar?" required />
        </label>
      )}
      <label className="block space-y-2 text-sm font-medium">
        <span>Email</span>
        <input name="email" type="email" autoComplete="email" className="min-h-11 w-full rounded-[var(--radius-md)] border bg-[hsl(var(--surface))] px-3 outline-none" placeholder="tu@email.com" required />
      </label>
      <label className="block space-y-2 text-sm font-medium">
        <span>Palavra-passe</span>
        <input name="password" type="password" autoComplete={isSignUp ? 'new-password' : 'current-password'} className="min-h-11 w-full rounded-[var(--radius-md)] border bg-[hsl(var(--surface))] px-3 outline-none" placeholder="Pelo menos 8 caracteres" minLength={8} required />
      </label>
      {state.error ? <p role="alert" className="rounded-[var(--radius-md)] border border-[hsl(var(--danger)/0.25)] bg-[hsl(var(--danger)/0.06)] px-3 py-2 text-sm text-[hsl(var(--danger))]">{state.error}</p> : null}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? <Loader2 aria-hidden="true" className="size-4 animate-spin" /> : null}
        {isSignUp ? 'Criar conta' : 'Entrar'}
        {!pending ? <ArrowRight aria-hidden="true" className="size-4" /> : null}
      </Button>
    </form>
  )
}
