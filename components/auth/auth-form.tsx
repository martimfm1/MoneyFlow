'use client'

import { useState } from 'react'
import { ArrowRight, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function AuthForm({ mode }: { mode: 'signin' | 'signup' }) {
  const [pending, setPending] = useState(false)
  const isSignUp = mode === 'signup'

  return (
    <form
      className="space-y-4"
      action={async (formData) => {
        setPending(true)
        try {
          // Server actions will own Supabase auth and validation in the next foundation step.
          void formData
        } finally {
          setPending(false)
        }
      }}
    >
      {isSignUp && (
        <label className="block space-y-2 text-sm font-medium">
          <span>Nome</span>
          <input
            name="displayName"
            autoComplete="name"
            className="min-h-11 w-full rounded-[var(--radius-md)] border bg-[hsl(var(--surface))] px-3 outline-none placeholder:text-[hsl(var(--muted-foreground))]"
            placeholder="Como te devemos tratar?"
            required
          />
        </label>
      )}

      <label className="block space-y-2 text-sm font-medium">
        <span>Email</span>
        <input
          name="email"
          type="email"
          autoComplete="email"
          className="min-h-11 w-full rounded-[var(--radius-md)] border bg-[hsl(var(--surface))] px-3 outline-none placeholder:text-[hsl(var(--muted-foreground))]"
          placeholder="tu@email.com"
          required
        />
      </label>

      <label className="block space-y-2 text-sm font-medium">
        <span>Palavra-passe</span>
        <input
          name="password"
          type="password"
          autoComplete={isSignUp ? 'new-password' : 'current-password'}
          className="min-h-11 w-full rounded-[var(--radius-md)] border bg-[hsl(var(--surface))] px-3 outline-none placeholder:text-[hsl(var(--muted-foreground))]"
          placeholder="Pelo menos 8 caracteres"
          minLength={8}
          required
        />
      </label>

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? <Loader2 aria-hidden="true" className="size-4 animate-spin" /> : null}
        {isSignUp ? 'Criar conta' : 'Entrar'}
        {!pending ? <ArrowRight aria-hidden="true" className="size-4" /> : null}
      </Button>
    </form>
  )
}
