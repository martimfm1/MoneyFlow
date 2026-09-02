import Link from 'next/link'
import {
  ArrowDownLeft,
  ArrowUpRight,
  Pencil,
  Plus,
  Search,
  SlidersHorizontal,
  Tags,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat('pt-PT', { style: 'currency', currency }).format(
    amount,
  )
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-PT', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

type SearchParams = {
  q?: string
  type?: string
  category?: string
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

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: categories }] = await Promise.all([
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
  if (q) query = query.ilike('description', `%${q}%`)

  const { data: transactions } = await query
  const currency = profile?.currency_code ?? 'EUR'
  const hasFilters = Boolean(q) || type !== 'all' || categoryId !== 'all'

  return (
    <main className="moneyflow-shell py-6 sm:py-10">
      <header className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            Histórico financeiro
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            Movimentos
          </h1>
        </div>
        <Button asChild size="sm">
          <Link href="/dashboard/transactions/new">
            <Plus className="size-4" /> Novo
          </Link>
        </Button>
      </header>

      <section className="mt-6 rounded-[var(--radius-lg)] border bg-[hsl(var(--surface))] p-4 shadow-sm sm:p-5">
        <form className="space-y-3" method="get">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
            <span className="sr-only">Pesquisar movimentos</span>
            <input
              name="q"
              defaultValue={q}
              placeholder="Pesquisar por descrição"
              className="min-h-11 w-full rounded-[var(--radius-md)] border bg-transparent pl-9 pr-3 outline-none"
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex min-h-11 items-center gap-2 rounded-[var(--radius-md)] border px-3 text-sm">
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
            <label className="flex min-h-11 items-center gap-2 rounded-[var(--radius-md)] border px-3 text-sm">
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
          </div>
          <div className="flex items-center gap-2">
            <Button type="submit" size="sm">
              Aplicar filtros
            </Button>
            {hasFilters ? (
              <Button asChild type="button" size="sm" variant="ghost">
                <Link href="/dashboard/transactions">Limpar</Link>
              </Button>
            ) : null}
            <Link
              href="/dashboard/categories"
              className="ml-auto text-sm font-medium underline-offset-4 hover:underline"
            >
              Gerir categorias
            </Link>
          </div>
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
          <div className="divide-y">
            {transactions.map((transaction) => {
              const isIncome = transaction.transaction_type === 'income'
              const account = Array.isArray(transaction.accounts)
                ? transaction.accounts[0]
                : transaction.accounts
              const category = Array.isArray(transaction.categories)
                ? transaction.categories[0]
                : transaction.categories
              return (
                <article
                  key={transaction.id}
                  className="flex items-center gap-3 p-4"
                >
                  <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--surface-muted))]">
                    {isIncome ? (
                      <ArrowDownLeft className="size-4" />
                    ) : (
                      <ArrowUpRight className="size-4" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">
                      {transaction.description ||
                        (isIncome ? 'Receita' : 'Despesa')}
                    </p>
                    <p className="mt-1 truncate text-xs text-[hsl(var(--muted-foreground))]">
                      {account?.name ?? 'Conta'} ·{' '}
                      {formatDate(transaction.occurred_at)}
                      {category?.name ? ` · ${category.name}` : ''}
                    </p>
                  </div>
                  <p
                    className={`shrink-0 font-semibold tabular-nums ${isIncome ? 'text-[hsl(var(--success))]' : 'text-[hsl(var(--danger))]'}`}
                  >
                    {isIncome ? '+' : '-'}
                    {formatMoney(
                      Number(transaction.amount),
                      account?.currency_code || currency,
                    )}
                  </p>
                  <Button
                    asChild
                    size="icon"
                    variant="ghost"
                    aria-label={`Editar ${transaction.description || 'movimento'}`}
                  >
                    <Link
                      href={`/dashboard/transactions/${transaction.id}/edit`}
                    >
                      <Pencil className="size-4" />
                    </Link>
                  </Button>
                </article>
              )
            })}
          </div>
        </section>
      )}
    </main>
  )
}
