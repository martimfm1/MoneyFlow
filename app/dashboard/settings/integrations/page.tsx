import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { SilentraForBarbersPanel } from '@/components/integrations/silentra-for-barbers-panel'
import { createClient } from '@/lib/supabase/server'
import { getFinancialContextBySlug } from '@/lib/financial-context'

export const dynamic = 'force-dynamic'

export default async function IntegrationsSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const context = await getFinancialContextBySlug(supabase, user.id, 'silentra')
  if (!context) {
    return (
      <main className="moneyflow-shell py-6 sm:py-10">
        <Button asChild variant="ghost" size="sm"><Link href="/dashboard/settings"><ArrowLeft className="size-4" /> Definições</Link></Button>
        <Card className="mt-6 max-w-2xl"><CardContent className="p-5 text-sm text-muted-foreground">O espaço financeiro Silentra não está disponível nesta conta.</CardContent></Card>
      </main>
    )
  }

  const [{ data: accounts }, { data: integration }] = await Promise.all([
    supabase
      .from('accounts')
      .select('id, name, currency_code')
      .eq('user_id', user.id)
      .eq('context_id', context.id)
      .eq('is_active', true)
      .eq('currency_code', 'EUR')
      .order('name'),
    supabase
      .from('moneyflow_integrations')
      .select('status, connected_at, last_synced_at, account:accounts(name)')
      .eq('user_id', user.id)
      .eq('provider', 'silentra-for-barbers')
      .maybeSingle(),
  ])

  const connected = integration?.status === 'connected'
  const account = Array.isArray(integration?.account) ? integration.account[0] : integration?.account

  return (
    <main className="moneyflow-shell py-6 sm:py-10">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/dashboard/settings"><ArrowLeft className="size-4" /> Definições</Link>
      </Button>
      <header className="mb-6 mt-5 max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Ligações</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Integrações</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">Liga serviços externos ao MoneyFlow sem partilhar credenciais financeiras.</p>
      </header>
      <div className="max-w-3xl">
        <SilentraForBarbersPanel
          accounts={accounts ?? []}
          connected={connected}
          accountName={account?.name ?? null}
          connectedAt={integration?.connected_at ?? null}
          lastSyncedAt={integration?.last_synced_at ?? null}
        />
      </div>
    </main>
  )
}
