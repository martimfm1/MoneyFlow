import { redirect } from 'next/navigation'
import { ArrowRight, BriefcaseBusiness, Wallet } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/format'
import { normalizeLocale } from '@/lib/i18n'
import { switchFinancialContext } from '@/app/dashboard/actions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export const dynamic = 'force-dynamic'

type CurrencyTotals = Record<string, number>

export default async function FinancialOverviewPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [{ data: contexts }, { data: accounts }, { data: profile }] =
    await Promise.all([
      supabase
        .from('financial_contexts')
        .select('id, slug, name, context_type, currency_code')
        .eq('user_id', user.id)
        .order('slug'),
      supabase
        .from('accounts')
        .select('id, context_id, balance, currency_code, is_active')
        .eq('user_id', user.id)
        .eq('is_active', true),
      supabase
        .from('profiles')
        .select('locale')
        .eq('id', user.id)
        .maybeSingle(),
    ])

  const locale = normalizeLocale(profile?.locale)
  const isEnglish = locale === 'en'

  return (
    <main className="moneyflow-shell py-6 sm:py-10">
      <header>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {isEnglish ? 'Financial overview' : 'Resumo financeiro'}
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
          {isEnglish ? 'All spaces' : 'Geral'}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          {isEnglish
            ? 'A read-only view of your personal and Silentra spaces. Balances stay separated by currency.'
            : 'Uma visão conjunta dos teus espaços Pessoal e Silentra. Os saldos mantêm-se separados por moeda.'}
        </p>
      </header>

      <div className="mt-6 grid gap-3 lg:grid-cols-2">
        {(contexts ?? []).map((context) => {
          const totals = (accounts ?? [])
            .filter((account) => account.context_id === context.id)
            .reduce<CurrencyTotals>((result, account) => {
              const currency = account.currency_code || context.currency_code
              result[currency] =
                (result[currency] ?? 0) + Number(account.balance)
              return result
            }, {})
          const entries = Object.entries(totals).sort(([a], [b]) =>
            a.localeCompare(b),
          )
          const isBusiness = context.context_type === 'business'

          return (
            <Card key={context.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted">
                    {isBusiness ? (
                      <BriefcaseBusiness className="size-4" aria-hidden="true" />
                    ) : (
                      <Wallet className="size-4" aria-hidden="true" />
                    )}
                  </span>
                  <div className="min-w-0">
                    <CardTitle className="text-base">{context.name}</CardTitle>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {isBusiness
                        ? isEnglish
                          ? 'Business space'
                          : 'Espaço empresarial'
                        : isEnglish
                          ? 'Personal space'
                          : 'Espaço pessoal'}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {entries.length ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {entries.map(([currency, total]) => (
                      <div
                        key={currency}
                        className="rounded-xl border bg-muted/30 p-3"
                      >
                        <p className="text-xs text-muted-foreground">
                          {isEnglish ? 'Balance' : 'Saldo'} · {currency}
                        </p>
                        <p className="mt-1 text-xl font-semibold tabular-nums">
                          {formatCurrency(total, currency)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
                    {isEnglish
                      ? 'No active accounts in this space yet.'
                      : 'Ainda não existem contas ativas neste espaço.'}
                  </p>
                )}
                <form action={switchFinancialContext} className="mt-4">
                  <input type="hidden" name="slug" value={context.slug} />
                  <Button type="submit" variant="outline" className="w-full">
                    {isEnglish ? 'Open space' : 'Abrir espaço'}
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </Button>
                </form>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <p className="mt-5 text-xs leading-5 text-muted-foreground">
        {isEnglish
          ? 'This overview does not combine different currencies or create transfers. Use the space selector to add and manage records in one context at a time.'
          : 'Esta visão não soma moedas diferentes nem cria transferências. Usa o seletor para adicionar e gerir registos num contexto de cada vez.'}
      </p>
    </main>
  )
}
