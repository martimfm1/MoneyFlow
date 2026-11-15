import Link from 'next/link'
import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowRight,
  CalendarClock,
  ChevronRight,
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
import { getFinancialContext } from '@/lib/financial-context'
import { MotionReveal } from '@/components/ui/motion-reveal'

export const dynamic = 'force-dynamic'

const accountTypeLabels: Record<string, string> = {
  bank: 'Banco',
  cash: 'Dinheiro',
  card: 'Cartão',
  savings: 'Poupança',
  other: 'Outro',
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const financialContext = await getFinancialContext(supabase, user.id)

  const [
    { data: profile },
    { data: accounts },
    { data: transactions },
    { data: goals },
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('display_name, currency_code, onboarding_completed_at')
      .eq('id', user.id)
      .maybeSingle(),
    supabase
      .from('accounts')
      .select('id, name, account_type, balance, currency_code')
      .eq('user_id', user.id)
      .eq('context_id', financialContext.id)
      .eq('is_active', true)
      .order('created_at', { ascending: true }),
    supabase
      .from('transactions')
      .select(
        'id, transaction_type, amount, description, occurred_at, accounts(name, currency_code)',
      )
      .eq('user_id', user.id)
      .eq('context_id', financialContext.id)
      .order('occurred_at', { ascending: false })
      .limit(5),
    supabase
      .from('goals')
      .select('id, name, target_amount, current_amount, target_date, priority')
      .eq('user_id', user.id)
      .eq('context_id', financialContext.id)
      .order('priority', { ascending: true })
      .order('created_at', { ascending: false })
      .limit(3),
  ])

  if (!profile?.onboarding_completed_at) redirect('/onboarding')
  const currency =
    financialContext.currency_code || profile.currency_code || 'EUR'
  const accountsInPrimaryCurrency = (accounts ?? []).filter(
    (account) => (account.currency_code || currency) === currency,
  )
  const accountsInOtherCurrencies = (accounts ?? []).filter(
    (account) => (account.currency_code || currency) !== currency,
  ).length
  const totalBalance = accountsInPrimaryCurrency.reduce(
    (sum, account) => sum + Number(account.balance),
    0,
  )
  const balancesByCurrency = (accounts ?? []).reduce<
    Record<string, { balance: number; accountCount: number }>
  >((totals, account) => {
    const accountCurrency = account.currency_code || currency
    const current = totals[accountCurrency] ?? { balance: 0, accountCount: 0 }
    current.balance += Number(account.balance)
    current.accountCount += 1
    totals[accountCurrency] = current
    return totals
  }, {})
  const currencyTotals = Object.entries(balancesByCurrency).sort(([a], [b]) =>
    a.localeCompare(b),
  )
  const firstName = profile.display_name?.trim()?.split(/\s+/)[0] ?? ''

  return (
    <div className="moneyflow-shell pt-9 pb-6 sm:pt-9 sm:pb-8 lg:pt-10 lg:pb-10">
      <MotionReveal>
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
              O teu espaço financeiro
            </p>
            <h1 className="mt-2 text-[clamp(1.8rem,4vw,2.65rem)] font-semibold tracking-[-0.045em] text-foreground">
              Olá{firstName ? `, ${firstName}` : ''}.
            </h1>
            <p className="mt-1.5 max-w-xl text-sm leading-6 text-muted-foreground">
              Uma visão simples do que entra, do que sai e do que estás a
              construir.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm" className="bg-card/70">
              <Link href="/dashboard/analytics">
                Ver análise <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild size="sm" className="shadow-lg shadow-primary/10">
              <Link href="/dashboard/transactions/new">
                <Plus className="size-4" aria-hidden="true" />
                Novo movimento
              </Link>
            </Button>
          </div>
        </header>

        <section
          className="mt-7 grid gap-3 lg:grid-cols-[minmax(0,1.55fr)_minmax(17rem,0.75fr)]"
          aria-label="Resumo do saldo"
        >
          <article className="glass-hero relative isolate min-h-[15.5rem] overflow-hidden rounded-[1.65rem] p-5 text-white sm:p-7">
            <div className="pointer-events-none absolute -right-14 -top-28 -z-10 size-80 rounded-full border border-white/10" />
            <div className="pointer-events-none absolute -right-2 -top-16 -z-10 size-56 rounded-full border border-white/10" />
            <div className="pointer-events-none absolute -bottom-24 right-20 -z-10 size-64 rounded-full bg-primary/10 blur-3xl" />
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/75">
                Saldo principal · {currency}
              </p>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3 py-1.5 text-[11px] font-medium text-white/75">
                <span className="size-1.5 rounded-full bg-primary shadow-[0_0_10px_hsl(var(--primary))]" />
                {financialContext.name}
              </span>
            </div>
            <p className="mt-4 break-words text-[clamp(2.25rem,6vw,4rem)] font-semibold tracking-[-0.055em] tabular-nums">
              {formatCurrency(totalBalance, currency)}
            </p>
            <p className="mt-2 max-w-md text-xs leading-5 text-white/55">
              {accountsInPrimaryCurrency.length
                ? `Com base em ${accountsInPrimaryCurrency.length} ${accountsInPrimaryCurrency.length === 1 ? 'conta ativa' : 'contas ativas'} em ${currency}.`
                : 'Adiciona uma conta para começares a acompanhar o teu saldo.'}
              {accountsInOtherCurrencies > 0
                ? ` ${accountsInOtherCurrencies} ${accountsInOtherCurrencies === 1 ? 'conta está' : 'contas estão'} noutra moeda e não ${accountsInOtherCurrencies === 1 ? 'está incluída' : 'estão incluídas'} neste total.`
                : ''}
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-2">
              <Link
                href="/dashboard/accounts"
                className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-white px-3.5 text-xs font-semibold text-[#15231d] transition hover:bg-white/90"
              >
                Ver contas{' '}
                <ArrowRight className="size-3.5" aria-hidden="true" />
              </Link>
              <Link
                href="/dashboard/transactions"
                className="inline-flex min-h-10 items-center rounded-lg border border-white/15 px-3.5 text-xs font-semibold text-white/80 transition hover:bg-white/10 hover:text-white"
              >
                Histórico
              </Link>
            </div>
          </article>

          <aside
            className="glass-card rounded-[1.65rem] p-5 sm:p-6"
            aria-label="Resumo de todas as contas por moeda"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.17em] text-muted-foreground">
                  Visão consolidada
                </p>
                <h2 className="mt-1 text-lg font-semibold tracking-tight">
                  Saldos por moeda
                </h2>
              </div>
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary">
                <Wallet className="size-[17px]" aria-hidden="true" />
              </span>
            </div>

            {currencyTotals.length ? (
              <div className="mt-4 grid gap-2">
                {currencyTotals.map(([code, totals]) => (
                  <div
                    key={code}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border/75 bg-background/65 px-3.5 py-3"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-border/70 bg-card text-[10px] font-bold tracking-wide text-muted-foreground">
                        {code}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-xs font-semibold text-foreground">
                          {code}
                        </span>
                        <span className="mt-0.5 block text-[10px] text-muted-foreground">
                          {totals.accountCount}{' '}
                          {totals.accountCount === 1 ? 'conta' : 'contas'}
                        </span>
                      </span>
                    </div>
                    <span className="shrink-0 text-right text-sm font-semibold tabular-nums">
                      {formatCurrency(totals.balance, code)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <Link
                href="/dashboard/accounts/new"
                className="mt-4 flex min-h-20 items-center justify-between rounded-xl border border-dashed border-border px-4 text-sm font-medium transition-colors hover:border-primary/40 hover:bg-primary/5"
              >
                Criar a primeira conta
                <Plus className="size-4 text-primary" aria-hidden="true" />
              </Link>
            )}

            <div className="mt-4 grid grid-cols-2 gap-2 border-t border-border/70 pt-4">
              <div>
                <p className="text-xl font-semibold tabular-nums">
                  {accounts?.length ?? 0}
                </p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">
                  Contas ativas
                </p>
              </div>
              <div>
                <p className="text-xl font-semibold tabular-nums">
                  {goals?.length ?? 0}
                </p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">
                  Objetivos em destaque
                </p>
              </div>
            </div>
            <p className="mt-3 text-[10px] leading-5 text-muted-foreground">
              Cada moeda é totalizada separadamente. Não é aplicada qualquer
              conversão automática.
            </p>
          </aside>
        </section>
      </MotionReveal>

      <MonthlyOverview currency={currency} contextId={financialContext.id} />

      <MotionReveal className="mt-8" delay={0.12}>
        <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,1.35fr)_minmax(19rem,0.85fr)]">
          <div className="min-w-0 space-y-8">
            <section id="transactions" aria-labelledby="transactions-title">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                    Atividade
                  </p>
                  <h2
                    id="transactions-title"
                    className="mt-1 text-lg font-semibold tracking-tight"
                  >
                    Movimentos recentes
                  </h2>
                </div>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/dashboard/transactions">
                    Ver todos{' '}
                    <ChevronRight className="size-4" aria-hidden="true" />
                  </Link>
                </Button>
              </div>
              {!transactions?.length ? (
                <Link
                  href="/dashboard/transactions/new"
                  className="flex min-h-28 items-center justify-between rounded-2xl border border-dashed border-border bg-card/60 px-5 transition-colors hover:border-primary/40 hover:bg-card"
                >
                  <span>
                    <span className="block text-sm font-semibold">
                      Ainda não há movimentos
                    </span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      Regista a primeira receita ou despesa.
                    </span>
                  </span>
                  <span className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Plus className="size-4" aria-hidden="true" />
                  </span>
                </Link>
              ) : (
                <div className="glass-card overflow-hidden rounded-2xl shadow-sm">
                  <div className="divide-y divide-border/70">
                    {transactions.map((transaction) => {
                      const isIncome = transaction.transaction_type === 'income'
                      const account = Array.isArray(transaction.accounts)
                        ? transaction.accounts[0]
                        : transaction.accounts
                      return (
                        <Link
                          key={transaction.id}
                          href={`/dashboard/transactions/${transaction.id}`}
                          className="group flex min-h-[4.65rem] items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/45 sm:px-5"
                        >
                          <span
                            className={`inline-flex size-10 shrink-0 items-center justify-center rounded-xl ${isIncome ? 'bg-[hsl(var(--success)/0.11)] text-[hsl(var(--success))]' : 'bg-[hsl(var(--danger)/0.1)] text-[hsl(var(--danger))]'}`}
                          >
                            {isIncome ? (
                              <ArrowDownLeft
                                className="size-[17px]"
                                aria-hidden="true"
                              />
                            ) : (
                              <ArrowUpRight
                                className="size-[17px]"
                                aria-hidden="true"
                              />
                            )}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold">
                              {transaction.description ||
                                (isIncome ? 'Receita' : 'Despesa')}
                            </p>
                            <p className="mt-0.5 truncate text-xs text-muted-foreground">
                              {account?.name ?? 'Conta'}{' '}
                              <span className="px-1 text-border">·</span>{' '}
                              {formatShortDate(transaction.occurred_at)}
                            </p>
                          </div>
                          <p
                            className={`shrink-0 text-sm font-semibold tabular-nums ${isIncome ? 'text-[hsl(var(--success))]' : 'text-[hsl(var(--danger))]'}`}
                          >
                            {isIncome ? '+' : '−'}
                            {formatCurrency(
                              Number(transaction.amount),
                              account?.currency_code || currency,
                            )}
                          </p>
                          <ChevronRight
                            className="hidden size-4 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5 sm:block"
                            aria-hidden="true"
                          />
                        </Link>
                      )
                    })}
                  </div>
                </div>
              )}
            </section>

            <WishlistPreview
              currency={currency}
              contextId={financialContext.id}
            />
          </div>

          <aside className="min-w-0 space-y-8">
            <section id="accounts" aria-labelledby="accounts-title">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                    Onde está o teu dinheiro
                  </p>
                  <h2
                    id="accounts-title"
                    className="mt-1 text-lg font-semibold tracking-tight"
                  >
                    Contas
                  </h2>
                </div>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/dashboard/accounts">
                    Gerir <ChevronRight className="size-4" aria-hidden="true" />
                  </Link>
                </Button>
              </div>
              {accounts?.length ? (
                <div className="grid gap-2">
                  {accounts.slice(0, 4).map((account) => (
                    <Link
                      key={account.id}
                      href={`/dashboard/accounts/${account.id}`}
                      className="glass-card group flex min-w-0 items-center gap-3 rounded-2xl p-3.5 shadow-sm transition-all hover:-translate-y-0.5"
                    >
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary">
                        <Wallet className="size-[17px]" aria-hidden="true" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold">
                          {account.name}
                        </span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          {accountTypeLabels[account.account_type] ??
                            account.account_type}
                        </span>
                      </span>
                      <span className="shrink-0 text-right">
                        <span className="block text-sm font-semibold tabular-nums">
                          {formatCurrency(
                            Number(account.balance),
                            account.currency_code || currency,
                          )}
                        </span>
                        <span className="mt-0.5 block text-[10px] text-muted-foreground">
                          {account.currency_code || currency}
                        </span>
                      </span>
                    </Link>
                  ))}
                  {accounts.length > 4 ? (
                    <Link
                      href="/dashboard/accounts"
                      className="rounded-xl px-3 py-2 text-center text-xs font-semibold text-primary transition-colors hover:bg-primary/5"
                    >
                      +{accounts.length - 4} contas adicionais
                    </Link>
                  ) : null}
                </div>
              ) : (
                <Link
                  href="/dashboard/accounts/new"
                  className="flex min-h-24 items-center justify-between rounded-2xl border border-dashed border-border bg-card/60 px-4 hover:border-primary/40"
                >
                  <span className="text-sm font-semibold">
                    Criar a primeira conta
                  </span>
                  <Plus className="size-4 text-primary" aria-hidden="true" />
                </Link>
              )}
            </section>

            <section id="goals" aria-labelledby="goals-title">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                    A construir
                  </p>
                  <h2
                    id="goals-title"
                    className="mt-1 text-lg font-semibold tracking-tight"
                  >
                    Os teus objetivos
                  </h2>
                </div>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/dashboard/goals">
                    Ver todos{' '}
                    <ChevronRight className="size-4" aria-hidden="true" />
                  </Link>
                </Button>
              </div>
              {!goals?.length ? (
                <Link
                  href="/dashboard/goals/new"
                  className="flex min-h-24 items-center justify-between rounded-2xl border border-dashed border-border bg-card/60 px-4 hover:border-primary/40"
                >
                  <span className="text-sm font-semibold">
                    Define o teu primeiro objetivo
                  </span>
                  <Target className="size-4 text-primary" aria-hidden="true" />
                </Link>
              ) : (
                <div className="grid gap-2">
                  {goals.map((goal) => {
                    const current = Number(goal.current_amount)
                    const target = Number(goal.target_amount)
                    const progress =
                      target > 0
                        ? Math.min(100, Math.round((current / target) * 100))
                        : 0
                    return (
                      <Link
                        key={goal.id}
                        href={`/dashboard/goals/${goal.id}`}
                        className="glass-card rounded-2xl p-4 shadow-sm transition-colors hover:border-primary/30"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="truncate text-sm font-semibold">
                            {goal.name}
                          </p>
                          <span className="text-xs font-semibold tabular-nums text-primary">
                            {progress}%
                          </span>
                        </div>
                        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-primary transition-[width]"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <div className="mt-2.5 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                          <span>{formatCurrency(current, currency)}</span>
                          <span>{formatCurrency(target, currency)}</span>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}
            </section>

            <Link
              href="/dashboard/recurring"
              className="group flex items-center gap-3 rounded-2xl border border-border/80 bg-card/65 p-4 transition-colors hover:border-primary/30 hover:bg-card"
            >
              <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <CalendarClock className="size-[17px]" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold">
                  Movimentos recorrentes
                </span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  Planeia receitas e despesas futuras
                </span>
              </span>
              <ArrowRight
                className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </Link>
          </aside>
        </div>
      </MotionReveal>
    </div>
  )
}
