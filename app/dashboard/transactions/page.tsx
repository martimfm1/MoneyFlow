import Link from 'next/link'
import {
  ArrowDownLeft,
  ArrowUpRight,
  Pencil,
  Plus,
  Search,
  SlidersHorizontal,
  Tags,
  Wallet,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatDate } from '@/lib/format'
import { redirect } from 'next/navigation'
import { DeleteTransactionButton } from './delete-button'

export const dynamic = 'force-dynamic'

type SearchParams = {
  q?: string
  type?: string
  category?: string
  account?: string
}

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const q = params.q?.trim() ?? ''
  const type =
    params.type === 'income' || params.type === 'expense' ? params.type : 'all'
  const categoryId = params.category ?? 'all'
  const accountId = params.account ?? 'all'
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: categories }, { data: accounts }] =
    await Promise.all([
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
        .from('accounts')
        .select('id, name, is_active')
        .eq('user_id', user.id)
        .order('is_active', { ascending: false })
        .order('created_at', { ascending: true }),
    ])

  let query = supabase
    .from('transactions')
    .select(
      'id, transaction_type, amount, description, occurred_at, accounts(name, currency_code), categories(id, name)',
    )
    .eq('user_id', user.id)
    .order('occurred_at', { ascending: false })
    .limit(100)
  if (type !== 'all') query = query.eq('transaction_type', type)
  if (categoryId !== 'all') query = query.eq('category_id', categoryId)
  if (accountId !== 'all') query = query.eq('account_id', accountId)
  if (q) query = query.ilike('description', `%${q}%`)

  const { data: transactions } = await query
  const currency = profile?.currency_code ?? 'EUR'
  const hasFilters =
    Boolean(q) || type !== 'all' || categoryId !== 'all' || accountId !== 'all'
  const incomeTotal = (transactions ?? [])
    .filter((t) => t.transaction_type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0)
  const expenseTotal = (transactions ?? [])
    .filter((t) => t.transaction_type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0)

  return (
    <main className="moneyflow-shell py-6 sm:py-10">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            Histórico financeiro
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl lg:text-4xl">
            Movimentos
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[hsl(var(--muted-foreground))]">
            Pesquisa e filtra os movimentos por conta, tipo e categoria.
          </p>
        </div>
        <Button asChild size="sm">
          <Link href="/dashboard/transactions/new">
            <Plus className="size-4" /> Novo
          </Link>
        </Button>
      </header>

      <section className="mt-6 grid gap-3 sm:grid-cols-3">
        <article className="rounded-[var(--radius-lg)] border bg-[hsl(var(--surface))] p-5 shadow-sm">
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            Movimentos visíveis
          </p>
          <p className="mt-2 text-2xl font-semibold tabular-nums">
            {transactions?.length ?? 0}
          </p>
        </article>
        <article className="rounded-[var(--radius-lg)] border bg-[hsl(var(--surface))] p-5 shadow-sm">
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            Receitas visíveis
          </p>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-[hsl(var(--success))]">
            +{formatCurrency(incomeTotal, currency)}
          </p>
        </article>
        <article className="rounded-[var(--radius-lg)] border bg-[hsl(var(--surface))] p-5 shadow-sm">
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            Despesas visíveis
          </p>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-[hsl(var(--danger))]">
            -{formatCurrency(expenseTotal, currency)}
          </p>
        </article>
      </section>

      <section className="mt-6 rounded-[var(--radius-lg)] border bg-[hsl(var(--surface))] p-4 shadow-sm sm:p-5">
        <form
          className="grid gap-3 lg:grid-cols-[minmax(16rem,1.6fr)_minmax(11rem,1fr)_minmax(11rem,1fr)_minmax(11rem,1fr)_auto] lg:items-center"
          method="get"
        >
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
            <span className="sr-only">Pesquisar movimentos</span>
            <input
              name="q"
              defaultValue={q}
              placeholder="Pesquisar por descrição"
              className="min-h-11 w-full rounded-[var(--radius-md)] border bg-transparent pl-9 pr-3 outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
            />
          </label>
          <label className="flex min-h-11 items-center gap-2 rounded-[var(--radius-md)] border px-3 text-sm focus-within:ring-2 focus-within:ring-[hsl(var(--ring))]">
            <Wallet className="size-4 shrink-0 text-[hsl(var(--muted-foreground))]" />
            <span className="sr-only">Conta</span>
            <select
              name="account"
              defaultValue={accountId}
              className="min-w-0 flex-1 bg-transparent outline-none"
            >
              <option value="all">Todas as contas</option>
              {accounts?.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                  {account.is_active ? '' : ' · Arquivada'}
                </option>
              ))}
            </select>
          </label>
          <label className="flex min-h-11 items-center gap-2 rounded-[var(--radius-md)] border px-3 text-sm focus-within:ring-2 focus-within:ring-[hsl(var(--ring))]">
            <SlidersHorizontal className="size-4 shrink-0 text-[hsl(var(--muted-foreground))]" />
            <span className="sr-only">Tipo</span>
            <select
              name="type"
              defaultValue={type}
              className="min-w-0 flex-1 bg-transparent outline-none"
            >
              <option value="all">Todos os tipos</option>
              <option value="expense">Despesas</option>
              <option value="income">Receitas</option>
            </select>
          </label>
          <label className="flex min-h-11 items-center gap-2 rounded-[var(--radius-md)] border px-3 text-sm focus-within:ring-2 focus-within:ring-[hsl(var(--ring))]">
            <Tags className="size-4 shrink-0 text-[hsl(var(--muted-foreground))]" />
            <span className="sr-only">Categoria</span>
            <select
              name="category"
              defaultValue={categoryId}
              className="min-w-0 flex-1 bg-transparent outline-none"
            >
              <option value="all">Todas as categorias</option>
              {categories?.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-center gap-2 lg:justify-end">
            <Button type="submit" size="sm">
              Aplicar
            </Button>
            {hasFilters ? (
              <Button asChild type="button" size="sm" variant="ghost">
                <Link href="/dashboard/transactions">Limpar</Link>
              </Button>
            ) : null}
          </div>
          <Link
            href="/dashboard/categories"
            className="text-sm font-medium underline-offset-4 hover:underline lg:col-span-5"
          >
            Gerir categorias
          </Link>
        </form>
      </section>

      {!transactions?.length ? (
        <section className="mt-6 rounded-[var(--radius-lg)] border border-dashed bg-[hsl(var(--surface))] p-8 text-center">
          <h2 className="font-medium">
            {hasFilters
              ? 'Nenhum movimento encontrado'
              : 'Ainda não há movimentos'}
          </h2>
          <p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-[hsl(var(--muted-foreground))]">
            {hasFilters
              ? 'Tenta alterar os filtros para encontrares outros movimentos.'
              : 'Regista a tua primeira despesa ou receita para começares a perceber o teu dinheiro.'}
          </p>
          {!hasFilters ? (
            <Button asChild className="mt-5">
              <Link href="/dashboard/transactions/new">
                Adicionar movimento
              </Link>
            </Button>
          ) : null}
        </section>
      ) : (
        <section className="mt-6 overflow-hidden rounded-[var(--radius-lg)] border bg-[hsl(var(--surface))] shadow-sm">
          <div className="hidden grid-cols-[auto_minmax(0,1fr)_10rem_8rem_auto] gap-4 border-b bg-[hsl(var(--surface-muted)/0.45)] px-5 py-3 text-xs font-medium uppercase tracking-wide text-[hsl(var(--muted-foreground))] lg:grid">
            <span />
            <span>Movimento</span>
            <span>Valor</span>
            <span>Data</span>
            <span />
          </div>
          <div className="divide-y">
            {transactions.map((transaction) => {
              const isIncome = transaction.transaction_type === 'income'
              const account = Array.isArray(transaction.accounts)
                ? transaction.accounts[0]
                : transaction.accounts
              const category = Array.isArray(transaction.categories)
                ? transaction.categories[0]
                : transaction.categories
              const label =
                transaction.description || (isIncome ? 'Receita' : 'Despesa')
              return (
                <article
                  key={transaction.id}
                  className="grid items-center gap-3 p-4 lg:grid-cols-[auto_minmax(0,1fr)_10rem_8rem_auto_auto] lg:gap-4 lg:px-5"
                >
                  <Link
                    href={`/dashboard/transactions/${transaction.id}`}
                    className="contents"
                    aria-label={`Ver detalhes de ${label}`}
                  >
                    <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--surface-muted))]">
                      {isIncome ? (
                        <ArrowDownLeft className="size-4" aria-hidden="true" />
                      ) : (
                        <ArrowUpRight className="size-4" aria-hidden="true" />
                      )}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-medium">{label}</p>
                      <p className="mt-1 truncate text-xs text-[hsl(var(--muted-foreground))]">
                        {account?.name ?? 'Conta'} ·{' '}
                        {category?.name ?? 'Sem categoria'}
                      </p>
                      <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))] lg:hidden">
                        {formatDate(transaction.occurred_at)}
                      </p>
                    </div>
                    <p
                      className={`shrink-0 font-semibold tabular-nums ${isIncome ? 'text-[hsl(var(--success))]' : 'text-[hsl(var(--danger))]'}`}
                    >
                      {isIncome ? '+' : '-'}
                      {formatCurrency(
                        Number(transaction.amount),
                        account?.currency_code || currency,
                      )}
                    </p>
                    <p className="hidden text-sm text-[hsl(var(--muted-foreground))] lg:block">
                      {formatDate(transaction.occurred_at)}
                    </p>
                  </Link>
                  <Button
                    asChild
                    size="icon"
                    variant="ghost"
                    aria-label={`Editar ${label}`}
                    title="Editar movimento"
                  >
                    <Link
                      href={`/dashboard/transactions/${transaction.id}/edit`}
                    >
                      <Pencil className="size-4" />
                    </Link>
                  </Button>
                  <DeleteTransactionButton id={transaction.id} label={label} />
                </article>
              )
            })}
          </div>
        </section>
      )}
    </main>
  )
}
