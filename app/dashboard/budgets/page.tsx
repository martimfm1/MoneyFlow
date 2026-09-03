import Link from 'next/link'
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Plus,
  WalletCards,
} from 'lucide-react'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'
import { upsertBudget } from './actions'
import { formatCurrency, formatMonth } from '@/lib/format'

export const dynamic = 'force-dynamic'

type SearchParams = { month?: string; error?: string }

function parseMonth(value?: string) {
  if (!value || !/^\d{4}-\d{2}$/.test(value)) return null
  const [year, month] = value.split('-').map(Number)
  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    month < 1 ||
    month > 12
  )
    return null
  return { year, month }
}
function monthKey(year: number, month: number) {
  return `${year.toString().padStart(4, '0')}-${month.toString().padStart(2, '0')}`
}
function shiftMonth(year: number, month: number, delta: number) {
  const date = new Date(Date.UTC(year, month - 1 + delta, 1))
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1 }
}

export default async function BudgetsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const now = new Date()
  const requested = parseMonth(params.month)
  const year = requested?.year ?? now.getUTCFullYear()
  const month = requested?.month ?? now.getUTCMonth() + 1
  const currentMonth = monthKey(year, month)
  const currentMonthDate = `${currentMonth}-01`
  const next = shiftMonth(year, month, 1)
  const previous = shiftMonth(year, month, -1)
  const nextMonth = monthKey(next.year, next.month)
  const previousMonth = monthKey(previous.year, previous.month)
  const start = `${currentMonth}-01T00:00:00.000Z`
  const nextStart = `${nextMonth}-01T00:00:00.000Z`

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [
    { data: profile },
    { data: categories },
    { data: budgets },
    { data: transactions },
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('currency_code')
      .eq('id', user.id)
      .maybeSingle(),
    supabase
      .from('categories')
      .select('id, name')
      .eq('user_id', user.id)
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true }),
    supabase
      .from('budgets')
      .select('id, category_id, amount')
      .eq('user_id', user.id)
      .eq('month_start', currentMonthDate),
    supabase
      .from('transactions')
      .select('category_id, amount, transaction_type')
      .eq('user_id', user.id)
      .eq('transaction_type', 'expense')
      .gte('occurred_at', start)
      .lt('occurred_at', nextStart),
  ])

  const currency = profile?.currency_code ?? 'EUR'
  const budgetsByCategory = new Map(
    (budgets ?? []).map((budget) => [
      budget.category_id,
      Number(budget.amount),
    ]),
  )
  const spentByCategory = new Map<string, number>()
  for (const transaction of transactions ?? []) {
    if (!transaction.category_id) continue
    spentByCategory.set(
      transaction.category_id,
      (spentByCategory.get(transaction.category_id) ?? 0) +
        Number(transaction.amount),
    )
  }
  const rows = (categories ?? [])
    .map((category) => ({
      ...category,
      budget: budgetsByCategory.get(category.id) ?? null,
      spent: spentByCategory.get(category.id) ?? 0,
    }))
    .filter((row) => row.budget !== null || row.spent > 0)
  const totalBudget = rows.reduce((sum, row) => sum + (row.budget ?? 0), 0)
  const totalSpent = rows.reduce((sum, row) => sum + row.spent, 0)
  const totalRemaining = totalBudget - totalSpent
  const monthLabel = formatMonth(new Date(Date.UTC(year, month - 1, 1)))
  const availableCategories = categories ?? []

  return (
    <main className="moneyflow-shell py-6 sm:py-10">
      <div className="flex items-center justify-between gap-3">
        <Button asChild size="sm" variant="ghost">
          <Link href="/dashboard">
            <ArrowLeft className="size-4" /> Início
          </Link>
        </Button>
        <div className="flex items-center gap-1">
          <Button asChild size="icon" variant="ghost" aria-label="Mês anterior">
            <Link href={`/dashboard/budgets?month=${previousMonth}`}>
              <ChevronLeft className="size-4" />
            </Link>
          </Button>
          <Button asChild size="icon" variant="ghost" aria-label="Mês seguinte">
            <Link href={`/dashboard/budgets?month=${nextMonth}`}>
              <ChevronRight className="size-4" />
            </Link>
          </Button>
        </div>
      </div>

      <header className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm capitalize text-[hsl(var(--muted-foreground))]">
            Planeamento · {monthLabel}
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl lg:text-4xl">
            Orçamentos
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[hsl(var(--muted-foreground))]">
            Define limites mensais por categoria e compara-os com o que
            realmente gastaste.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="#novo-orcamento">
            <Plus className="size-4" /> Novo orçamento
          </Link>
        </Button>
      </header>

      {params.error ? (
        <p
          role="alert"
          className="mt-5 rounded-[var(--radius-md)] bg-[hsl(var(--danger)/0.08)] px-3 py-2 text-sm"
        >
          {params.error}
        </p>
      ) : null}

      <section className="mt-6 grid gap-3 sm:grid-cols-3">
        <article className="rounded-[var(--radius-lg)] border bg-[hsl(var(--surface))] p-5 shadow-sm">
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            Orçamento
          </p>
          <p className="mt-2 text-2xl font-semibold tabular-nums">
            {formatCurrency(totalBudget, currency)}
          </p>
        </article>
        <article className="rounded-[var(--radius-lg)] border bg-[hsl(var(--surface))] p-5 shadow-sm">
          <p className="text-sm text-[hsl(var(--muted-foreground))]">Gasto</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums">
            {formatCurrency(totalSpent, currency)}
          </p>
        </article>
        <article className="rounded-[var(--radius-lg)] border bg-[hsl(var(--surface))] p-5 shadow-sm">
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            Disponível
          </p>
          <p
            className={`mt-2 text-2xl font-semibold tabular-nums ${totalRemaining < 0 ? 'text-[hsl(var(--danger))]' : ''}`}
          >
            {formatCurrency(totalRemaining, currency)}
          </p>
        </article>
      </section>

      <section className="mt-8">
        <div>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            Por categoria
          </p>
          <h2 className="mt-1 text-lg font-semibold">Controlo de gastos</h2>
        </div>
        {!rows.length ? (
          <div className="mt-4 rounded-[var(--radius-lg)] border border-dashed bg-[hsl(var(--surface))] p-8 text-center">
            <WalletCards className="mx-auto size-6" />
            <h3 className="mt-4 font-medium">
              Ainda não existem dados neste mês
            </h3>
            <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-[hsl(var(--muted-foreground))]">
              Cria um orçamento por categoria para começares a acompanhar os
              teus limites mensais.
            </p>
          </div>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {rows.map((row) => {
              const budget = row.budget ?? 0
              const percentage =
                budget > 0 ? Math.round((row.spent / budget) * 100) : 100
              const clamped = Math.min(100, percentage)
              const over = row.spent > budget && row.budget !== null
              return (
                <article
                  key={row.id}
                  className="rounded-[var(--radius-lg)] border bg-[hsl(var(--surface))] p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-medium">{row.name}</h3>
                      <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
                        {row.budget === null
                          ? 'Sem orçamento definido'
                          : `Limite ${formatCurrency(budget, currency)}`}
                      </p>
                    </div>
                    <span
                      className={`text-sm font-semibold tabular-nums ${over ? 'text-[hsl(var(--danger))]' : ''}`}
                    >
                      {row.budget === null ? '—' : `${percentage}%`}
                    </span>
                  </div>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-[hsl(var(--surface-muted))]">
                    <div
                      className={`h-full rounded-full ${over ? 'bg-[hsl(var(--danger))]' : 'bg-[hsl(var(--primary))]'}`}
                      style={{ width: `${clamped}%` }}
                    />
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3 text-sm">
                    <span className="tabular-nums">
                      {formatCurrency(row.spent, currency)} gastos
                    </span>
                    {row.budget !== null ? (
                      <span
                        className={`tabular-nums ${over ? 'font-medium text-[hsl(var(--danger))]' : 'text-[hsl(var(--muted-foreground))]'}`}
                      >
                        {over
                          ? `+${formatCurrency(row.spent - budget, currency)}`
                          : `${formatCurrency(Math.max(0, budget - row.spent), currency)} restantes`}
                      </span>
                    ) : null}
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>

      <section
        id="novo-orcamento"
        className="mt-8 rounded-[var(--radius-lg)] border bg-[hsl(var(--surface))] p-5 shadow-sm sm:p-6"
      >
        <div>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            Configuração
          </p>
          <h2 className="mt-1 text-lg font-semibold">Definir orçamento</h2>
          <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
            Guardar outra vez a mesma categoria neste mês atualiza o limite
            existente.
          </p>
        </div>
        {availableCategories.length ? (
          <form
            action={upsertBudget}
            className="mt-5 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
          >
            <input type="hidden" name="month" value={currentMonth} />
            <label className="grid gap-2 text-sm font-medium">
              Categoria
              <select
                name="categoryId"
                required
                className="min-h-11 rounded-[var(--radius-md)] border bg-transparent px-3 font-normal outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
              >
                <option value="">Selecionar categoria</option>
                {availableCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Limite mensal
              <input
                name="amount"
                type="text"
                inputMode="decimal"
                autoComplete="off"
                placeholder="Ex.: 150,00"
                required
                className="min-h-11 rounded-[var(--radius-md)] border bg-transparent px-3 font-normal outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
              />
            </label>
            <Button type="submit" className="w-full sm:w-auto">
              Guardar
            </Button>
          </form>
        ) : (
          <div className="mt-5 flex flex-col gap-3 rounded-xl border border-dashed p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              Cria primeiro uma categoria para poderes definir um orçamento.
            </p>
            <Button asChild variant="outline">
              <Link href="/dashboard/categories">
                <Plus className="size-4" /> Criar categoria
              </Link>
            </Button>
          </div>
        )}
      </section>
    </main>
  )
}
