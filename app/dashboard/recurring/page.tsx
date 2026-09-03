import Link from 'next/link'
import { CalendarClock, CircleDollarSign, Pause, Play, Plus, RefreshCw } from 'lucide-react'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatDate } from '@/lib/format'
import { createRecurringExpense, toggleRecurringExpense } from './actions'
import { DeleteRecurringExpenseButton } from './delete-button'

export const dynamic = 'force-dynamic'

type SearchParams = { error?: string }

type RecurringExpense = {
  id: string
  name: string
  provider: string | null
  amount: number | string
  frequency: 'monthly' | 'quarterly' | 'yearly'
  next_due_date: string
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

function monthlyReserve(expense: RecurringExpense) {
  return Number(expense.amount) / monthlyDivisors[expense.frequency]
}

function yearlyCost(expense: RecurringExpense) {
  return Number(expense.amount) * yearlyMultipliers[expense.frequency]
}

function daysUntil(dateString: string) {
  const due = new Date(`${dateString}T00:00:00Z`)
  const today = new Date()
  const todayUtc = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()),
  )
  return Math.ceil((due.getTime() - todayUtc.getTime()) / 86400000)
}

export default async function RecurringExpensesPage({
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

  const [{ data: profile }, { data: expenses }] = await Promise.all([
    supabase
      .from('profiles')
      .select('currency_code')
      .eq('id', user.id)
      .maybeSingle(),
    supabase
      .from('recurring_expenses')
      .select(
        'id, name, provider, amount, frequency, next_due_date, currency_code, is_active, notes',
      )
      .eq('user_id', user.id)
      .order('is_active', { ascending: false })
      .order('next_due_date', { ascending: true }),
  ])

  const currency = profile?.currency_code ?? 'EUR'
  const items = (expenses ?? []) as RecurringExpense[]
  const activeItems = items.filter((item) => item.is_active)
  const monthlyTotal = activeItems.reduce((sum, item) => sum + monthlyReserve(item), 0)
  const yearlyTotal = activeItems.reduce((sum, item) => sum + yearlyCost(item), 0)
  const nextDue = activeItems
    .slice()
    .sort((a, b) => a.next_due_date.localeCompare(b.next_due_date))[0]
  const dueSoon = activeItems.filter((item) => {
    const days = daysUntil(item.next_due_date)
    return days >= 0 && days <= 30
  }).length

  return (
    <main className="moneyflow-shell py-6 sm:py-10">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            Planeamento financeiro
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
            Despesas recorrentes
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[hsl(var(--muted-foreground))]">
            Simula e acompanha domínios, alojamento, software e outras
            subscrições para saberes quanto deves reservar antes de chegar a
            cobrança.
          </p>
        </div>
        <Button asChild>
          <Link href="#nova-despesa">
            <Plus className="size-4" /> Nova despesa
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
          <div className="flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))]">
            <CircleDollarSign className="size-4" /> Reserva mensal
          </div>
          <p className="mt-2 text-2xl font-semibold tabular-nums">
            {formatCurrency(monthlyTotal, currency)}
          </p>
        </article>
        <article className="rounded-[var(--radius-lg)] border bg-[hsl(var(--surface))] p-4 shadow-sm sm:p-5">
          <div className="flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))]">
            <RefreshCw className="size-4" /> Custo anual
          </div>
          <p className="mt-2 text-2xl font-semibold tabular-nums">
            {formatCurrency(yearlyTotal, currency)}
          </p>
        </article>
        <article className="rounded-[var(--radius-lg)] border bg-[hsl(var(--surface))] p-4 shadow-sm sm:p-5">
          <div className="flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))]">
            <CalendarClock className="size-4" /> Próxima cobrança
          </div>
          <p className="mt-2 font-semibold">
            {nextDue ? formatDate(`${nextDue.next_due_date}T00:00:00`) : '—'}
          </p>
          <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
            {nextDue?.name ?? 'Sem despesas ativas'}
          </p>
        </article>
        <article className="rounded-[var(--radius-lg)] border bg-[hsl(var(--surface))] p-4 shadow-sm sm:p-5">
          <p className="text-sm text-[hsl(var(--muted-foreground))]">A vencer em 30 dias</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums">{dueSoon}</p>
          <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
            cobranças próximas
          </p>
        </article>
      </section>

      <section className="mt-8 rounded-[var(--radius-lg)] border bg-[hsl(var(--surface))] p-5 shadow-sm sm:p-6">
        <div className="flex items-start gap-3">
          <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[hsl(var(--surface-muted))]">
            <RefreshCw className="size-4" />
          </span>
          <div>
            <h2 className="font-medium">Como funciona o simulador</h2>
            <p className="mt-1 text-sm leading-6 text-[hsl(var(--muted-foreground))]">
              Um domínio de 20€ por ano representa uma reserva de 1,67€ por mês;
              uma subscrição de 10€ por mês representa 120€ por ano. Assim podes
              transformar cobranças irregulares num valor mensal previsível.
            </p>
          </div>
        </div>
      </section>

      <section className="mt-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Os teus custos</p>
            <h2 className="mt-1 text-lg font-semibold">Domínios e subscrições</h2>
          </div>
          <span className="text-sm text-[hsl(var(--muted-foreground))]">
            {items.length} {items.length === 1 ? 'item' : 'itens'}
          </span>
        </div>

        {!items.length ? (
          <div className="mt-4 rounded-[var(--radius-lg)] border border-dashed bg-[hsl(var(--surface))] p-8 text-center">
            <CalendarClock className="mx-auto size-6" />
            <h3 className="mt-4 font-medium">Ainda não tens despesas recorrentes</h3>
            <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-[hsl(var(--muted-foreground))]">
              Adiciona o primeiro domínio ou serviço e começa a calcular o valor
              que precisas de reservar todos os meses.
            </p>
          </div>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => {
              const days = daysUntil(item.next_due_date)
              const reserve = monthlyReserve(item)
              const annual = yearlyCost(item)
              return (
                <article
                  key={item.id}
                  className={`flex min-h-full flex-col rounded-[var(--radius-lg)] border bg-[hsl(var(--surface))] p-5 shadow-sm ${item.is_active ? '' : 'opacity-70'}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate font-semibold">{item.name}</h3>
                      <p className="mt-1 truncate text-xs text-[hsl(var(--muted-foreground))]">
                        {item.provider || 'Sem fornecedor'} · {frequencyLabels[item.frequency]}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-[hsl(var(--surface-muted))] px-2 py-1 text-xs font-medium">
                      {item.is_active ? 'Ativa' : 'Pausada'}
                    </span>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <div className="rounded-[var(--radius-md)] bg-[hsl(var(--surface-muted))] p-3">
                      <p className="text-xs text-[hsl(var(--muted-foreground))]">Cobrança</p>
                      <p className="mt-1 font-semibold tabular-nums">
                        {formatCurrency(Number(item.amount), item.currency_code || currency)}
                      </p>
                    </div>
                    <div className="rounded-[var(--radius-md)] bg-[hsl(var(--surface-muted))] p-3">
                      <p className="text-xs text-[hsl(var(--muted-foreground))]">Reserva/mês</p>
                      <p className="mt-1 font-semibold tabular-nums">
                        {formatCurrency(reserve, item.currency_code || currency)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-[hsl(var(--muted-foreground))]">Custo anual</p>
                      <p className="mt-1 font-medium tabular-nums">
                        {formatCurrency(annual, item.currency_code || currency)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-[hsl(var(--muted-foreground))]">Próxima cobrança</p>
                      <p className="mt-1 font-medium">
                        {formatDate(`${item.next_due_date}T00:00:00`)}
                      </p>
                      {item.is_active && days >= 0 && days <= 30 ? (
                        <p className="mt-0.5 text-xs text-[hsl(var(--danger))]">
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
                    <form action={toggleRecurringExpense}>
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
                    <DeleteRecurringExpenseButton id={item.id} name={item.name} />
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>

      <section
        id="nova-despesa"
        className="mt-8 rounded-[var(--radius-lg)] border bg-[hsl(var(--surface))] p-5 shadow-sm sm:p-6"
      >
        <div>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">Simulador</p>
          <h2 className="mt-1 text-lg font-semibold">Adicionar despesa recorrente</h2>
          <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
            Para domínios anuais, escolhe “Anual”. Para SaaS, alojamento ou outras
            cobranças frequentes, escolhe a periodicidade correspondente.
          </p>
        </div>

        <form action={createRecurringExpense} className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <label className="grid gap-2 text-sm font-medium">
            Nome
            <input
              name="name"
              required
              maxLength={120}
              placeholder="Ex.: domínio cliente.pt"
              className="min-h-11 rounded-[var(--radius-md)] border bg-transparent px-3 font-normal outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
            />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Fornecedor / cliente
            <input
              name="provider"
              maxLength={120}
              placeholder="Ex.: Porkbun · Cliente X"
              className="min-h-11 rounded-[var(--radius-md)] border bg-transparent px-3 font-normal outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
            />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Valor da cobrança
            <input
              name="amount"
              type="number"
              inputMode="decimal"
              min="0.01"
              step="0.01"
              required
              placeholder="20,00"
              className="min-h-11 rounded-[var(--radius-md)] border bg-transparent px-3 font-normal outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
            />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Periodicidade
            <select
              name="frequency"
              defaultValue="yearly"
              className="min-h-11 rounded-[var(--radius-md)] border bg-[hsl(var(--surface))] px-3 font-normal outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
            >
              <option value="monthly">Mensal</option>
              <option value="quarterly">Trimestral</option>
              <option value="yearly">Anual</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Próxima cobrança
            <input
              name="nextDueDate"
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
              defaultValue={currency}
              maxLength={3}
              pattern="[A-Z]{3}"
              required
              className="min-h-11 rounded-[var(--radius-md)] border bg-transparent px-3 font-normal uppercase outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
            />
          </label>
          <label className="grid gap-2 text-sm font-medium sm:col-span-2 lg:col-span-3">
            Notas
            <textarea
              name="notes"
              maxLength={500}
              rows={3}
              placeholder="Ex.: renovação anual do domínio do cliente, inclui privacidade..."
              className="rounded-[var(--radius-md)] border bg-transparent px-3 py-2 font-normal outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
            />
          </label>
          <div className="flex items-end sm:col-span-2 lg:col-span-3">
            <Button type="submit" className="w-full sm:w-auto">
              Guardar despesa
            </Button>
          </div>
        </form>
      </section>
    </main>
  )
}
