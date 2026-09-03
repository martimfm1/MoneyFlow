import Link from 'next/link'
import {
  ArrowDownLeft,
  ArrowLeft,
  ArrowUpRight,
  Pencil,
  Wallet,
} from 'lucide-react'
import { notFound, redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatDate } from '@/lib/format'
import { DeleteTransactionButton } from '../delete-button'

export const dynamic = 'force-dynamic'

type Params = { id: string }
type SearchParams = { error?: string }

export default async function TransactionDetailPage({
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

  const [{ data: transaction }, { data: profile }] = await Promise.all([
    supabase
      .from('transactions')
      .select(
        'id, transaction_type, amount, description, occurred_at, created_at, updated_at, accounts(id, name, currency_code), categories(id, name)',
      )
      .eq('id', id)
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase
      .from('profiles')
      .select('currency_code')
      .eq('id', user.id)
      .maybeSingle(),
  ])

  if (!transaction) notFound()

  const isIncome = transaction.transaction_type === 'income'
  const account = Array.isArray(transaction.accounts)
    ? transaction.accounts[0]
    : transaction.accounts
  const category = Array.isArray(transaction.categories)
    ? transaction.categories[0]
    : transaction.categories
  const currency = account?.currency_code || profile?.currency_code || 'EUR'
  const label = transaction.description || (isIncome ? 'Receita' : 'Despesa')
  const amount = Number(transaction.amount)

  return (
    <main className="moneyflow-shell py-6 sm:py-10 lg:py-12">
      <div className="flex items-center justify-between gap-3">
        <Button asChild size="sm" variant="ghost">
          <Link href="/dashboard/transactions">
            <ArrowLeft className="size-4" /> Movimentos
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <Button asChild size="sm" variant="outline">
            <Link href={`/dashboard/transactions/${transaction.id}/edit`}>
              <Pencil className="size-4" /> Editar
            </Link>
          </Button>
          <DeleteTransactionButton id={transaction.id} label={label} />
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

      <section className="mx-auto mt-6 max-w-2xl overflow-hidden rounded-[var(--radius-lg)] border bg-[hsl(var(--surface))] shadow-sm">
        <div className="border-b p-5 sm:p-7">
          <div className="flex items-start gap-4">
            <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--surface-muted))]">
              {isIncome ? (
                <ArrowDownLeft className="size-5" aria-hidden="true" />
              ) : (
                <ArrowUpRight className="size-5" aria-hidden="true" />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                {isIncome ? 'Receita' : 'Despesa'}
              </p>
              <h1 className="mt-1 break-words text-2xl font-semibold tracking-tight sm:text-3xl">
                {label}
              </h1>
            </div>
          </div>
          <p
            className={`mt-7 text-4xl font-semibold tracking-tight tabular-nums sm:text-5xl ${isIncome ? 'text-[hsl(var(--success))]' : 'text-[hsl(var(--danger))]'}`}
          >
            {isIncome ? '+' : '-'}
            {formatCurrency(amount, currency)}
          </p>
        </div>

        <dl className="divide-y">
          <div className="flex items-start justify-between gap-5 px-5 py-4 sm:px-7">
            <dt className="text-sm text-[hsl(var(--muted-foreground))]">
              Data
            </dt>
            <dd className="text-right text-sm font-medium">
              {formatDate(transaction.occurred_at)}
            </dd>
          </div>
          <div className="flex items-start justify-between gap-5 px-5 py-4 sm:px-7">
            <dt className="text-sm text-[hsl(var(--muted-foreground))]">
              Conta
            </dt>
            <dd className="flex items-center gap-2 text-right text-sm font-medium">
              <Wallet className="size-4 shrink-0" aria-hidden="true" />
              <span>{account?.name ?? 'Conta'}</span>
            </dd>
          </div>
          <div className="flex items-start justify-between gap-5 px-5 py-4 sm:px-7">
            <dt className="text-sm text-[hsl(var(--muted-foreground))]">
              Categoria
            </dt>
            <dd className="text-right text-sm font-medium">
              {category?.name ?? 'Sem categoria'}
            </dd>
          </div>
          <div className="flex items-start justify-between gap-5 px-5 py-4 sm:px-7">
            <dt className="text-sm text-[hsl(var(--muted-foreground))]">
              Tipo
            </dt>
            <dd className="text-right text-sm font-medium">
              {isIncome ? 'Receita' : 'Despesa'}
            </dd>
          </div>
          {transaction.description ? null : null}
        </dl>

        <div className="border-t px-5 py-4 sm:px-7">
          <p className="text-xs text-[hsl(var(--muted-foreground))]">
            ID do movimento
          </p>
          <p className="mt-1 break-all font-mono text-xs text-[hsl(var(--muted-foreground))]">
            {transaction.id}
          </p>
        </div>
      </section>
    </main>
  )
}
