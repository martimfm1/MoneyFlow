import { CircleHelp, TrendingDown, TrendingUp } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/format'

function monthStart(date: Date, delta = 0) {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + delta, 1),
  )
}

function calculateHealth(
  income: number,
  expenses: number,
  recurringReserve: number,
): number | null {
  if (income <= 0) return null
  const cashFlowScore = expenses <= income ? 40 : 0
  const savingsRate = (income - expenses) / income
  const savingsScore = Math.round(Math.max(0, Math.min(30, savingsRate * 150)))
  const recurringRatio = recurringReserve / income
  const commitmentScore = Math.round(
    Math.max(0, Math.min(30, (1 - recurringRatio) * 30)),
  )
  return Math.max(
    0,
    Math.min(100, cashFlowScore + savingsScore + commitmentScore),
  )
}

export async function MonthlyOverview({ currency }: { currency: string }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const now = new Date()
  const start = monthStart(now)
  const end = monthStart(now, 1)
  const [{ data: transactions }, { data: recurring }] = await Promise.all([
    supabase
      .from('transactions')
      .select('transaction_type, amount, accounts(currency_code)')
      .eq('user_id', user.id)
      .gte('occurred_at', start.toISOString())
      .lt('occurred_at', end.toISOString()),
    supabase
      .from('recurring_expenses')
      .select('amount, frequency, currency_code')
      .eq('user_id', user.id)
      .eq('is_active', true),
  ])

  const primaryCurrencyTransactions = (transactions ?? []).filter((item) => {
    const account = Array.isArray(item.accounts)
      ? item.accounts[0]
      : item.accounts
    return (account?.currency_code ?? currency) === currency
  })
  const transactionsInOtherCurrencies =
    (transactions ?? []).length - primaryCurrencyTransactions.length
  const income = primaryCurrencyTransactions
    .filter((item) => item.transaction_type === 'income')
    .reduce((sum, item) => sum + Number(item.amount), 0)
  const expenses = primaryCurrencyTransactions
    .filter((item) => item.transaction_type === 'expense')
    .reduce((sum, item) => sum + Number(item.amount), 0)
  const saved = income - expenses
  const recurringReserve = (recurring ?? []).reduce((sum, item) => {
    if ((item.currency_code ?? currency) !== currency) return sum
    const divisor =
      item.frequency === 'monthly' ? 1 : item.frequency === 'quarterly' ? 3 : 12
    return sum + Number(item.amount) / divisor
  }, 0)
  const health = calculateHealth(income, expenses, recurringReserve)

  return (
    <section className="mt-7 lg:mt-10" aria-labelledby="monthly-overview-title">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 id="monthly-overview-title" className="text-base font-semibold">
          Este mês
        </h2>
        <span className="text-xs text-[hsl(var(--muted-foreground))]">
          Saúde {health === null ? '—' : `${health}/100`}
        </span>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        <article className="min-w-0 rounded-[var(--radius-lg)] border bg-[hsl(var(--surface))] p-4 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-medium text-[hsl(var(--muted-foreground))]">
            <TrendingUp className="size-4" aria-hidden="true" /> Receitas
          </div>
          <p className="mt-2 break-words text-lg font-semibold tabular-nums text-[hsl(var(--success))] sm:text-xl">
            +{formatCurrency(income, currency)}
          </p>
        </article>
        <article className="min-w-0 rounded-[var(--radius-lg)] border bg-[hsl(var(--surface))] p-4 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-medium text-[hsl(var(--muted-foreground))]">
            <TrendingDown className="size-4" aria-hidden="true" /> Despesas
          </div>
          <p className="mt-2 break-words text-lg font-semibold tabular-nums text-[hsl(var(--danger))] sm:text-xl">
            -{formatCurrency(expenses, currency)}
          </p>
        </article>
        <article className="min-w-0 rounded-[var(--radius-lg)] border bg-[hsl(var(--surface))] p-4 shadow-sm">
          <p className="text-xs font-medium text-[hsl(var(--muted-foreground))]">
            Poupado
          </p>
          <p
            className={`mt-2 break-words text-lg font-semibold tabular-nums sm:text-xl ${saved < 0 ? 'text-[hsl(var(--danger))]' : 'text-[hsl(var(--success))]'}`}
          >
            {saved >= 0 ? '+' : ''}
            {formatCurrency(saved, currency)}
          </p>
        </article>
      </div>

      {transactionsInOtherCurrencies > 0 ? (
        <p className="mt-3 text-xs leading-5 text-[hsl(var(--muted-foreground))]">
          {transactionsInOtherCurrencies} movimento
          {transactionsInOtherCurrencies === 1 ? '' : 's'} noutra
          {transactionsInOtherCurrencies === 1 ? ' moeda' : 's moedas'} não
          entra{transactionsInOtherCurrencies === 1 ? '' : 'm'} nestes totais.
          Não é feita conversão automática.
        </p>
      ) : null}

      <details className="mt-3 rounded-[var(--radius-lg)] border bg-[hsl(var(--surface))] px-4 py-3 shadow-sm">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 text-sm font-medium">
          <span>Saúde financeira</span>
          <span className="inline-flex items-center gap-1 text-xs text-[hsl(var(--muted-foreground))]">
            {health === null ? 'Dados insuficientes' : `${health}/100`}
            <CircleHelp className="size-3.5" aria-hidden="true" />
          </span>
        </summary>
        <div className="mt-3">
          {health === null ? (
            <p className="text-sm leading-6 text-[hsl(var(--muted-foreground))]">
              Regista pelo menos uma receita neste mês para calcular o indicador.
            </p>
          ) : (
            <div
              className="h-2 overflow-hidden rounded-full bg-[hsl(var(--surface-muted))]"
              role="progressbar"
              aria-label="Saúde financeira"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={health}
              aria-valuetext={`${health} em 100`}
            >
              <div
                className="h-full rounded-full bg-[hsl(var(--primary))]"
                style={{ width: `${health}%` }}
              />
            </div>
          )}
          <div className="mt-2 flex items-center justify-between gap-3 text-xs text-[hsl(var(--muted-foreground))]">
            <span>Fluxo, poupança e compromissos recorrentes</span>
            <span className="shrink-0 tabular-nums">{formatCurrency(recurringReserve, currency)}/mês</span>
          </div>
          <p className="mt-2 text-xs leading-5 text-[hsl(var(--muted-foreground))]">
            Pontuação baseada no fluxo de caixa, na taxa de poupança e nos
            compromissos recorrentes registados. Não constitui aconselhamento
            financeiro.
          </p>
        </div>
      </details>
    </section>
  )
}
