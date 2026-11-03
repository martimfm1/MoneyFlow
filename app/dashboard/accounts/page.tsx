import Link from 'next/link'
import { Archive, ArchiveRestore, Pencil, Plus, Wallet } from 'lucide-react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/format'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { toggleAccountStatus } from './actions'
import { DeleteAccountButton } from './delete-button'

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
  searchParams: Promise<{ error?: string; toast?: string }>
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
      .order('created_at'),
  ])
  const currency = profile?.currency_code ?? 'EUR'
  const rows = accounts ?? []
  const active = rows.filter((item) => item.is_active)
  const activeInPrimaryCurrency = active.filter(
    (item) => (item.currency_code || currency) === currency,
  )
  const activeInOtherCurrencies = active.length - activeInPrimaryCurrency.length
  const total = activeInPrimaryCurrency.reduce(
    (sum, item) => sum + Number(item.balance),
    0,
  )

  return (
    <main className="moneyflow-shell py-6 sm:py-10">
      <header className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs text-muted-foreground">Financeiro</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
            Contas
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
            Organiza os saldos dos teus bancos, cartões, dinheiro e poupanças.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/accounts/new">
            <Plus className="size-4" aria-hidden="true" /> Nova conta
          </Link>
        </Button>
      </header>
      {params.toast ? (
        <p
          role="status"
          className="mt-4 rounded-[var(--radius-md)] border border-[hsl(var(--success)/0.25)] bg-[hsl(var(--success)/0.08)] px-3 py-2 text-sm"
        >
          {params.toast}
        </p>
      ) : null}
      {params.error ? (
        <Card className="mt-4 border-destructive/30 bg-destructive/5">
          <CardContent className="pt-4 text-sm text-destructive" role="alert">
            {params.error}
          </CardContent>
        </Card>
      ) : null}
      <section className="mt-6 grid gap-3 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">
              Saldo total · {currency}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums">
              {formatCurrency(total, currency)}
            </p>
            {activeInOtherCurrencies > 0 ? (
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                {activeInOtherCurrencies} conta
                {activeInOtherCurrencies === 1 ? '' : 's'} ativa
                {activeInOtherCurrencies === 1 ? '' : 's'} noutra moeda
                {activeInOtherCurrencies === 1 ? '' : 's'} não incluída
                {activeInOtherCurrencies === 1 ? '' : 's'} neste total.
              </p>
            ) : null}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">
              Contas ativas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums">
              {active.length}
            </p>
          </CardContent>
        </Card>
      </section>
      {rows.length ? (
        <section className="mt-6" aria-labelledby="accounts-list-title">
          <div className="mb-3">
            <h2 id="accounts-list-title" className="text-base font-semibold">
              As tuas contas
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Consulta saldos e gere o estado de cada conta.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {rows.map((account) => (
              <article
                key={account.id}
                className="min-w-0 rounded-[var(--radius-lg)] border bg-card p-4 shadow-sm sm:p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      href={`/dashboard/accounts/${account.id}`}
                      className="break-words font-semibold hover:underline"
                    >
                      {account.name}
                    </Link>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {labels[account.account_type] ?? account.account_type}
                    </p>
                  </div>
                  <Badge
                    variant={account.is_active ? 'secondary' : 'outline'}
                  >
                    {account.is_active ? 'Ativa' : 'Arquivada'}
                  </Badge>
                </div>

                <div className="mt-5">
                  <p className="text-xs text-muted-foreground">Saldo</p>
                  <p className="mt-1 break-words text-2xl font-semibold tabular-nums">
                    {formatCurrency(
                      Number(account.balance),
                      account.currency_code || currency,
                    )}
                  </p>
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-2 border-t pt-4">
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/dashboard/accounts/${account.id}/edit`}>
                      <Pencil className="size-4" aria-hidden="true" />
                      Editar
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
                        <Archive className="size-4" aria-hidden="true" />
                      ) : (
                        <ArchiveRestore
                          className="size-4"
                          aria-hidden="true"
                        />
                      )}
                      {account.is_active ? 'Arquivar' : 'Reativar'}
                    </Button>
                  </form>
                  <DeleteAccountButton id={account.id} name={account.name} />
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : (
        <Empty className="mt-6 border bg-card">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Wallet className="size-4" />
            </EmptyMedia>
            <EmptyTitle>Sem contas</EmptyTitle>
            <EmptyDescription>Adiciona a primeira conta.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button asChild>
              <Link href="/dashboard/accounts/new">Criar conta</Link>
            </Button>
          </EmptyContent>
        </Empty>
      )}
    </main>
  )
}
