import Link from 'next/link'
import { ArrowDownLeft, CalendarClock, ChevronLeft } from 'lucide-react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatDate } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { RecurringIncomeCreateDialog } from './create-dialog'
import { RecurringIncomeActionMenu } from './action-menu'

export const dynamic = 'force-dynamic'

type SearchParams = { error?: string }

type RecurringIncome = {
  id: string
  name: string
  source: string | null
  amount: number | string
  frequency: 'monthly' | 'quarterly' | 'yearly'
  next_income_date: string
  currency_code: string
  is_active: boolean
  notes: string | null
}

const frequencyLabels = {
  monthly: 'Mensal',
  quarterly: 'Trimestral',
  yearly: 'Anual',
} as const

const yearlyMultipliers = {
  monthly: 12,
  quarterly: 4,
  yearly: 1,
} as const

const monthlyDivisors = {
  monthly: 1,
  quarterly: 3,
  yearly: 12,
} as const

function monthlyIncome(income: RecurringIncome) {
  return Number(income.amount) / monthlyDivisors[income.frequency]
}

function yearlyIncome(income: RecurringIncome) {
  return Number(income.amount) * yearlyMultipliers[income.frequency]
}

function daysUntil(dateString: string) {
  const due = new Date(`${dateString}T00:00:00Z`)
  const today = new Date()
  const todayUtc = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()),
  )
  return Math.ceil((due.getTime() - todayUtc.getTime()) / 86400000)
}

export default async function RecurringIncomePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: incomes }] = await Promise.all([
    supabase
      .from('profiles')
      .select('currency_code')
      .eq('id', user.id)
      .maybeSingle(),
    supabase
      .from('recurring_incomes')
      .select('id, name, source, amount, frequency, next_income_date, currency_code, is_active, notes')
      .eq('user_id', user.id)
      .order('is_active', { ascending: false })
      .order('next_income_date', { ascending: true }),
  ])

  const currency = profile?.currency_code ?? 'EUR'
  const items = (incomes ?? []) as RecurringIncome[]
  const activeItems = items.filter((item) => item.is_active)
  const monthlyTotal = activeItems.reduce((sum, item) => sum + monthlyIncome(item), 0)
  const yearlyTotal = activeItems.reduce((sum, item) => sum + yearlyIncome(item), 0)
  const nextIncome = activeItems[0]
  const dueSoon = activeItems.filter((item) => {
    const days = daysUntil(item.next_income_date)
    return days >= 0 && days <= 30
  }).length

  return (
    <main className="moneyflow-shell py-6 sm:py-10">
      <header className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-2">
          <Button asChild size="icon" variant="ghost" aria-label="Voltar">
            <Link href="/dashboard/recurring">
              <ChevronLeft className="size-4" />
            </Link>
          </Button>
          <h1 className="truncate text-2xl font-semibold tracking-tight sm:text-3xl">
            Ganhos recorrentes
          </h1>
        </div>
        <RecurringIncomeCreateDialog currency={currency} />
      </header>

      <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <article className="rounded-[var(--radius-lg)] border bg-[hsl(var(--surface))] p-4 shadow-sm">
          <p className="text-xs font-medium text-[hsl(var(--muted-foreground))]">Mensal</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums">{formatCurrency(monthlyTotal, currency)}</p>
        </article>
        <article className="rounded-[var(--radius-lg)] border bg-[hsl(var(--surface))] p-4 shadow-sm">
          <p className="text-xs font-medium text-[hsl(var(--muted-foreground))]">Anual</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums">{formatCurrency(yearlyTotal, currency)}</p>
        </article>
        <article className="rounded-[var(--radius-lg)] border bg-[hsl(var(--surface))] p-4 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-medium text-[hsl(var(--muted-foreground))]">
            <CalendarClock className="size-4" /> Próximo
          </div>
          <p className="mt-2 font-semibold">{nextIncome ? formatDate(`${nextIncome.next_income_date}T00:00:00`) : '—'}</p>
        </article>
        <article className="rounded-[var(--radius-lg)] border bg-[hsl(var(--surface))] p-4 shadow-sm">
          <p className="text-xs font-medium text-[hsl(var(--muted-foreground))]">30 dias</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums">{dueSoon}</p>
        </article>
      </section>

      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Rendimentos</h2>
          <span className="text-xs text-[hsl(var(--muted-foreground))]">{items.length}</span>
        </div>

        {!items.length ? (
          <div className="rounded-[var(--radius-lg)] border border-dashed bg-[hsl(var(--surface))] p-10 text-center">
            <ArrowDownLeft className="mx-auto size-6 text-[hsl(var(--muted-foreground))]" />
            <p className="mt-3 text-sm font-medium">Sem ganhos</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => {
              const itemCurrency = item.currency_code || currency
              const days = daysUntil(item.next_income_date)
              return (
                <article key={item.id} className={`rounded-[var(--radius-lg)] border bg-[hsl(var(--surface))] p-4 shadow-sm ${item.is_active ? '' : 'opacity-60'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate font-semibold">{item.name}</h3>
                      <p className="mt-1 truncate text-xs text-[hsl(var(--muted-foreground))]">
                        {item.source || '—'} · {frequencyLabels[item.frequency]}
                      </p>
                    </div>
                    <RecurringIncomeActionMenu id={item.id} name={item.name} isActive={item.is_active} />
                  </div>
                  <div className="mt-5 flex items-end justify-between gap-4">
                    <div>
                      <p className="text-2xl font-semibold tabular-nums">{formatCurrency(Number(item.amount), itemCurrency)}</p>
                      <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
                        {formatCurrency(monthlyIncome(item), itemCurrency)}/mês
                      </p>
                    </div>
                    <div className="text-right text-xs">
                      <p className="text-[hsl(var(--muted-foreground))]">Próximo</p>
                      <p className="mt-1 font-medium">{formatDate(`${item.next_income_date}T00:00:00`)}</p>
                      {item.is_active && days >= 0 && days <= 30 ? (
                        <p className="mt-1 text-[hsl(var(--success))]">{days === 0 ? 'Hoje' : `${days}d`}</p>
                      ) : null}
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>

      {params.error ? null : null}
    </main>
  )
}
