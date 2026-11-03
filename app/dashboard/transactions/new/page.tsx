import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AccountCombobox } from '@/components/account-combobox'
import { FormDatePicker } from '@/components/form-date-picker'
import { TransactionTypeSelector } from '@/components/transaction-type-selector'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { createTransaction } from './actions'

export const dynamic = 'force-dynamic'

export default async function NewTransactionPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; type?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: accounts }, { data: categories }] = await Promise.all([
    supabase
      .from('accounts')
      .select('id, name, currency_code, balance')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('name'),
    supabase
      .from('categories')
      .select('id, name')
      .eq('user_id', user.id)
      .order('sort_order')
      .order('name'),
  ])
  const defaultType = params.type === 'income' ? 'income' : 'expense'

  return (
    <main className="moneyflow-shell py-6 sm:py-10">
      <Button asChild variant="ghost" className="pl-0">
        <Link href="/dashboard/transactions">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Movimentos
        </Link>
      </Button>

      <Card className="mx-auto mt-4 max-w-xl">
        <CardHeader className="gap-2">
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
            Novo movimento
          </h1>
          <p className="text-sm leading-6 text-[hsl(var(--muted-foreground))]">
            Regista uma receita ou despesa e associa-a à conta certa.
          </p>
        </CardHeader>

        <CardContent>
          {params.error ? (
            <div
              role="alert"
              className="mb-5 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
            >
              {params.error}
            </div>
          ) : null}

          {!accounts?.length ? (
            <div className="rounded-lg border border-dashed p-5 text-center">
              <h2 className="font-medium">Ainda não tens contas</h2>
              <p className="mt-1 text-sm leading-6 text-[hsl(var(--muted-foreground))]">
                Cria primeiro uma conta para poderes associar este movimento
                ao teu saldo.
              </p>
              <Button asChild className="mt-4">
                <Link href="/dashboard/accounts/new">Criar conta</Link>
              </Button>
            </div>
          ) : (
            <form action={createTransaction} className="grid gap-5">
              <TransactionTypeSelector defaultType={defaultType} />

              <label className="grid gap-2 text-sm font-medium">
                <span>Valor</span>
                <Input
                  name="amount"
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  required
                  placeholder="0,00"
                  aria-describedby="transaction-amount-hint"
                  className="h-14 text-2xl font-semibold tabular-nums"
                />
                <span
                  id="transaction-amount-hint"
                  className="text-xs font-normal text-[hsl(var(--muted-foreground))]"
                >
                  Introduz o valor na tua moeda principal.
                </span>
              </label>

              <AccountCombobox
                name="accountId"
                accounts={accounts}
                required
              />

              <label className="grid gap-2 text-sm font-medium">
                <span>
                  Categoria{' '}
                  <span className="font-normal text-[hsl(var(--muted-foreground))]">
                    (opcional)
                  </span>
                </span>
                <select
                  name="categoryId"
                  defaultValue=""
                  className="min-h-11 w-full rounded-lg border bg-background px-3 text-sm font-normal outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
                >
                  <option value="">Sem categoria</option>
                  {categories?.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>

              <div className="grid gap-4 border-t pt-5">
                <div>
                  <h2 className="text-sm font-semibold">Detalhes adicionais</h2>
                  <p className="mt-1 text-xs leading-5 text-[hsl(var(--muted-foreground))]">
                    Estes campos ajudam a manter o histórico organizado.
                  </p>
                </div>

                <label className="grid gap-2 text-sm font-medium">
                  <span>
                    Descrição{' '}
                    <span className="font-normal text-[hsl(var(--muted-foreground))]">
                      (opcional)
                    </span>
                  </span>
                  <Input
                    name="description"
                    maxLength={120}
                    placeholder="Ex.: compras no supermercado"
                  />
                </label>

                <FormDatePicker
                  name="occurredAt"
                  defaultValue={new Date().toISOString().slice(0, 10)}
                  label="Data"
                />
              </div>

              <Button type="submit" className="mt-1 min-h-11 w-full">
                Guardar movimento
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
