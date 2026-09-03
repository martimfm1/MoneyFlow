import Link from 'next/link'
import { ArrowDownLeft, ArrowLeft, ArrowUpRight } from 'lucide-react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AccountCombobox } from '@/components/account-combobox'
import { FormDatePicker } from '@/components/form-date-picker'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { createTransaction } from './actions'

export const dynamic = 'force-dynamic'

export default async function NewTransactionPage({ searchParams }: { searchParams: Promise<{ error?: string; type?: string }> }) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: accounts }, { data: categories }] = await Promise.all([
    supabase.from('accounts').select('id, name, currency_code, balance').eq('user_id', user.id).eq('is_active', true).order('name'),
    supabase.from('categories').select('id, name').eq('user_id', user.id).order('sort_order').order('name'),
  ])
  const defaultType = params.type === 'income' ? 'income' : 'expense'

  return (
    <main className="moneyflow-shell py-6 sm:py-10">
      <Button asChild variant="ghost" className="pl-0"><Link href="/dashboard"><ArrowLeft className="size-4" /> Voltar</Link></Button>
      <Card className="mx-auto mt-4 max-w-xl">
        <CardHeader><CardTitle>Novo movimento</CardTitle></CardHeader>
        <CardContent>
          {params.error ? <div role="alert" className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">{params.error}</div> : null}
          {!accounts?.length ? (
            <div className="rounded-lg border border-dashed p-4 text-sm">Cria primeiro uma conta. <Link className="font-medium underline underline-offset-4" href="/dashboard/accounts/new">Criar conta</Link></div>
          ) : (
            <form action={createTransaction} className="grid gap-4">
              <div className="grid grid-cols-2 gap-2">
                <Button type="button" variant={defaultType === 'expense' ? 'secondary' : 'outline'} className="h-10" onClick={() => {}}> <ArrowUpRight className="size-4" /> Despesa </Button>
                <Button type="button" variant={defaultType === 'income' ? 'secondary' : 'outline'} className="h-10" onClick={() => {}}> <ArrowDownLeft className="size-4" /> Receita </Button>
              </div>
              <input type="hidden" name="transactionType" value={defaultType} />
              <label className="grid gap-2 text-sm font-medium">Valor<Input autoFocus name="amount" type="text" inputMode="decimal" required placeholder="0,00" className="h-14 text-2xl font-semibold tabular-nums" /></label>
              <AccountCombobox name="accountId" accounts={accounts} required />
              <label className="grid gap-2 text-sm font-medium">Categoria<select name="categoryId" defaultValue="" className="h-8 rounded-lg border bg-background px-2 text-sm"><option value="">Sem categoria</option>{categories?.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
              <Separator />
              <label className="grid gap-2 text-sm font-medium">Descrição<Input name="description" maxLength={120} placeholder="Supermercado" /></label>
              <FormDatePicker name="occurredAt" defaultValue={new Date().toISOString().slice(0, 10)} label="Data" />
              <Button type="submit" className="w-full">Guardar</Button>
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
