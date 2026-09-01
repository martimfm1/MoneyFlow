import Link from 'next/link'
import { ArrowLeft, TrendingDown, TrendingUp } from 'lucide-react'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'
import { FinancialCharts } from '@/components/analytics/financial-charts'

export const dynamic = 'force-dynamic'

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat('pt-PT', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount)
}

function monthKey(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`
}

function monthStart(date: Date, offset: number) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + offset, 1))
}

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const now = new Date()
  const start = monthStart(now, -5)
  const end = monthStart(now, 1)

  const [{ data: profile }, { data: transactions }] = await Promise.all([
    supabase
      .from('profiles')
      .select('currency_code')
      .eq('id', user.id)
      .maybeSingle(),
    supabase
      .from('transactions')
      .select('transaction_type, amount, occurred_at, category_id, categories(name)')
      .eq('user_id', user.id)
      .gte('occurred_at', start.toISOString())
      .lt('occurred_at', end.toISOString())
      .order('occurred_at', { ascending: true }),
  ])

  const currency = profile?.currency_code ?? 'EUR'
  const monthlyMap = new Map<string, { label: string; income: number; expense: number }>()

  for (let offset = -5; offset <= 0; offset += 1) {
    const date = monthStart(now, offset)
    const key = monthKey(date)
    monthlyMap.set(key, {
      label: new Intl.DateTimeFormat('pt-PT', { month: 'short' }).format(date).replace('.', ''),
      income: 0,
      expense: 0,
    })
  }

  const categoryMap = new Map<string, number>()
  let incomeTotal = 0
  let expenseTotal = 0

  for (const transaction of transactions ?? []) {
    const amount = Number(transaction.amount)
    const key = transaction.occurred_at.slice(0, 7)
    const point = monthlyMap.get(key)
    if (transaction.transaction_type === 'income') {
      incomeTotal += amount
      if (point) point.income += amount
    } else {
      expenseTotal += amount
      if (point) point.expense += amount
      const category = Array.isArray(transaction.categories)
        ? transaction.categories[0]
        : transaction.categories
      const categoryName = category?.name ?? 'Sem categoria'
      categoryMap.set(categoryName, (categoryMap.get(categoryName) ?? 0) + amount)
    }
  }

  const monthly = Array.from(monthlyMap.values())
  const categories = Array.from(categoryMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)

  const net = incomeTotal - expenseTotal

  return (
    <main className="moneyflow-shell py-6 sm:py-10">
      <Button asChild size="sm" variant="ghost">
        <Link href="/dashboard">
          <ArrowLeft className="size-4" /> Início
        </Link>
      </Button>

      <header className="mt-5">
        <p className="text-sm text-[hsl(var(--muted-foreground))]">Understand</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Analytics</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[hsl(var(--muted-foreground))]">
          Percebe para onde está a ir o teu dinheiro sem estimativas: tudo aqui é calculado a partir dos teus movimentos.
        </p>
      </header>

      <section className="mt-6 grid gap-3 sm:grid-cols-3">
        <article className="rounded-[var(--radius-lg)] border bg-[hsl(var(--surface))] p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))]">
            <TrendingUp className="size-4" /> Receitas
          </div>
          <p className="mt-2 text-xl font-semibold tabular-nums">{formatMoney(incomeTotal, currency)}</p>
        </article>
        <article className="rounded-[var(--radius-lg)] border bg-[hsl(var(--surface))] p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))]">
            <TrendingDown className="size-4" /> Despesas
          </div>
          <p className="mt-2 text-xl font-semibold tabular-nums">{formatMoney(expenseTotal, currency)}</p>
        </article>
        <article className="rounded-[var(--radius-lg)] border bg-[hsl(var(--surface))] p-4 shadow-sm">
          <p className="text-sm text-[hsl(var(--muted-foreground))]">Saldo líquido</p>
          <p className={`mt-2 text-xl font-semibold tabular-nums ${net < 0 ? 'text-[hsl(var(--danger))]' : 'text-[hsl(var(--success))]'}`}>
            {net >= 0 ? '+' : ''}{formatMoney(net, currency)}
          </p>
        </article>
      </section>

      <section className="mt-8">
        <FinancialCharts monthly={monthly} categories={categories} currency={currency} />
      </section>

      <section className="mt-8 rounded-[var(--radius-lg)] border bg-[hsl(var(--surface))] p-5 shadow-sm sm:p-6">
        <div>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">Leitura rápida</p>
          <h2 className="mt-1 text-lg font-semibold">O que os dados dizem</h2>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-[var(--radius-md)] bg-[hsl(var(--surface-muted))] p-4">
            <p className="text-sm font-medium">Maior categoria de despesa</p>
            <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
              {categories[0]
                ? `${categories[0].name}: ${formatMoney(categories[0].value, currency)}`
                : 'Ainda não existem despesas categorizadas.'}
            </p>
          </div>
          <div className="rounded-[var(--radius-md)] bg-[hsl(var(--surface-muted))] p-4">
            <p className="text-sm font-medium">Taxa de poupança do período</p>
            <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
              {incomeTotal > 0 ? `${Math.round((net / incomeTotal) * 100)}% das receitas ficaram após despesas.` : 'Ainda não existem receitas no período.'}
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
