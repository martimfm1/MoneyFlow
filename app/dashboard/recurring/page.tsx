import Link from 'next/link'
import {
  CalendarClock,
  CircleDollarSign,
  ExternalLink,
  RefreshCw,
} from 'lucide-react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatDate } from '@/lib/format'
import { RecurringChart } from '@/components/recurring-chart'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { Separator } from '@/components/ui/separator'
import { RecurringExpenseCreateDialog } from './create-dialog'
import { DeleteRecurringExpenseButton } from './delete-button'
import { toggleRecurringExpense } from './actions'

export const dynamic = 'force-dynamic'

type RecurringExpense = {
  id: string
  name: string
  provider: string | null
  amount: number | string
  frequency: 'monthly' | 'quarterly' | 'yearly'
  next_due_date: string
  currency_code: string
  account_id: string | null
  account?: { name: string; currency_code: string } | null
  is_active: boolean
  notes: string | null
}

const frequencyLabels = {
  monthly: 'Mensal',
  quarterly: 'Trimestral',
  yearly: 'Anual',
} as const
const yearlyMultipliers = { monthly: 12, quarterly: 4, yearly: 1 } as const
const monthlyDivisors = { monthly: 1, quarterly: 3, yearly: 12 } as const
const monthlyReserve = (item: RecurringExpense) =>
  Number(item.amount) / monthlyDivisors[item.frequency]
const yearlyCost = (item: RecurringExpense) =>
  Number(item.amount) * yearlyMultipliers[item.frequency]

function daysUntil(dateString: string) {
  const due = new Date(`${dateString}T00:00:00Z`)
  const today = new Date()
  const utc = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()),
  )
  return Math.ceil((due.getTime() - utc.getTime()) / 86400000)
}

export default async function RecurringExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const [{ data: profile }, { data: expenses }, { data: accounts }] =
    await Promise.all([
      supabase
        .from('profiles')
        .select('currency_code')
        .eq('id', user.id)
        .maybeSingle(),
      supabase
        .from('recurring_expenses')
        .select(
          'id, name, provider, amount, frequency, next_due_date, currency_code, account_id, account:accounts(name, currency_code), is_active, notes',
        )
        .eq('user_id', user.id)
        .order('is_active', { ascending: false })
        .order('next_due_date'),
      supabase
        .from('accounts')
        .select('id, name, currency_code, balance')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('name'),
    ])
  const currency = profile?.currency_code ?? 'EUR'
  const items = (expenses ?? []) as unknown as RecurringExpense[]
  const active = items.filter((item) => item.is_active)
  const monthlyTotal = active.reduce(
    (sum, item) => sum + monthlyReserve(item),
    0,
  )
  const yearlyTotal = active.reduce((sum, item) => sum + yearlyCost(item), 0)
  const next = active[0]
  const dueSoon = active.filter((item) => {
    const days = daysUntil(item.next_due_date)
    return days >= 0 && days <= 30
  }).length
  const chartData = (['monthly', 'quarterly', 'yearly'] as const).map(
    (frequency) => ({
      frequency: frequencyLabels[frequency],
      amount: active
        .filter((item) => item.frequency === frequency)
        .reduce((sum, item) => sum + Number(item.amount), 0),
    }),
  )

  return (
    <main className="moneyflow-shell py-6 sm:py-10">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <CalendarClock className="size-5" />
          <div>
            <p className="text-xs text-muted-foreground">Recorrentes</p>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Despesas
            </h1>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline">
            <Link href="/dashboard/recurring/income">
              <ExternalLink className="size-4" /> Ganhos
            </Link>
          </Button>
          <RecurringExpenseCreateDialog
            currency={currency}
            accounts={accounts ?? []}
          />
        </div>
      </header>
      {params.error ? (
        <Card className="mt-4 border-destructive/30 bg-destructive/5">
          <CardContent className="pt-4 text-sm text-destructive" role="alert">
            {params.error}
          </CardContent>
        </Card>
      ) : null}
      <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ['Reserva/mês', formatCurrency(monthlyTotal, currency)],
          ['Custo anual', formatCurrency(yearlyTotal, currency)],
          [
            'Próxima',
            next ? formatDate(`${next.next_due_date}T00:00:00`) : '—',
          ],
          ['30 dias', String(dueSoon)],
        ].map(([label, value]) => (
          <Card key={label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-muted-foreground">
                {label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold tabular-nums">{value}</p>
            </CardContent>
          </Card>
        ))}
      </section>
      {active.length ? (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">Por frequência</CardTitle>
          </CardHeader>
          <CardContent>
            <RecurringChart data={chartData} />
          </CardContent>
        </Card>
      ) : null}
      <Separator className="my-8" />
      {!items.length ? (
        <Empty className="border bg-card">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <RefreshCw className="size-4" />
            </EmptyMedia>
            <EmptyTitle>Sem despesas recorrentes</EmptyTitle>
            <EmptyDescription>Adiciona a primeira.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <RecurringExpenseCreateDialog
              currency={currency}
              accounts={accounts ?? []}
            />
          </EmptyContent>
        </Empty>
      ) : (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CircleDollarSign className="size-4" />
              <h2 className="text-sm font-semibold">Despesas</h2>
            </div>
            <Badge variant="secondary">{items.length}</Badge>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => {
              const itemCurrency = item.currency_code || currency
              const days = daysUntil(item.next_due_date)
              return (
                <Card
                  key={item.id}
                  className={item.is_active ? '' : 'opacity-60'}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <CardTitle className="truncate text-base">
                          {item.name}
                        </CardTitle>
                        <p className="mt-1 truncate text-xs text-muted-foreground">
                          {item.provider || 'Sem fornecedor'} ·{' '}
                          {frequencyLabels[item.frequency]}
                        </p>
                      </div>
                      <Badge variant={item.is_active ? 'secondary' : 'outline'}>
                        {item.is_active ? 'Ativa' : 'Pausada'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-semibold tabular-nums">
                      {formatCurrency(Number(item.amount), itemCurrency)}
                    </p>
                    <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <p className="text-muted-foreground">Conta</p>
                        <p className="mt-1 font-medium">
                          {item.account?.name ?? 'Não definida'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-muted-foreground">Próxima</p>
                        <p className="mt-1 font-medium">
                          {formatDate(`${item.next_due_date}T00:00:00`)}
                        </p>
                        {item.is_active && days >= 0 && days <= 30 ? (
                          <p className="mt-1 text-destructive">
                            {days === 0 ? 'Hoje' : `${days}d`}
                          </p>
                        ) : null}
                      </div>
                    </div>
                    {item.notes ? (
                      <p className="mt-4 line-clamp-2 text-sm text-muted-foreground">
                        {item.notes}
                      </p>
                    ) : null}
                    <div className="mt-5 flex flex-wrap gap-2">
                      <Button asChild size="sm" variant="ghost">
                        <Link href={`/dashboard/recurring/${item.id}/edit`}>
                          Editar
                        </Link>
                      </Button>
                      <form action={toggleRecurringExpense}>
                        <input type="hidden" name="id" value={item.id} />
                        <input
                          type="hidden"
                          name="isActive"
                          value={item.is_active ? 'false' : 'true'}
                        />
                        <Button size="sm" variant="outline">
                          {item.is_active ? 'Pausar' : 'Ativar'}
                        </Button>
                      </form>
                      <DeleteRecurringExpenseButton
                        id={item.id}
                        name={item.name}
                      />
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </section>
      )}
    </main>
  )
}
