import { CircleHelp, TrendingDown, TrendingUp } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/format'

function monthStart(date: Date, delta = 0) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + delta, 1))
}

function calculateHealth(income: number, expenses: number, recurringReserve: number) {
  if (income <= 0) return 0
  const cashFlowScore = expenses <= income ? 40 : 0
  const savingsRate = (income - expenses) / income
  const savingsScore = Math.round(Math.max(0, Math.min(30, savingsRate * 150)))
  const recurringRatio = recurringReserve / income
  const commitmentScore = Math.round(Math.max(0, Math.min(30, (1 - recurringRatio) * 30)))
  return Math.max(0, Math.min(100, cashFlowScore + savingsScore + commitmentScore))
}

export async function MonthlyOverview({ currency }: { currency: string }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const now = new Date()
  const start = monthStart(now)
  const end = monthStart(now, 1)
  const [{ data: transactions }, { data: recurring }] = await Promise.all([
    supabase
      .from('transactions')
      .select('transaction_type, amount')
      .eq('user_id', user.id)
      .gte('occurred_at', start.toISOString())
      .lt('occurred_at', end.toISOString()),
    supabase
      .from('recurring_expenses')
      .select('amount, frequency, is_active, currency_code')
      .eq('user_id', user.id)
      .eq('is_active', true),
  ])

  const income = (transactions ?? []).filter((item) => item.transaction_type === 'income').reduce((sum, item) => sum + Number(item.amount), 0)
  const expenses = (transactions ?? []).filter((item) => item.transaction_type === 'expense').reduce((sum, item) => sum + Number(item.amount), 0)
  const saved = income - expenses
  const recurringReserve = (recurring ?? []).reduce((sum, item) => {
    if ((item.currency_code ?? currency) !== currency) return sum
    const divisor = item.frequency === 'monthly' ? 1 : item.frequency === 'quarterly' ? 3 : 12
    return sum + Number(item.amount) / divisor
  }, 0)
  const health = calculateHealth(income, expenses, recurringReserve)
  const healthExplanation = income <= 0
    ? 'Ainda não existem receitas registadas neste mês para calcular o indicador.'
    : health >= 70
      ? 'O indicador combina fluxo de caixa, taxa de poupança e peso dos compromissos recorrentes.'
      : 'O indicador mostra apenas o comportamento dos dados registados neste mês; não é aconselhamento financeiro.'

  return (
    <section className="mt-8 lg:mt-10" aria-labelledby="monthly-overview-title">
      <div className="mb-4">
        <p className="text-sm text-[hsl(var(--muted-foreground))]">Este mês</p>
        <h2 id="monthly-overview-title" className="mt-1 text-lg font-semibold">Visão mensal</h2>
      </div>
      <div className="grid gap-3 lg:grid-cols-[1.5fr_1fr]">
        <div className="grid gap-3 sm:grid-cols-3">
          <article className="rounded-[var(--radius-lg)] border bg-[hsl(var(--surface))] p-4 shadow-sm sm:p-5">
            <div className="flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))]"><TrendingUp className="size-4" aria-hidden="true" /> Receitas</div>
            <p className="mt-2 text-xl font-semibold tabular-nums text-[hsl(var(--success))]">+{formatCurrency(income, currency)}</p>
          </article>
          <article className="rounded-[var(--radius-lg)] border bg-[hsl(var(--surface))] p-4 shadow-sm sm:p-5">
            <div className="flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))]"><TrendingDown className="size-4" aria-hidden="true" /> Despesas</div>
            <p className="mt-2 text-xl font-semibold tabular-nums text-[hsl(var(--danger))]">-{formatCurrency(expenses, currency)}</p>
          </article>
          <article className="rounded-[var(--radius-lg)] border bg-[hsl(var(--surface))] p-4 shadow-sm sm:p-5">
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Poupado</p>
            <p className={`mt-2 text-xl font-semibold tabular-nums ${saved < 0 ? 'text-[hsl(var(--danger))]' : 'text-[hsl(var(--success))]'}`}>{saved >= 0 ? '+' : ''}{formatCurrency(saved, currency)}</p>
          </article>
        </div>

        <article className="rounded-[var(--radius-lg)] border bg-[hsl(var(--surface))] p-4 shadow-sm sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div><p className="text-sm text-[hsl(var(--muted-foreground))]">Saúde financeira</p><p className="mt-1 text-2xl font-semibold tabular-nums">{health}<span className="text-sm font-normal text-[hsl(var(--muted-foreground))]">/100</span></p></div>
            <CircleHelp className="size-4 text-[hsl(var(--muted-foreground))]" aria-hidden="true" />
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-[hsl(var(--surface-muted))]"><div className="h-full rounded-full bg-[hsl(var(--primary))]" style={{ width: `${health}%` }} /></div>
          <p className="mt-3 text-xs leading-5 text-[hsl(var(--muted-foreground))]">{healthExplanation}</p>
          <p className="mt-2 text-xs text-[hsl(var(--muted-foreground))]">Reserva recorrente mensal detetada: {formatCurrency(recurringReserve, currency)}</p>
        </article>
      </div>
    </section>
  )
}
