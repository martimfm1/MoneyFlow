import Link from 'next/link'
import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarClock,
  ChevronRight,
  CircleDollarSign,
  LogOut,
  Plus,
  Target,
  Wallet,
} from 'lucide-react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatShortDate } from '@/lib/format'
import { MonthlyOverview } from '@/components/dashboard/monthly-overview'
import { WishlistPreview } from '@/components/dashboard/wishlist-preview'
import { signOut } from './actions'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: accounts }, { data: transactions }, { data: goals }] = await Promise.all([
    supabase.from('profiles').select('display_name, currency_code, onboarding_completed_at').eq('id', user.id).maybeSingle(),
    supabase.from('accounts').select('id, name, account_type, balance, currency_code').eq('user_id', user.id).eq('is_active', true).order('created_at', { ascending: true }),
    supabase.from('transactions').select('id, transaction_type, amount, description, occurred_at, accounts(name, currency_code)').eq('user_id', user.id).order('occurred_at', { ascending: false }).limit(5),
    supabase.from('goals').select('id, name, target_amount, current_amount, target_date, priority').eq('user_id', user.id).order('priority', { ascending: true }).order('created_at', { ascending: false }).limit(3),
  ])

  if (!profile?.onboarding_completed_at) redirect('/onboarding')
  const currency = profile.currency_code ?? 'EUR'
  const totalBalance = (accounts ?? []).reduce((sum, account) => sum + Number(account.balance), 0)
  const firstName = profile.display_name?.trim()?.split(/\s+/)[0] ?? ''

  return (
    <main className="min-h-screen pb-24">
      <div className="moneyflow-shell py-5 sm:py-8 lg:py-10">
        <header className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm text-[hsl(var(--muted-foreground))]">Olá{firstName ? `, ${firstName}` : ''}</p>
            <h1 className="mt-0.5 text-2xl font-semibold tracking-tight sm:text-3xl">O teu dinheiro</h1>
          </div>
          <form action={signOut}>
            <Button type="submit" variant="ghost" size="icon" aria-label="Terminar sessão">
              <LogOut className="size-4" aria-hidden="true" />
            </Button>
          </form>
        </header>

        <section className="mt-5 rounded-[1.35rem] border bg-[hsl(var(--surface))] p-5 shadow-sm sm:p-6 lg:p-8">
          <div className="flex items-end justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-[hsl(var(--muted-foreground))]">Saldo total</p>
              <p className="mt-1 truncate text-[clamp(2.5rem,10vw,4rem)] font-semibold tracking-tight tabular-nums">{formatCurrency(totalBalance, currency)}</p>
            </div>
            <Button asChild size="icon" className="size-12 shrink-0 rounded-full lg:size-default lg:rounded-[var(--radius-md)]">
              <Link href="/dashboard/transactions/new" aria-label="Adicionar movimento">
                <Plus className="size-5" aria-hidden="true" />
                <span className="hidden lg:inline">Adicionar movimento</span>
              </Link>
            </Button>
          </div>
          <Link href="#accounts" className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] lg:hidden">
            Ver contas <ChevronRight className="size-4" aria-hidden="true" />
          </Link>
        </section>

        <MonthlyOverview currency={currency} />

        <section id="accounts" className="mt-8 lg:mt-10">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold">Contas</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/accounts">Ver todas <ChevronRight className="size-4" aria-hidden="true" /></Link>
            </Button>
          </div>
          {accounts?.length ? (
            <div className="mt-3 -mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-1 sm:grid sm:grid-cols-2 sm:overflow-visible xl:grid-cols-4">
              {accounts.map((account) => (
                <Link key={account.id} href={`/dashboard/accounts/${account.id}`} className="min-w-[15.5rem] snap-start rounded-[var(--radius-lg)] border bg-[hsl(var(--surface))] p-4 shadow-sm transition-colors active:bg-[hsl(var(--surface-muted))] sm:min-w-0">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[hsl(var(--surface-muted))]">
                      <Wallet className="size-4" aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{account.name}</p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))]">{account.account_type}</p>
                    </div>
                  </div>
                  <p className="mt-4 text-xl font-semibold tabular-nums">{formatCurrency(Number(account.balance), account.currency_code || currency)}</p>
                </Link>
              ))}
            </div>
          ) : (
            <Link href="/dashboard/accounts/new" className="mt-3 flex min-h-20 items-center justify-between rounded-[var(--radius-lg)] border border-dashed bg-[hsl(var(--surface))] px-4">
              <span className="font-medium">Criar a primeira conta</span>
              <Plus className="size-4" aria-hidden="true" />
            </Link>
          )}
        </section>

        <section className="mt-8 lg:mt-10">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold">Movimentos</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/transactions">Ver todos <ChevronRight className="size-4" aria-hidden="true" /></Link>
            </Button>
          </div>
          {!transactions?.length ? (
            <Link href="/dashboard/transactions/new" className="mt-3 flex min-h-20 items-center justify-between rounded-[var(--radius-lg)] border border-dashed bg-[hsl(var(--surface))] px-4">
              <span className="font-medium">Adicionar primeiro movimento</span>
              <Plus className="size-4" aria-hidden="true" />
            </Link>
          ) : (
            <div className="mt-3 overflow-hidden rounded-[var(--radius-lg)] border bg-[hsl(var(--surface))] shadow-sm">
              <div className="divide-y">
                {transactions.map((transaction) => {
                  const isIncome = transaction.transaction_type === 'income'
                  const account = Array.isArray(transaction.accounts) ? transaction.accounts[0] : transaction.accounts
                  return (
                    <Link key={transaction.id} href={`/dashboard/transactions/${transaction.id}`} className="flex min-h-16 items-center gap-3 px-3 py-3 transition-colors active:bg-[hsl(var(--surface-muted))] sm:px-4">
                      <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--surface-muted))]">
                        {isIncome ? <ArrowDownLeft className="size-4" aria-hidden="true" /> : <ArrowUpRight className="size-4" aria-hidden="true" />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{transaction.description || (isIncome ? 'Receita' : 'Despesa')}</p>
                        <p className="truncate text-xs text-[hsl(var(--muted-foreground))]">{account?.name ?? 'Conta'} · {formatShortDate(transaction.occurred_at)}</p>
                      </div>
                      <p className={`shrink-0 text-sm font-semibold tabular-nums ${isIncome ? 'text-[hsl(var(--success))]' : 'text-[hsl(var(--danger))]'}`}>{isIncome ? '+' : '-'}{formatCurrency(Number(transaction.amount), account?.currency_code || currency)}</p>
                    </Link>
                  )
                })}
              </div>
            </div>
          )}
        </section>

        <section className="mt-8 lg:mt-10">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold">Objetivos</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/goals">Ver todos <ChevronRight className="size-4" aria-hidden="true" /></Link>
            </Button>
          </div>
          {!goals?.length ? (
            <Link href="/dashboard/goals/new" className="mt-3 flex min-h-20 items-center justify-between rounded-[var(--radius-lg)] border border-dashed bg-[hsl(var(--surface))] px-4">
              <span className="font-medium">Criar primeiro objetivo</span>
              <Target className="size-4" aria-hidden="true" />
            </Link>
          ) : (
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {goals.map((goal) => {
                const current = Number(goal.current_amount)
                const target = Number(goal.target_amount)
                const progress = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0
                return (
                  <Link key={goal.id} href={`/dashboard/goals/${goal.id}`} className="rounded-[var(--radius-lg)] border bg-[hsl(var(--surface))] p-4 transition-colors active:bg-[hsl(var(--surface-muted))]">
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate font-medium">{goal.name}</p>
                      <span className="text-xs font-semibold tabular-nums">{progress}%</span>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-[hsl(var(--surface-muted))]">
                      <div className="h-full rounded-full bg-[hsl(var(--primary))]" style={{ width: `${progress}%` }} />
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-[hsl(var(--muted-foreground))]">
                      <span>{formatCurrency(current, currency)}</span>
                      <span>{formatCurrency(target, currency)}</span>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </section>

        <WishlistPreview currency={currency} />

        <section id="add" className="mt-8 hidden gap-3 lg:grid lg:grid-cols-4 lg:mt-10">
          {[
            ['Despesa', '/dashboard/transactions/new?type=expense', Plus],
            ['Receita', '/dashboard/transactions/new?type=income', ArrowDownLeft],
            ['Objetivo', '/dashboard/goals/new', Target],
            ['Recorrente', '/dashboard/recurring', CalendarClock],
          ].map(([title, href, Icon]) => (
            <Link key={title as string} href={href as string} className="flex items-center gap-3 rounded-[var(--radius-lg)] border bg-[hsl(var(--surface))] p-4 transition hover:-translate-y-0.5 hover:shadow-sm">
              <span className="inline-flex size-9 items-center justify-center rounded-full bg-[hsl(var(--surface-muted))]"><Icon className="size-4" aria-hidden="true" /></span>
              <span className="font-medium">{title as string}</span>
            </Link>
          ))}
        </section>
      </div>
    </main>
  )
}
