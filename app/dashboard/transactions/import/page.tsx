import Link from 'next/link'
import { ArrowLeft, FileSpreadsheet, ShieldCheck } from 'lucide-react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { importRevolutCsv } from './actions'

export const dynamic = 'force-dynamic'

export default async function ImportTransactionsPage({
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
      .select('active_finance_context')
      .eq('id', user.id)
      .maybeSingle(),
    supabase
      .from('accounts')
      .select('id, name, currency_code')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('name', { ascending: true }),
  ])

  const context =
    profile?.active_finance_context === 'silentra' ||
    profile?.active_finance_context === 'general'
      ? profile.active_finance_context
      : 'personal'
  const contextLabel = context === 'silentra' ? 'Silentra' : 'Pessoal'

  return (
    <main className="moneyflow-shell py-6 sm:py-10">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="sm">
          <Link href="/dashboard/transactions">
            <ArrowLeft className="size-4" /> Movimentos
          </Link>
        </Button>
      </div>

      <header className="mt-4 max-w-2xl">
        <p className="text-sm text-[hsl(var(--muted-foreground))]">
          Importação de movimentos
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
          Importar ficheiro CSV
        </h1>
        <p className="mt-2 text-sm leading-6 text-[hsl(var(--muted-foreground))]">
          Importa movimentos exportados da Revolut ou de outro banco compatível.
          Não precisas de ligar a conta bancária nem de partilhar credenciais.
        </p>
      </header>

      {params.error ? (
        <p
          role="alert"
          className="mt-5 rounded-[var(--radius-md)] border border-[hsl(var(--danger)/0.25)] bg-[hsl(var(--danger)/0.08)] px-3 py-2 text-sm"
        >
          {params.error}
        </p>
      ) : null}

      {context === 'general' ? (
        <section className="mt-6 max-w-2xl rounded-[var(--radius-lg)] border bg-[hsl(var(--surface))] p-5 shadow-sm">
          <h2 className="font-semibold">O contexto Geral é apenas de leitura</h2>
          <p className="mt-2 text-sm leading-6 text-[hsl(var(--muted-foreground))]">
            Para importar movimentos, muda o contexto financeiro para Pessoal
            ou Silentra no seletor do dashboard. Assim, cada movimento fica
            guardado no espaço certo.
          </p>
        </section>
      ) : (
        <Card className="mt-6 max-w-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileSpreadsheet className="size-4" aria-hidden="true" />
              Carregar extrato · {contextLabel}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form action={importRevolutCsv} className="grid gap-4">
              <label className="grid gap-2 text-sm font-medium">
                Conta de destino
                <select
                  name="accountId"
                  required
                  defaultValue=""
                  className="min-h-11 rounded-[var(--radius-md)] border bg-transparent px-3"
                >
                  <option value="" disabled>
                    Escolhe uma conta
                  </option>
                  {accounts?.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name} · {account.currency_code}
                    </option>
                  ))}
                </select>
                {!accounts?.length ? (
                  <span className="text-xs font-normal text-[hsl(var(--muted-foreground))]">
                    Ainda não tens contas ativas neste contexto. Cria primeiro
                    uma conta para poderes importar movimentos.
                  </span>
                ) : null}
              </label>

              <label className="grid gap-2 text-sm font-medium">
                Ficheiro CSV
                <input
                  type="file"
                  name="file"
                  accept=".csv,text/csv"
                  required
                  className="min-h-11 w-full rounded-[var(--radius-md)] border bg-transparent px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-[hsl(var(--surface-muted))] file:px-3 file:py-1.5 file:text-sm file:font-medium"
                />
                <span className="text-xs font-normal leading-5 text-[hsl(var(--muted-foreground))]">
                  Até 2,5 MB e 2.000 movimentos por importação. São ignorados
                  movimentos pendentes, revertidos, de outras moedas e já importados.
                </span>
              </label>

              <div className="flex items-start gap-2 rounded-[var(--radius-md)] bg-[hsl(var(--surface-muted))] p-3 text-xs leading-5 text-[hsl(var(--muted-foreground))]">
                <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <p>
                  O ficheiro é processado para registar os movimentos. Não
                  guardamos credenciais bancárias nem o ficheiro original.
                </p>
              </div>

              <Button type="submit" disabled={!accounts?.length}>
                Importar movimentos
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </main>
  )
}
