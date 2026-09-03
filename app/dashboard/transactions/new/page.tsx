import Link from 'next/link'
import { ArrowLeft, ArrowDownLeft, ArrowUpRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { createTransaction } from './actions'

export const dynamic = 'force-dynamic'

export default async function NewTransactionPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; type?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: accounts }, { data: categories }] = await Promise.all([
    supabase.from('accounts').select('id, name, currency_code').eq('user_id', user.id).eq('is_active', true).order('created_at', { ascending: true }),
    supabase.from('categories').select('id, name').eq('user_id', user.id).order('sort_order', { ascending: true }).order('name', { ascending: true }),
  ])

  const defaultType = params.type === 'income' ? 'income' : 'expense'

  return (
    <main className="min-h-screen">
      <div className="moneyflow-shell py-4 sm:py-8">
        <Link href="/dashboard" className="inline-flex min-h-10 items-center gap-2 text-sm font-medium text-[hsl(var(--muted-foreground))]"><ArrowLeft className="size-4" aria-hidden="true" /> Voltar</Link>
        <section className="mx-auto mt-5 max-w-xl rounded-[1.5rem] border bg-[hsl(var(--surface))] p-4 shadow-sm sm:mt-7 sm:p-6">
          <header className="mb-5"><h1 className="text-2xl font-semibold tracking-tight">Novo movimento</h1></header>
          {params.error ? <p role="alert" className="mb-4 rounded-xl bg-[hsl(var(--danger)/0.08)] px-3 py-2 text-sm">{params.error}</p> : null}
          {!accounts?.length ? (
            <div className="rounded-xl border border-dashed p-4 text-sm">Cria primeiro uma conta. <Link className="font-medium underline underline-offset-4" href="/dashboard/accounts/new">Criar conta</Link></div>
          ) : (
            <form action={createTransaction} className="space-y-4">
              <div className="grid grid-cols-2 gap-2 rounded-2xl bg-[hsl(var(--surface-muted))] p-1" role="group" aria-label="Tipo">
                <label className={`flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl text-sm font-medium transition-colors ${defaultType === 'expense' ? 'bg-[hsl(var(--surface))] shadow-sm' : 'text-[hsl(var(--muted-foreground))]'}`}><input className="sr-only" type="radio" name="transactionType" value="expense" defaultChecked={defaultType === 'expense'} /><ArrowUpRight className="size-4" aria-hidden="true" /> Despesa</label>
                <label className={`flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl text-sm font-medium transition-colors ${defaultType === 'income' ? 'bg-[hsl(var(--surface))] shadow-sm' : 'text-[hsl(var(--muted-foreground))]'}`}><input className="sr-only" type="radio" name="transactionType" value="income" defaultChecked={defaultType === 'income'} /><ArrowDownLeft className="size-4" aria-hidden="true" /> Receita</label>
              </div>
              <label className="grid gap-2 text-sm font-medium"><span>Valor</span><input autoFocus name="amount" type="number" inputMode="decimal" step="0.01" min="0.01" required placeholder="0,00" className="min-h-14 w-full rounded-2xl border bg-transparent px-4 text-2xl font-semibold tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]" /></label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2 text-sm font-medium"><span>Conta</span><select name="accountId" defaultValue={accounts[0].id} className="min-h-11 w-full rounded-xl border bg-[hsl(var(--surface))] px-3 font-normal outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]">{accounts.map((account) => <option key={account.id} value={account.id}>{account.name} · {account.currency_code}</option>)}</select></label>
                <label className="grid gap-2 text-sm font-medium"><span>Categoria</span><select name="categoryId" defaultValue="" className="min-h-11 w-full rounded-xl border bg-[hsl(var(--surface))] px-3 font-normal outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"><option value="">Sem categoria</option>{categories?.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
              </div>
              <details className="rounded-xl border px-4 py-3"><summary className="cursor-pointer text-sm font-medium">Mais opções</summary><div className="mt-4 grid gap-4 sm:grid-cols-2"><label className="grid gap-2 text-sm font-medium"><span>Descrição</span><input name="description" maxLength={120} placeholder="Ex.: supermercado" className="min-h-11 rounded-xl border bg-transparent px-3 font-normal outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]" /></label><label className="grid gap-2 text-sm font-medium"><span>Data</span><input name="occurredAt" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required className="min-h-11 rounded-xl border bg-transparent px-3 font-normal outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]" /></label></div></details>
              <Button type="submit" className="w-full min-h-12">Guardar</Button>
            </form>
          )}
        </section>
      </div>
    </main>
  )
}
