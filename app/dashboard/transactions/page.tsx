import Link from 'next/link'
import { ArrowDownLeft, ArrowUpRight, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat('pt-PT', { style: 'currency', currency }).format(amount)
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value))
}

export default async function TransactionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: transactions }] = await Promise.all([
    supabase.from('profiles').select('currency_code').eq('id', user.id).maybeSingle(),
    supabase.from('transactions').select('id, account_id, transaction_type, amount, description, occurred_at, accounts(name, currency_code)').eq('user_id', user.id).order('occurred_at', { ascending: false }).limit(50),
  ])

  const currency = profile?.currency_code ?? 'EUR'

  return (
    <main className="moneyflow-shell py-6 sm:py-10">
      <header className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">Histórico financeiro</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Movimentos</h1>
        </div>
        <Button asChild size="sm"><Link href="/dashboard/transactions/new"><Plus className="size-4" /> Novo</Link></Button>
      </header>

      {!transactions?.length ? (
        <section className="mt-8 rounded-[var(--radius-lg)] border border-dashed bg-[hsl(var(--surface))] p-8 text-center">
          <h2 className="font-medium">Ainda não há movimentos</h2>
          <p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-[hsl(var(--muted-foreground))]">Regista a tua primeira despesa ou receita para começares a perceber o teu dinheiro.</p>
          <Button asChild className="mt-5"><Link href="/dashboard/transactions/new">Adicionar movimento</Link></Button>
        </section>
      ) : (
        <section className="mt-6 overflow-hidden rounded-[var(--radius-lg)] border bg-[hsl(var(--surface))] shadow-sm">
          <div className="divide-y">
            {transactions.map((transaction) => {
              const isIncome = transaction.transaction_type === 'income'
              const account = Array.isArray(transaction.accounts) ? transaction.accounts[0] : transaction.accounts
              return (
                <article key={transaction.id} className="flex items-center gap-3 p-4">
                  <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--surface-muted))]">
                    {isIncome ? <ArrowDownLeft className="size-4" /> : <ArrowUpRight className="size-4" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{transaction.description || (isIncome ? 'Receita' : 'Despesa')}</p>
                    <p className="mt-1 truncate text-xs text-[hsl(var(--muted-foreground))]">{account?.name ?? 'Conta'} · {formatDate(transaction.occurred_at)}</p>
                  </div>
                  <p className={`shrink-0 font-semibold tabular-nums ${isIncome ? 'text-[hsl(var(--success))]' : 'text-[hsl(var(--danger))]'}`}>
                    {isIncome ? '+' : '-'}{formatMoney(Number(transaction.amount), account?.currency_code || currency)}
                  </p>
                </article>
              )
            })}
          </div>
        </section>
      )}
    </main>
  )
}
