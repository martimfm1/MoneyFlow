import Link from 'next/link'
import {
  ArrowDownLeft,
  CalendarClock,
  Pause,
  Play,
  Plus,
  Trash2,
} from 'lucide-react'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatDate } from '@/lib/format'
import {
  createRecurringIncome,
  deleteRecurringIncome,
  toggleRecurringIncome,
} from './actions'

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
      .select(
        'id, name, source, amount, frequency, next_income_date, currency_code, is_active, notes',
      )
      .eq('user_id', user.id)
      .order('is_active', { ascending: false })
      .order('next_income_date', { ascending: true }),
  ])

  const currency = profile?.currency_code ?? 'EUR'
  const items = (incomes ?? []) as RecurringIncome[]
  const activeItems = items.filter((item) => item.is_active)
  const monthlyTotal = activeItems.reduce(
    (sum, item) => sum + monthlyIncome(item),
    0,
  )
  const yearlyTotal = activeItems.reduce(
    (sum, item) => sum + yearlyIncome(item),
    0,
  )
  const nextIncome = activeItems[0]
  const dueSoon = activeItems.filter((item) => {
    const days = daysUntil(item.next_income_date)
    return days >= 0 && days <= 30
  }).length

  return (
    <main className="moneyflow-shell py-6 sm:py-10">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Link
            href="/dashboard/recurring"
            className="text-sm text-[hsl(var(--muted-foreground))] hover:underline"
          >
            ← Recorrentes
          </Link>
          <p className="mt-4 text-sm text-[hsl(var(--muted-foreground))]">
            Planeamento financeiro
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl lg:text-4xl">
            Ganhos recorrentes
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[hsl(var(--muted-foreground))]">
            Regista salários, trabalhos, rendimentos e outras entradas que se
            repetem para teres uma previsão mensal mais realista.
          </p>
        </div>
        <Button asChild>
          <Link href="#novo-ganho">
            <Plus className="size-4" /> Novo ganho
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

      <section className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <article className="rounded-[var(--radius-lg)] border bg-[hsl(var(--surface))] p-4 shadow-sm sm:p-5">
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            Ganho mensal previsto
          </p>
          <p className="mt-2 text-2xl font-semibold tabular-nums">
            {formatCurrency(monthlyTotal, currency)}
          </p>
        </article>
        <article className="rounded-[var(--radius-lg)] border bg-[hsl(var(--surface))] p-4 shadow-sm sm:p-5">
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            Ganho anual previsto
          </p>
          <p className="mt-2 text-2xl font-semibold tabular-nums">
            {formatCurrency(yearlyTotal, currency)}
          </p>
        </article>
        <article className="rounded-[var(--radius-lg)] border bg-[hsl(var(--surface))] p-4 shadow-sm sm:p-5">
          <div className="flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))]">
            <CalendarClock className="size-4" /> Próximo ganho
          </div>
          <p className="mt-2 font-semibold">
            {nextIncome
              ? formatDate(`${nextIncome.next_income_date}T00:00:00`)
              : '—'}
          </p>
          <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
            {nextIncome?.name ?? 'Sem ganhos ativos'}
          </p>
        </article>
        <article className="rounded-[var(--radius-lg)] border bg-[hsl(var(--surface))] p-4 shadow-sm sm:p-5">
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            A receber em 30 dias
          </p>
          <p className="mt-2 text-2xl font-semibold tabular-nums">{dueSoon}</p>
          <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
            entradas previstas
          </p>
        </article>
      </section>

      <section className="mt-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              Os teus rendimentos
            </p>
            <h2 className="mt-1 text-lg font-semibold">Ganhos recorrentes</h2>
          </div>
          <span className="text-sm text-[hsl(var(--muted-foreground))]">
            {items.length} {items.length === 1 ? 'item' : 'itens'}
          </span>
        </div>

        {!items.length ? (
          <div className="mt-4 rounded-[var(--radius-lg)] border border-dashed bg-[hsl(var(--surface))] p-8 text-center">
            <ArrowDownLeft className="mx-auto size-6" />
            <h3 className="mt-4 font-medium">Ainda não tens ganhos recorrentes</h3>
            <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-[hsl(var(--muted-foreground))]">
              Adiciona o teu salário, recibos ou outros rendimentos previsíveis e
              passa a ter uma estimativa mensal mais completa.
            </p>
          </div>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => {
              const days = daysUntil(item.next_income_date)
              const itemCurrency = item.currency_code || currency
              return (
                <article
                  key={item.id}
                  className={`flex min-h-full flex-col rounded-[var(--radius-lg)] border bg-[hsl(var(--surface))] p-5 shadow-sm ${item.is_active ? '' : 'opacity-70'}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate font-semibold">{item.name}</h3>
                      <p className="mt-1 truncate text-xs text-[hsl(var(--muted-foreground))]">
                        {item.source || 'Sem origem'} · {frequencyLabels[item.frequency]}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-[hsl(var(--surface-muted))] px-2 py-1 text-xs font-medium">
                      {item.is_active ? 'Ativo' : 'Pausado'}
                    </span>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <div className="rounded-[var(--radius-md)] bg-[hsl(var(--surface-muted))] p-3">
                      <p className="text-xs text-[hsl(var(--muted-foreground))]">
                        Por entrada
                      </p>
                      <p className="mt-1 font-semibold tabular-nums">
                        {formatCurrency(Number(item.amount), itemCurrency)}
                      </p>
                    </div>
                    <div className="rounded-[var(--radius-md)] bg-[hsl(var(--surface-muted))] p-3">
                      <p className="text-xs text-[hsl(var(--muted-foreground))]">
                        Equiv. mensal
                      </p>
                      <p className="mt-1 font-semibold tabular-nums">
                        {formatCurrency(monthlyIncome(item), itemCurrency)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-[hsl(var(--muted-foreground))]">
                        Equiv. anual
                      </p>
                      <p className="mt-1 font-medium tabular-nums">
                        {formatCurrency(yearlyIncome(item), itemCurrency)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-[hsl(var(--muted-foreground))]">
                        Próxima entrada
                      </p>
                      <p className="mt-1 font-medium">
                        {formatDate(`${item.next_income_date}T00:00:00`)}
                      </p>
                      {item.is_active && days >= 0 && days <= 30 ? (
                        <p className="mt-0.5 text-xs text-[hsl(var(--success))]">
                          {days === 0 ? 'Hoje' : `Em ${days} dias`}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  {item.notes ? (
                    <p className="mt-4 line-clamp-2 text-sm leading-6 text-[hsl(var(--muted-foreground))]">
                      {item.notes}
                    </p>
                  ) : null}

                  <div className="mt-auto flex flex-wrap items-center gap-2 pt-5">
                    <form action={toggleRecurringIncome}>
                      <input type="hidden" name="id" value={item.id} />
                      <input
                        type="hidden"
                        name="isActive"
                        value={item.is_active ? 'false' : 'true'}
                      />
                      <Button type="submit" size="sm" variant="outline">
                        {item.is_active ? (
                          <>
                            <Pause className="size-4" /> Pausar
                          </>
                        ) : (
                          <>
                            <Play className="size-4" /> Ativar
                          </>
                        )}
                      </Button>
                    </form>
                    <form action={deleteRecurringIncome}>
                      <input type="hidden" name="id" value={item.id} />
                      <Button type="submit" size="sm" variant="ghost">
                        <Trash2 className="size-4" /> Apagar
                      </Button>
                    </form>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>

      <section
        id="novo-ganho"
        className="mt-8 rounded-[var(--radius-lg)] border bg-[hsl(var(--surface))] p-5 shadow-sm sm:p-6"
      >
        <div>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">Novo rendimento</p>
          <h2 className="mt-1 text-lg font-semibold">Adicionar ganho recorrente</h2>
          <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
            Usa a periodicidade real da entrada. O MoneyFlow converte-a para um
            equivalente mensal e anual para facilitar o planeamento.
          </p>
        </div>

        <form
          action={createRecurringIncome}
          className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          <label className="grid gap-2 text-sm font-medium">
            Nome
            <input
              name="name"
              required
              maxLength={120}
              placeholder="Ex.: Salário"
              className="min-h-11 rounded-[var(--radius-md)] border bg-transparent px-3 font-normal outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
            />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Origem
            <input
              name="source"
              maxLength={120}
              placeholder="Ex.: Empresa · Cliente X"
              className="min-h-11 rounded-[var(--radius-md)] border bg-transparent px-3 font-normal outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
            />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Valor da entrada
            <input
              name="amount"
              type="number"
              inputMode="decimal"
              min="0.01"
              step="0.01"
              required
              placeholder="0,00"
              className="min-h-11 rounded-[var(--radius-md)] border bg-transparent px-3 font-normal tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
            />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Frequência
            <select
              name="frequency"
              defaultValue="monthly"
              className="min-h-11 rounded-[var(--radius-md)] border bg-[hsl(var(--surface))] px-3 font-normal outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
            >
              <option value="monthly">Mensal</option>
              <option value="quarterly">Trimestral</option>
              <option value="yearly">Anual</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Próxima entrada
            <input
              name="nextIncomeDate"
              type="date"
              defaultValue={new Date().toISOString().slice(0, 10)}
              required
              className="min-h-11 rounded-[var(--radius-md)] border bg-transparent px-3 font-normal outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
            />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Moeda
            <input
              name="currencyCode"
              required
              maxLength={3}
              defaultValue={currency}
              className="min-h-11 rounded-[var(--radius-md)] border bg-transparent px-3 font-normal uppercase outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
            />
          </label>
          <label className="grid gap-2 text-sm font-medium sm:col-span-2 lg:col-span-3">
            Notas
            <textarea
              name="notes"
              maxLength={500}
              rows={3}
              placeholder="Ex.: vencimento no último dia útil do mês"
              className="rounded-[var(--radius-md)] border bg-transparent px-3 py-2 font-normal outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
            />
          </label>
          <div className="sm:col-span-2 lg:col-span-3">
            <Button type="submit" className="w-full sm:w-auto">
              <Plus className="size-4" /> Guardar ganho recorrente
            </Button>
          </div>
        </form>
      </section>
    </main>
  )
}
