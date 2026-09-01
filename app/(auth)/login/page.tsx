import Link from 'next/link'
import { AuthForm } from '@/components/auth/auth-form'

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ message?: string }> }) {
  const params = await searchParams

  return (
    <main className="moneyflow-shell flex min-h-screen items-center py-10">
      <section className="mx-auto w-full max-w-md">
        <Link href="/" className="text-sm font-medium">MoneyFlow</Link>
        <div className="mt-8 rounded-[var(--radius-lg)] border bg-[hsl(var(--surface))] p-6 shadow-sm sm:p-8">
          <h1 className="text-2xl font-semibold tracking-tight">Bem-vindo de volta</h1>
          <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">Entra para veres como está o teu dinheiro.</p>
          {params.message ? <p className="mt-4 rounded-[var(--radius-md)] bg-[hsl(var(--info)/0.08)] px-3 py-2 text-sm">{params.message}</p> : null}
          <div className="mt-6"><AuthForm mode="signin" /></div>
          <p className="mt-6 text-center text-sm text-[hsl(var(--muted-foreground))]">
            Ainda não tens conta? <Link className="font-medium text-[hsl(var(--foreground))] underline underline-offset-4" href="/signup">Criar conta</Link>
          </p>
        </div>
      </section>
    </main>
  )
}
