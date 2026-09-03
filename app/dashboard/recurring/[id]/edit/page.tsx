import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AccountCombobox } from '@/components/account-combobox'
import { FormDatePicker } from '@/components/form-date-picker'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { updateRecurringExpense } from '../../actions'

export const dynamic = 'force-dynamic'

export default async function EditRecurringExpensePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const [{ data: expense }, { data: accounts }] = await Promise.all([
    supabase
      .from('recurring_expenses')
      .select(
        'id, name, provider, amount, frequency, next_due_date, currency_code, account_id, notes',
      )
      .eq('id', id)
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase
      .from('accounts')
      .select('id, name, currency_code, balance')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('name'),
  ])
  if (!expense) notFound()

  return (
    <main className="moneyflow-shell py-6 sm:py-10">
      <Button asChild variant="ghost" className="pl-0">
        <Link href="/dashboard/recurring">
          <ArrowLeft className="size-4" /> Voltar
        </Link>
      </Button>
      <Card className="mx-auto mt-4 max-w-2xl">
        <CardHeader>
          <CardTitle>Editar despesa recorrente</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={updateRecurringExpense} className="grid gap-4">
            <input type="hidden" name="id" value={expense.id} />
            <label className="grid gap-2 text-sm font-medium">
              Nome
              <Input
                name="name"
                required
                maxLength={120}
                defaultValue={expense.name}
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium">
                Fornecedor
                <Input
                  name="provider"
                  maxLength={120}
                  defaultValue={expense.provider ?? ''}
                />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Valor
                <Input
                  name="amount"
                  required
                  inputMode="decimal"
                  defaultValue={String(expense.amount)}
                />
              </label>
            </div>
            <AccountCombobox
              name="accountId"
              accounts={accounts ?? []}
              defaultValue={expense.account_id ?? undefined}
              required
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium">
                Frequência
                <select
                  name="frequency"
                  defaultValue={expense.frequency}
                  className="h-8 rounded-lg border bg-background px-2 text-sm"
                >
                  <option value="monthly">Mensal</option>
                  <option value="quarterly">Trimestral</option>
                  <option value="yearly">Anual</option>
                </select>
              </label>
              <FormDatePicker
                name="nextDueDate"
                defaultValue={expense.next_due_date}
                label="Próxima cobrança"
              />
            </div>
            <Separator />
            <input
              type="hidden"
              name="currencyCode"
              value={expense.currency_code}
            />
            <label className="grid gap-2 text-sm font-medium">
              Notas
              <textarea
                name="notes"
                maxLength={500}
                defaultValue={expense.notes ?? ''}
                className="min-h-24 rounded-lg border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            </label>
            <div className="flex justify-end gap-2">
              <Button asChild variant="ghost">
                <Link href="/dashboard/recurring">Cancelar</Link>
              </Button>
              <Button type="submit" disabled={!accounts?.length}>
                Guardar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
