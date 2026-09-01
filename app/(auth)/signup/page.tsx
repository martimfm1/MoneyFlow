import Link from 'next/link'
import { AuthForm } from '@/components/auth/auth-form'

export default function SignupPage() {
  return (
    <main className="moneyflow-shell flex min-h-screen items-center py-10">
      <section className="mx-auto w-full max-w-md">
        <Link href="/" className="text-sm font-medium">MoneyFlow</Link>
        <div className="mt-8 rounded-[var(--radius-lg)] border bg-[hsl(var(--surface))] p-6 shadow-sm sm:p-8">
          <h1 className="text-2xl font-semibold tracking-tight">Começa no MoneyFlow</h1>
          <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">Primeiro criamos a tua conta. Depois tratamos do resto.</p>
          <div className="mt-6"><AuthForm mode="signup" /></div>
          <p className="mt-6 text-center text-sm text-[hsl(var(--muted-foreground))]">
            Já tens conta? <Link className="font-medium text-[hsl(var(--foreground))] underline underline-offset-4" href="/login">Entrar</Link>
          </p>
        </div>
      </section>
    </main>
  )
}
