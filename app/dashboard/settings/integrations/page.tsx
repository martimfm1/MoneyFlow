import Link from 'next/link'
import { ArrowLeft, Link2, ShieldCheck } from 'lucide-react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getFinancialContextBySlug } from '@/lib/financial-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SilentraIntegrationPanel } from './silentra-integration-panel'

export const dynamic = 'force-dynamic'

export default async function IntegrationsSettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const context = await getFinancialContextBySlug(supabase, user.id, 'silentra')
  if (!context) redirect('/dashboard/settings')

  const [{ data: accounts }, { data: statusRows }] = await Promise.all([
    supabase
      .from('accounts')
      .select('id, name, currency_code, is_active')
      .eq('user_id', user.id)
      .eq('context_id', context.id)
      .eq('is_active', true)
      .eq('currency_code', 'EUR')
      .order('name', { ascending: true }),
    supabase.rpc('get_silentra_integration_status'),
  ])

  const status = Array.isArray(statusRows) ? statusRows[0] : null

  return (
    <main className="moneyflow-shell py-6 sm:py-10">
      <Button asChild size="sm" variant="ghost" className="-ml-2">
        <Link href="/dashboard/settings">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Definições
        </Link>
      </Button>

      <header className="mt-5 max-w-2xl">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
          Ligações
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Integrações
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Liga o MoneyFlow à plataforma Silentra for Barbers para registar
          automaticamente os pagamentos confirmados das subscrições.
        </p>
      </header>

      <div className="mt-7 grid max-w-3xl gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Link2 className="size-4" aria-hidden="true" />
              Silentra for Barbers
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <p className="text-sm leading-6 text-muted-foreground">
              Só são sincronizados pagamentos efetivamente recebidos pela
              plataforma — subscrições pagas por Stripe ou pagamentos manuais
              confirmados. Marcações e vendas das barbearias não entram nesta
              conta, porque pertencem aos respetivos negócios.
            </p>
            <SilentraIntegrationPanel
              accounts={(accounts ?? []).map((account) => ({
                id: account.id,
                name: account.name,
                currencyCode: account.currency_code,
              }))}
              connected={
                status?.is_connected === true
                  ? {
                      accountId: status.account_id as string,
                      accountName: status.account_name as string,
                      currencyCode: status.currency_code as string,
                      connectedAt: status.connected_at as string,
                    }
                  : null
              }
            />
            <div className="flex items-start gap-2 rounded-xl bg-muted/50 p-3 text-xs leading-5 text-muted-foreground">
              <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <p>
                A ligação usa um código temporário de utilização única. Não
                partilha palavras-passe nem dá acesso às contas das barbearias.
                Cada pagamento é importado uma única vez.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
