import Link from 'next/link'
import { Archive, ArchiveRestore, Pencil, Plus, Wallet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/format'
import { redirect } from 'next/navigation'
import { toggleAccountStatus } from './actions'

export const dynamic = 'force-dynamic'

const labels: Record<string, string> = {
  bank: 'Banco',
  cash: 'Dinheiro',
  card: 'Cartão',
  savings: 'Poupança',
  other: 'Outro',
}

export default async function AccountsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: accounts }] = await Promise.all([
    supabase
      .from('profiles')
      .select('currency_code')
      .eq('id', user.id)
      .maybeSingle(),
    supabase
      .from('accounts')
      .select('id, name, account_type, balance, currency_code, is_active')
      .eq('user_id', user.id)
      .order('is_active', { ascending: false })
      .order('created_at', { ascending: true }),
  ])

  const currency = profile?.currency_code ?? 'EUR'
  const activeAccounts = accounts?.filter((account) => account.is_active) ?? []
  const totalBalance = activeAccounts.reduce(
    (sum, account) => sum + Number(account.balance),
    0,
  )

  return (
    <main className="moneyflow-shell py-6 sm:py-10">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            MoneyFlow
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl lg:text-4xl">
            Contas
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[hsl(var(--muted-foreground))]">
            Organiza as contas e saldos que usas no dia a dia.
          </p>
        </div>
        <Button asChild size="sm">
          <Link href="/dashboard/accounts/new">
            <Plus className="size-4" /> Nova
          </Link>
        </Button>
      </header>

      {params.error ? (
        <p
          role="alert"
          className="mt-5 rounded-[var(--radius-md)] bg-[hsl(var(--danger)/0.08)] px-3 py-2 text-sm"
        >
          {params.error}
        </p>
      ) : null}

      {accounts?.length ? (
        <>
          <section className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <article className="rounded-[var(--radius-lg)] border bg-[hsl(var(--surface))] p-5 shadow-sm">
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                Saldo total
              </p>
              <p className="mt-2 text-2xl font-semibold tabular-nums">
                {formatCurrency(totalBalance, currency)}
              </p>
            </article>
            <article className="rounded-[var(--radius-lg)] border bg-[hsl(var(--surface))] p-5 shadow-sm">
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                Contas ativas
              </p>
              <p className="mt-2 text-2xl font-semibold tabular-nums">
                {activeAccounts.length}
              </p>
            </article>
            <article className="rounded-[var(--radius-lg)] border bg-[hsl(var(--surface))] p-5 shadow-sm sm:col-span-2">
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                Gestão
              </p>
              <p className="mt-2 text-sm leading-6">
                Edita uma conta para corrigir o saldo inicial ou arquiva-a
                quando já não fizer parte do teu dinheiro atual.
              </p>
            </article>
          </section>

          <section className="mt-8">
            <div className="mb-4 flex items-center justify-between gap-4">
              <h2 className="text-lg font-semibold">As tuas contas</h2>
              <span className="text-sm text-[hsl(var(--muted-foreground))]">
                {accounts.length} no total
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {accounts.map((account) => (
                <article
                  key={account.id}
                  className={`flex min-h-full flex-col rounded-[var(--radius-lg)] border bg-[hsl(var(--surface))] p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${account.is_active ? '' : 'opacity-75'}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[hsl(var(--surface-muted))]">
                        <Wallet className="size-4" />
                      </span>
                      <div className="min-w-0">
                        <h3 className="truncate font-medium">{account.name}</h3>
                        <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
                          {labels[account.account_type] ?? account.account_type}
                          {account.is_active ? '' : ' · Arquivada'}
                        </p>
                      </div>
                    </div>
                    <p className="shrink-0 text-lg font-semibold tabular-nums">
                      {formatCurrency(
                        Number(account.balance),
                        account.currency_code || currency,
                      )}
                    </p>
                  </div>
                  <div className="mt-auto pt-6 flex flex-wrap gap-2">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/dashboard/accounts/${account.id}/edit`}>
                        <Pencil className="size-4" /> Editar
                      </Link>
                    </Button>
                    <form action={toggleAccountStatus}>
                      <input type="hidden" name="id" value={account.id} />
                      <input
                        type="hidden"
                        name="isActive"
                        value={account.is_active ? 'false' : 'true'}
                      />
                      <Button type="submit" size="sm" variant="ghost">
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
                    </form>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </>
      ) : (
        <section className="mt-8 rounded-[var(--radius-lg)] border border-dashed bg-[hsl(var(--surface))] p-8 text-center">
          <Wallet className="mx-auto size-6" />
          <h2 className="mt-4 font-medium">Ainda não tens contas</h2>
          <p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-[hsl(var(--muted-foreground))]">
            Cria uma conta e indica o saldo atual. Depois, cada movimento mantém
            o saldo sincronizado.
          </p>
          <Button asChild className="mt-5">
            <Link href="/dashboard/accounts/new">Criar primeira conta</Link>
          </Button>
        </section>
      )}
    </main>
  )
}
