import { redirect } from 'next/navigation'
import { ArrowUpRight, LogOut, Plus, Wallet } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { signOut } from './actions'

export const dynamic = 'force-dynamic'

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat('pt-PT', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount)
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [{ data: profile }, { data: accounts }] = await Promise.all([
    supabase
      .from('profiles')
      .select('display_name, currency_code, onboarding_completed_at')
      .eq('id', user.id)
      .maybeSingle(),
    supabase
      .from('accounts')
      .select('id, name, account_type, balance, currency_code')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: true }),
  ])

  if (!profile?.onboarding_completed_at) redirect('/onboarding')

  const currency = profile.currency_code ?? 'EUR'
  const totalBalance = (accounts ?? []).reduce((sum, account) => sum + Number(account.balance), 0)
  const firstName = profile.display_name?.trim()?.split(/\s+/)[0] ?? 'aí'

  return (
    <main className="min-h-screen pb-24">
      <div className="moneyflow-shell py-6 sm:py-8">
        <header className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Olá, {firstName}</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">O teu dinheiro</h1>
          </div>
          <form action={signOut}>
            <Button type="submit" variant="ghost" size="icon" aria-label="Terminar sessão">
              <LogOut className="size-4" />
            </Button>
          </form>
        </header>

        <section className="mt-8 rounded-[var(--radius-lg)] border bg-[hsl(var(--surface))] p-5 shadow-sm sm:p-6">
          <p className="text-sm text-[hsl(var(--muted-foreground))]">Saldo total</p>
          <p className="mt-2 text-4xl font-semibold tracking-tight tabular-nums sm:text-5xl">{formatMoney(totalBalance, currency)}</p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Button asChild>
              <a href="#add">
                <Plus className="size-4" />
                Adicionar movimento
              </a>
            </Button>
            <Button asChild variant="outline">
              <a href="#accounts">
                Ver contas
                <ArrowUpRight className="size-4" />
              </a>
            </Button>
          </div>
        </section>

        <section id="accounts" className="mt-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">Onde está o teu dinheiro</p>
              <h2 className="mt-1 text-lg font-semibold">Contas</h2>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <a href="/dashboard/accounts">Gerir</a>
            </Button>
          </div>

          {accounts?.length ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {accounts.map((account) => (
                <article key={account.id} className="rounded-[var(--radius-lg)] border bg-[hsl(var(--surface))] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[hsl(var(--surface-muted))]">
                        <Wallet className="size-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-medium">{account.name}</p>
                        <p className="text-xs capitalize text-[hsl(var(--muted-foreground))]">{account.account_type}</p>
                      </div>
                    </div>
                    <p className="font-semibold tabular-nums">{formatMoney(Number(account.balance), account.currency_code || currency)}</p>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-[var(--radius-lg)] border border-dashed bg-[hsl(var(--surface))] p-6 text-center">
              <p className="font-medium">Ainda não tens contas</p>
              <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">Cria a tua primeira conta para começarmos a acompanhar o saldo.</p>
              <Button className="mt-4" asChild>
                <a href="/dashboard/accounts/new">Criar conta</a>
              </Button>
            </div>
          )}
        </section>

        <section id="add" className="mt-8 grid gap-3 sm:grid-cols-3">
          {[
            ['Despesa', 'Regista dinheiro que saiu.'],
            ['Receita', 'Regista dinheiro que entrou.'],
            ['Objetivo', 'Começa a dar um propósito ao teu dinheiro.'],
          ].map(([title, description]) => (
            <a key={title} href={title === 'Objetivo' ? '/dashboard/goals/new' : '/dashboard/transactions/new'} className="rounded-[var(--radius-lg)] border bg-[hsl(var(--surface))] p-4 transition hover:-translate-y-0.5 hover:shadow-sm">
              <p className="font-medium">{title}</p>
              <p className="mt-1 text-sm leading-6 text-[hsl(var(--muted-foreground))]">{description}</p>
            </a>
          ))}
        </section>
      </div>
    </main>
  )
}
