import Link from 'next/link'
import { ArrowDownLeft, ArrowLeft, ArrowUpRight, Pencil, Wallet } from 'lucide-react'
import { notFound, redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatDate } from '@/lib/format'
import { DeleteAccountButton } from '../delete-button'

export const dynamic = 'force-dynamic'

type Params = { id: string }
type SearchParams = { error?: string }

const labels: Record<string, string> = {
  bank: 'Banco',
  cash: 'Dinheiro',
  card: 'Cartão',
  savings: 'Poupança',
  other: 'Outro',
}

export default async function AccountDetailPage({
  params,
  searchParams,
}: {
  params: Promise<Params>
  searchParams: Promise<SearchParams>
}) {
  const { id } = await params
  const query = await searchParams
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: account }, { data: transactions }] = await Promise.all([
    supabase
      .from('accounts')
      .select('id, name, account_type, balance, currency_code, is_active, created_at, updated_at')
      .eq('id', id)
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase
      .from('transactions')
      .select('id, transaction_type, amount, description, occurred_at, categories(name)')
      .eq('account_id', id)
      .eq('user_id', user.id)
      .order('occurred_at', { ascending: false })
      .limit(50),
  ])

  if (!account) notFound()

  const currency = account.currency_code || 'EUR'
  const items = transactions ?? []
  const incomeTotal = items
    .filter((item) => item.transaction_type === 'income')
    .reduce((sum, item) => sum + Number(item.amount), 0)
  const expenseTotal = items
    .filter((item) => item.transaction_type === 'expense')
    .reduce((sum, item) => sum + Number(item.amount), 0)

  return (
    <main className="moneyflow-shell py-6 sm:py-10">
      <div className="flex items-center justify-between gap-3">
        <Button asChild size="sm" variant="ghost">
          <Link href="/dashboard/accounts">
            <ArrowLeft className="size-4" /> Contas
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <Button asChild size="sm" variant="outline">
            <Link href={`/dashboard/accounts/${account.id}/edit`}>
              <Pencil className="size-4" /> Editar
            </Link>
          </Button>
          <DeleteAccountButton id={account.id} name={account.name} />
        </div>
      </div>

      {query.error ? (
        <p
          role="alert"
          className="mt-5 rounded-[var(--radius-md)] bg-[hsl(var(--danger)/0.08)] px-3 py-2 text-sm"
        >
          {query.error}
        </p>
      ) : null}

      <section className="mx-auto mt-6 max-w-3xl rounded-[var(--radius-lg)] border bg-[hsl(var(--surface))] shadow-sm">
        <div className="border-b p-5 sm:p-7">
          <div className="flex items-start gap-4">
            <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--surface-muted))]">
              <Wallet className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-[hsl(var(--muted-foreground))]">Conta</p>
              <h1 className="mt-1 break-words text-2xl font-semibold tracking-tight sm:text-3xl">
                {account.name}
              </h1>
              <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
                {labels[account.account_type] ?? account.account_type} · {currency}
                {account.is_active ? '' : ' · Arquivada'}
              </p>
            </div>
          </div>
          <p className="mt-7 text-4xl font-semibold tracking-tight tabular-nums sm:text-5xl">
            {formatCurrency(Number(account.balance), currency)}
          </p>
        </div>

        <div className="grid gap-3 border-b p-5 sm:grid-cols-2 sm:p-7">
          <article className="rounded-[var(--radius-md)] bg-[hsl(var(--surface-muted))] p-4">
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Receitas nos últimos 50 movimentos</p>
            <p className="mt-2 text-xl font-semibold tabular-nums text-[hsl(var(--success))]">
              +{formatCurrency(incomeTotal, currency)}
            </p>
          </article>
          <article className="rounded-[var(--radius-md)] bg-[hsl(var(--surface-muted))] p-4">
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Despesas nos últimos 50 movimentos</p>
            <p className="mt-2 text-xl font-semibold tabular-nums text-[hsl(var(--danger))]">
              -{formatCurrency(expenseTotal, currency)}
            </p>
          </article>
        </div>

        <div className="p-5 sm:p-7">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">Histórico</p>
              <h2 className="mt-1 text-lg font-semibold">Movimentos desta conta</h2>
            </div>
            <Link
              href={`/dashboard/transactions?account=${account.id}`}
              className="text-sm font-medium underline-offset-4 hover:underline"
            >
              Ver todos
            </Link>
          </div>

          {!items.length ? (
            <div className="mt-5 rounded-[var(--radius-md)] border border-dashed p-6 text-center">
              <p className="font-medium">Ainda não existem movimentos</p>
              <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
                Os movimentos associados a esta conta aparecerão aqui.
              </p>
            </div>
          ) : (
            <div className="mt-5 divide-y rounded-[var(--radius-md)] border">
              {items.map((transaction) => {
                const isIncome = transaction.transaction_type === 'income'
                const category = Array.isArray(transaction.categories)
                  ? transaction.categories[0]
                  : transaction.categories
                const label = transaction.description || (isIncome ? 'Receita' : 'Despesa')
                return (
                  <Link
                    key={transaction.id}
                    href={`/dashboard/transactions/${transaction.id}`}
                    className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 p-4 hover:bg-[hsl(var(--surface-muted))]"
                  >
                    <span className="inline-flex size-10 items-center justify-center rounded-full bg-[hsl(var(--surface-muted))]">
                      {isIncome ? (
                        <ArrowDownLeft className="size-4" aria-hidden="true" />
                      ) : (
                        <ArrowUpRight className="size-4" aria-hidden="true" />
                      )}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">{label}</span>
                      <span className="mt-1 block truncate text-xs text-[hsl(var(--muted-foreground))]">
                        {category?.name ?? 'Sem categoria'} · {formatDate(transaction.occurred_at)}
                      </span>
                    </span>
                    <span
                      className={`text-sm font-semibold tabular-nums ${isIncome ? 'text-[hsl(var(--success))]' : 'text-[hsl(var(--danger))]'}`}
                    >
                      {isIncome ? '+' : '-'}{formatCurrency(Number(transaction.amount), currency)}
                    </span>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
