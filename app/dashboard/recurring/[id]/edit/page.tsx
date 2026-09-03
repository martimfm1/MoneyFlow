import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { notFound, redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'
import { updateRecurringExpense } from '../actions'

export const dynamic = 'force-dynamic'

type Params = { id: string }
type SearchParams = { error?: string }

export default async function EditRecurringExpensePage({
  params,
  searchParams,
}: {
  params: Promise<Params>
  searchParams: Promise<SearchParams>
}) {
  const { id } = await params
  const query = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: expense } = await supabase
    .from('recurring_expenses')
    .select('id, name, provider, amount, frequency, next_due_date, currency_code, notes')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!expense) notFound()

  return (
    <main className="moneyflow-shell py-6 sm:py-10">
      <Link href="/dashboard/recurring" className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-[hsl(var(--muted-foreground))]">
        <ArrowLeft className="size-4" /> Voltar às despesas recorrentes
      </Link>
      <section className="mx-auto mt-8 max-w-3xl rounded-[var(--radius-lg)] border bg-[hsl(var(--surface))] p-5 shadow-sm sm:p-7">
        <header>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">Despesas recorrentes</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Editar despesa</h1>
          <p className="mt-2 text-sm leading-6 text-[hsl(var(--muted-foreground))]">Atualiza o preço, periodicidade, cliente ou próxima renovação sem perder o histórico do registo.</p>
        </header>

        {query.error ? <p role="alert" className="mt-5 rounded-[var(--radius-md)] bg-[hsl(var(--danger)/0.08)] px-3 py-2 text-sm">{query.error}</p> : null}

        <form action={updateRecurringExpense} className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <input type="hidden" name="id" value={expense.id} />
          <label className="grid gap-2 text-sm font-medium">Nome<input name="name" required maxLength={120} defaultValue={expense.name} className="min-h-11 rounded-[var(--radius-md)] border bg-transparent px-3 font-normal outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]" /></label>
          <label className="grid gap-2 text-sm font-medium">Fornecedor / cliente<input name="provider" maxLength={120} defaultValue={expense.provider ?? ''} className="min-h-11 rounded-[var(--radius-md)] border bg-transparent px-3 font-normal outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]" /></label>
          <label className="grid gap-2 text-sm font-medium">Valor<input name="amount" type="number" inputMode="decimal" min="0.01" step="0.01" required defaultValue={expense.amount} className="min-h-11 rounded-[var(--radius-md)] border bg-transparent px-3 font-normal outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]" /></label>
          <label className="grid gap-2 text-sm font-medium">Periodicidade<select name="frequency" defaultValue={expense.frequency} className="min-h-11 rounded-[var(--radius-md)] border bg-[hsl(var(--surface))] px-3 font-normal outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"><option value="monthly">Mensal</option><option value="quarterly">Trimestral</option><option value="yearly">Anual</option></select></label>
          <label className="grid gap-2 text-sm font-medium">Próxima cobrança<input name="nextDueDate" type="date" required defaultValue={expense.next_due_date} className="min-h-11 rounded-[var(--radius-md)] border bg-transparent px-3 font-normal outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]" /></label>
          <label className="grid gap-2 text-sm font-medium">Moeda<input name="currencyCode" defaultValue={expense.currency_code} maxLength={3} pattern="[A-Z]{3}" required className="min-h-11 rounded-[var(--radius-md)] border bg-transparent px-3 font-normal uppercase outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]" /></label>
          <label className="grid gap-2 text-sm font-medium sm:col-span-2 lg:col-span-3">Notas<textarea name="notes" maxLength={500} rows={4} defaultValue={expense.notes ?? ''} className="rounded-[var(--radius-md)] border bg-transparent px-3 py-2 font-normal outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]" /></label>
          <div className="flex flex-col-reverse gap-2 sm:col-span-2 sm:flex-row lg:col-span-3 sm:justify-end"><Button asChild type="button" variant="ghost"><Link href="/dashboard/recurring">Cancelar</Link></Button><Button type="submit">Guardar alterações</Button></div>
        </form>
      </section>
    </main>
  )
}
