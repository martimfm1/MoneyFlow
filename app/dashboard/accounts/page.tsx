import Link from 'next/link'
import { Plus, Wallet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

const labels: Record<string, string> = {
  bank: 'Banco',
  cash: 'Dinheiro',
  card: 'Cartão',
  savings: 'Poupança',
  other: 'Outro',
}

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat('pt-PT', { style: 'currency', currency }).format(
    amount,
  )
}

export default async function AccountsPage() {
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
      .order('created_at', { ascending: true }),
  ])

  const currency = profile?.currency_code ?? 'EUR'

  return (
    <main className="moneyflow-shell py-6 sm:py-10">
      <header className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            MoneyFlow
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Contas</h1>
        </div>
        <Button asChild size="sm">
          <Link href="/dashboard/accounts/new">
            <Plus className="size-4" /> Nova
          </Link>
        </Button>
      </header>

      {!accounts?.length ? (
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
      ) : (
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {accounts.map((account) => (
            <article
              key={account.id}
              className="rounded-[var(--radius-lg)] border bg-[hsl(var(--surface))] p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="inline-flex size-10 items-center justify-center rounded-[var(--radius-md)] bg-[hsl(var(--surface-muted))]">
                    <Wallet className="size-4" />
                  </span>
                  <div>
                    <h2 className="font-medium">{account.name}</h2>
                    <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
                      {labels[account.account_type] ?? account.account_type}
                      {account.is_active ? '' : ' · Arquivada'}
                    </p>
                  </div>
                </div>
                <p className="text-lg font-semibold tabular-nums">
                  {formatMoney(
                    Number(account.balance),
                    account.currency_code || currency,
                  )}
                </p>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  )
}
