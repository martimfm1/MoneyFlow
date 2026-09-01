import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'
import { createTransaction } from './actions'

export const dynamic = 'force-dynamic'

export default async function NewTransactionPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: accounts } = await supabase
    .from('accounts')
    .select('id, name, currency_code')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .order('created_at', { ascending: true })

  return (
    <main className="min-h-screen">
      <div className="moneyflow-shell py-6 sm:py-10">
        <Link href="/dashboard" className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-[hsl(var(--muted-foreground))]">
          <ArrowLeft className="size-4" /> Voltar
        </Link>
        <section className="mx-auto mt-8 max-w-lg rounded-[var(--radius-lg)] border bg-[hsl(var(--surface))] p-6 shadow-sm sm:p-8">
          <h1 className="text-2xl font-semibold tracking-tight">Novo movimento</h1>
          <p className="mt-2 text-sm leading-6 text-[hsl(var(--muted-foreground))]">Regista rapidamente dinheiro que entrou ou saiu.</p>
          {params.error ? <p className="mt-4 rounded-[var(--radius-md)] bg-[hsl(var(--danger)/0.08)] px-3 py-2 text-sm">{params.error}</p> : null}

          {!accounts?.length ? (
            <div className="mt-6 rounded-[var(--radius-md)] border border-dashed p-4 text-sm">
              Primeiro precisas de criar uma conta. <Link className="font-medium underline underline-offset-4" href="/dashboard/accounts/new">Criar conta</Link>
            </div>
          ) : (
            <form action={createTransaction} className="mt-6 space-y-4">
              <label className="block space-y-2 text-sm font-medium">
                <span>Tipo</span>
                <select name="transactionType" defaultValue="expense" className="min-h-11 w-full rounded-[var(--radius-md)] border bg-[hsl(var(--surface))] px-3 outline-none">
                  <option value="expense">Despesa</option>
                  <option value="income">Receita</option>
                </select>
              </label>

              <label className="block space-y-2 text-sm font-medium">
                <span>Valor</span>
                <input name="amount" type="number" inputMode="decimal" step="0.01" min="0.01" required placeholder="0,00" className="min-h-11 w-full rounded-[var(--radius-md)] border bg-transparent px-3 text-lg outline-none" />
              </label>

              <label className="block space-y-2 text-sm font-medium">
                <span>Conta</span>
                <select name="accountId" defaultValue={accounts[0].id} className="min-h-11 w-full rounded-[var(--radius-md)] border bg-[hsl(var(--surface))] px-3 outline-none">
                  {accounts.map((account) => <option key={account.id} value={account.id}>{account.name} · {account.currency_code}</option>)}
                </select>
              </label>

              <label className="block space-y-2 text-sm font-medium">
                <span>Descrição <span className="font-normal text-[hsl(var(--muted-foreground))]">(opcional)</span></span>
                <input name="description" maxLength={120} placeholder="Ex.: supermercado" className="min-h-11 w-full rounded-[var(--radius-md)] border bg-transparent px-3 outline-none" />
              </label>

              <label className="block space-y-2 text-sm font-medium">
                <span>Data</span>
                <input name="occurredAt" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required className="min-h-11 w-full rounded-[var(--radius-md)] border bg-transparent px-3 outline-none" />
              </label>

              <Button type="submit" className="w-full">Guardar movimento</Button>
            </form>
          )}
        </section>
      </div>
    </main>
  )
}
