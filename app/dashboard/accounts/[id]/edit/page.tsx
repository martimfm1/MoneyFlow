import Link from 'next/link'
import { ArrowLeft, Archive, ArchiveRestore } from 'lucide-react'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { toggleAccountStatus, updateAccount } from '../../actions'

export const dynamic = 'force-dynamic'

const labels: Record<string, string> = {
  bank: 'Banco',
  cash: 'Dinheiro',
  card: 'Cartão',
  savings: 'Poupança',
  other: 'Outro',
}

export default async function EditAccountPage({
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

  const { data: account } = await supabase
    .from('accounts')
    .select('id, name, account_type, balance, currency_code, is_active')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!account) notFound()

  return (
    <main className="moneyflow-shell py-6 sm:py-10">
      <Button asChild size="sm" variant="ghost">
        <Link href="/dashboard/accounts">
          <ArrowLeft className="size-4" /> Contas
        </Link>
      </Button>

      <header className="mt-5">
        <p className="text-sm text-[hsl(var(--muted-foreground))]">Conta</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Gerir conta</h1>
        <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
          {labels[account.account_type] ?? account.account_type} · {account.currency_code}
        </p>
      </header>

      {query.error ? (
        <p className="mt-5 rounded-[var(--radius-md)] bg-[hsl(var(--danger)/0.08)] px-3 py-2 text-sm">
          {query.error}
        </p>
      ) : null}

      <section className="mt-6 rounded-[var(--radius-lg)] border bg-[hsl(var(--surface))] p-5 shadow-sm sm:p-6">
        <form action={updateAccount} className="space-y-5">
          <input type="hidden" name="id" value={account.id} />

          <label className="grid gap-2 text-sm font-medium">
            Nome
            <input
              name="name"
              defaultValue={account.name}
              maxLength={80}
              required
              className="min-h-11 rounded-[var(--radius-md)] border bg-transparent px-3 font-normal outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
            />
          </label>

          <label className="grid gap-2 text-sm font-medium">
            Tipo
            <select
              name="accountType"
              defaultValue={account.account_type}
              className="min-h-11 rounded-[var(--radius-md)] border bg-transparent px-3 font-normal outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
            >
              <option value="bank">Banco</option>
              <option value="cash">Dinheiro</option>
              <option value="card">Cartão</option>
              <option value="savings">Poupança</option>
              <option value="other">Outro</option>
            </select>
          </label>

          <div className="rounded-[var(--radius-md)] bg-[hsl(var(--surface-muted))] p-4">
            <p className="text-xs text-[hsl(var(--muted-foreground))]">Saldo atual</p>
            <p className="mt-1 text-xl font-semibold tabular-nums">
              {new Intl.NumberFormat('pt-PT', {
                style: 'currency',
                currency: account.currency_code,
              }).format(Number(account.balance))}
            </p>
            <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
              O saldo é calculado pelos movimentos registados nesta conta.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-5">
            <Button asChild variant="ghost">
              <Link href="/dashboard/accounts">Cancelar</Link>
            </Button>
            <div className="flex flex-wrap gap-2">
              <Button
                type="submit"
                formAction={toggleAccountStatus}
                name="isActive"
                value={account.is_active ? 'false' : 'true'}
                variant="outline"
              >
                {account.is_active ? (
                  <>
                    <Archive className="size-4" /> Arquivar
                  </>
                ) : (
                  <>
                    <ArchiveRestore className="size-4" /> Reativar
                  </>
                )}
              </Button>
              <Button type="submit">Guardar alterações</Button>
            </div>
          </div>
        </form>
      </section>
    </main>
  )
}
