import Link from 'next/link'
import { ArrowLeft, Trash2 } from 'lucide-react'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { deleteTransaction, updateTransaction } from '../../actions'

export const dynamic = 'force-dynamic'

export default async function EditTransactionPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const [{ id }, query] = await Promise.all([params, searchParams])
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: transaction }, { data: accounts }, { data: categories }, { data: profile }] = await Promise.all([
    supabase
      .from('transactions')
      .select('id, transaction_type, amount, account_id, category_id, description, occurred_at')
      .eq('id', id)
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase
      .from('accounts')
      .select('id, name, currency_code, is_active')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true }),
    supabase
      .from('categories')
      .select('id, name')
      .eq('user_id', user.id)
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true }),
    supabase.from('profiles').select('currency_code').eq('id', user.id).maybeSingle(),
  ])

  if (!transaction) notFound()

  const currency = profile?.currency_code ?? 'EUR'
  const dateValue = transaction.occurred_at.slice(0, 10)
  const activeAccounts =
    accounts?.filter((account) => account.is_active || account.id === transaction.account_id) ?? []

  return (
    <main className="moneyflow-shell py-6 sm:py-10">
      <div className="flex items-center gap-2">
        <Button asChild size="sm" variant="ghost">
          <Link href="/dashboard/transactions">
            <ArrowLeft className="size-4" /> Movimentos
          </Link>
        </Button>
      </div>

      <header className="mt-5">
        <p className="text-sm text-[hsl(var(--muted-foreground))]">Movimento</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Editar movimento</h1>
      </header>

      {query.error ? (
        <p className="mt-5 rounded-[var(--radius-md)] bg-[hsl(var(--danger)/0.08)] px-3 py-2 text-sm">
          {query.error}
        </p>
      ) : null}

      <section className="mt-6 rounded-[var(--radius-lg)] border bg-[hsl(var(--surface))] p-5 shadow-sm sm:p-6">
        <form action={updateTransaction} className="space-y-5">
          <input type="hidden" name="id" value={transaction.id} />

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium">
              Tipo
              <select
                name="transactionType"
                defaultValue={transaction.transaction_type}
                className="min-h-11 rounded-[var(--radius-md)] border bg-transparent px-3 font-normal outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
              >
                <option value="expense">Despesa</option>
                <option value="income">Receita</option>
              </select>
            </label>

            <label className="grid gap-2 text-sm font-medium">
              Valor
              <input
                name="amount"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0.01"
                defaultValue={Number(transaction.amount).toFixed(2)}
                required
                className="min-h-11 rounded-[var(--radius-md)] border bg-transparent px-3 font-normal outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
              />
              <span className="text-xs font-normal text-[hsl(var(--muted-foreground))]">
                Moeda: {currency}
              </span>
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium">
              Conta
              <select
                name="accountId"
                defaultValue={transaction.account_id}
                className="min-h-11 rounded-[var(--radius-md)] border bg-transparent px-3 font-normal outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
                required
              >
                {activeAccounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}{account.is_active ? '' : ' · Arquivada'}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-sm font-medium">
              Categoria
              <select
                name="categoryId"
                defaultValue={transaction.category_id ?? ''}
                className="min-h-11 rounded-[var(--radius-md)] border bg-transparent px-3 font-normal outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
              >
                <option value="">Sem categoria</option>
                {categories?.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium">
              Descrição
              <input
                name="description"
                maxLength={120}
                defaultValue={transaction.description ?? ''}
                placeholder="Ex.: Supermercado"
                className="min-h-11 rounded-[var(--radius-md)] border bg-transparent px-3 font-normal outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
              />
            </label>

            <label className="grid gap-2 text-sm font-medium">
              Data
              <input
                name="occurredAt"
                type="date"
                defaultValue={dateValue}
                required
                className="min-h-11 rounded-[var(--radius-md)] border bg-transparent px-3 font-normal outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
              />
            </label>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-5">
            <Button asChild variant="ghost">
              <Link href="/dashboard/transactions">Cancelar</Link>
            </Button>
            <div className="flex flex-wrap gap-2">
              <Button
                type="submit"
                formAction={deleteTransaction}
                variant="destructive"
              >
                <Trash2 className="size-4" /> Eliminar
              </Button>
              <Button type="submit" formAction={updateTransaction}>
                Guardar alterações
              </Button>
            </div>
          </div>
        </form>
      </section>
    </main>
  )
}
