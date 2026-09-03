import Link from 'next/link'
import { ArrowDownLeft, CalendarClock, ChevronLeft } from 'lucide-react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatDate } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import { RecurringIncomeCreateDialog } from './create-dialog'
import { RecurringIncomeActionMenu } from './action-menu'

export const dynamic = 'force-dynamic'

type RecurringIncome = {
  id: string
  name: string
  source: string | null
  amount: number | string
  frequency: 'monthly' | 'quarterly' | 'yearly'
  next_income_date: string
  currency_code: string
  account_id: string | null
  account?: { name: string; currency_code: string } | null
  is_active: boolean
}

const frequencyLabels = {
  monthly: 'Mensal',
  quarterly: 'Trimestral',
  yearly: 'Anual',
} as const

const yearlyMultipliers = { monthly: 12, quarterly: 4, yearly: 1 } as const
const monthlyDivisors = { monthly: 1, quarterly: 3, yearly: 12 } as const

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
  searchParams: Promise<{ error?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: incomes }, { data: accounts }] =
    await Promise.all([
      supabase
        .from('profiles')
        .select('currency_code')
        .eq('id', user.id)
        .maybeSingle(),
      supabase
        .from('recurring_incomes')
        .select(
          'id, name, source, amount, frequency, next_income_date, currency_code, account_id, account:accounts(name, currency_code), is_active',
        )
        .eq('user_id', user.id)
        .order('is_active', { ascending: false })
        .order('next_income_date', { ascending: true }),
      supabase
        .from('accounts')
        .select('id, name, currency_code, balance')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('name', { ascending: true }),
    ])

  const currency = profile?.currency_code ?? 'EUR'
  const items = (incomes ?? []) as unknown as RecurringIncome[]
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
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <Button asChild size="icon" variant="ghost" aria-label="Voltar">
            <Link href="/dashboard/recurring">
              <ChevronLeft className="size-4" />
            </Link>
          </Button>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Recorrentes</p>
            <h1 className="truncate text-2xl font-semibold tracking-tight sm:text-3xl">
              Ganhos
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{items.length}</Badge>
          <RecurringIncomeCreateDialog
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
          ['Mensal', formatCurrency(monthlyTotal, currency)],
          ['Anual', formatCurrency(yearlyTotal, currency)],
          [
            'Próximo',
            nextIncome
              ? formatDate(`${nextIncome.next_income_date}T00:00:00`)
              : '—',
          ],
          ['30 dias', String(dueSoon)],
        ].map(([label, value]) => (
          <Card key={label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                {label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold tabular-nums">{value}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <Separator className="my-8" />

      {!items.length ? (
        <Empty className="border bg-card">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ArrowDownLeft className="size-4" />
            </EmptyMedia>
            <EmptyTitle>Sem ganhos recorrentes</EmptyTitle>
            <EmptyDescription>Adiciona o primeiro rendimento.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <RecurringIncomeCreateDialog
              currency={currency}
              accounts={accounts ?? []}
            />
          </EmptyContent>
        </Empty>
      ) : (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarClock className="size-4" />
              <h2 className="text-sm font-semibold">Rendimentos</h2>
            </div>
            <span className="text-xs text-muted-foreground">
              {items.length}
            </span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => {
              const itemCurrency = item.currency_code || currency
              const days = daysUntil(item.next_income_date)
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
                          {item.source || 'Sem origem'} ·{' '}
                          {frequencyLabels[item.frequency]}
                        </p>
                      </div>
                      <RecurringIncomeActionMenu
                        id={item.id}
                        name={item.name}
                        isActive={item.is_active}
                      />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Badge variant={item.is_active ? 'secondary' : 'outline'}>
                      {item.is_active ? 'Ativo' : 'Pausado'}
                    </Badge>
                    <p className="mt-4 text-2xl font-semibold tabular-nums">
                      {formatCurrency(Number(item.amount), itemCurrency)}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatCurrency(monthlyIncome(item), itemCurrency)}/mês
                    </p>
                    <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <p className="text-muted-foreground">Conta</p>
                        <p className="mt-1 font-medium">
                          {item.account?.name ?? 'Não definida'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-muted-foreground">Próximo</p>
                        <p className="mt-1 font-medium">
                          {formatDate(`${item.next_income_date}T00:00:00`)}
                        </p>
                        {item.is_active && days >= 0 && days <= 30 ? (
                          <p className="mt-1 text-emerald-600">
                            {days === 0 ? 'Hoje' : `${days}d`}
                          </p>
                        ) : null}
                      </div>
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
