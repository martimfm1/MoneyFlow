import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'
import { normalizeLocale } from '@/lib/i18n'
import { SilentraIntegrationCard } from '@/components/integrations/silentra-integration-card'

export const dynamic = 'force-dynamic'

export default async function IntegrationsSettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [{ data: profile }, { data: context }, { data: integration }] =
    await Promise.all([
      supabase
        .from('profiles')
        .select('locale, active_finance_context')
        .eq('id', user.id)
        .maybeSingle(),
      supabase
        .from('financial_contexts')
        .select('id')
        .eq('user_id', user.id)
        .eq('slug', 'silentra')
        .maybeSingle(),
      supabase
        .from('moneyflow_integrations')
        .select('account_id, status, connected_at, last_synced_at')
        .eq('user_id', user.id)
        .eq('provider', 'silentra-for-barbers')
        .eq('status', 'connected')
        .maybeSingle(),
    ])

  const locale = normalizeLocale(profile?.locale)
  const isEnglish = locale === 'en'
  const isSilentraContext = profile?.active_finance_context === 'silentra'

  const [{ data: accounts }, { data: linkedAccount }] = await Promise.all([
    context && isSilentraContext
      ? supabase
          .from('accounts')
          .select('id, name, currency_code')
          .eq('user_id', user.id)
          .eq('context_id', context.id)
          .eq('is_active', true)
          .eq('currency_code', 'EUR')
          .order('name', { ascending: true })
      : Promise.resolve({ data: [] }),
    integration
      ? supabase
          .from('accounts')
          .select('name, currency_code')
          .eq('id', integration.account_id)
          .eq('user_id', user.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ])

  const initialConnection =
    integration?.status === 'connected'
      ? {
          account_id: integration.account_id,
          account_name: linkedAccount?.name ?? 'Conta Silentra',
          currency_code: linkedAccount?.currency_code ?? 'EUR',
          connected_at: integration.connected_at,
          last_synced_at: integration.last_synced_at,
        }
      : null

  return (
    <div className="moneyflow-shell py-6 sm:py-8 lg:py-10">
      <Button asChild size="sm" variant="ghost" className="-ml-2">
        <Link href="/dashboard/settings">
          <ArrowLeft className="size-4" aria-hidden="true" />
          {isEnglish ? 'Settings' : 'Definições'}
        </Link>
      </Button>

      <header className="mt-5 max-w-2xl">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
          {isEnglish ? 'Connected services' : 'Serviços ligados'}
        </p>
        <h1 className="mt-2 text-[clamp(1.8rem,4vw,2.55rem)] font-semibold tracking-[-0.045em]">
          {isEnglish ? 'Integrations' : 'Integrações'}
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {isEnglish
            ? 'Connect trusted apps that create traceable financial entries in MoneyFlow.'
            : 'Liga aplicações de confiança que criam movimentos financeiros rastreáveis no MoneyFlow.'}
        </p>
      </header>

      {context ? (
        <div className="mt-8 max-w-3xl">
          <SilentraIntegrationCard
            accounts={accounts ?? []}
            initialConnection={initialConnection}
            locale={locale}
            isSilentraContext={isSilentraContext}
          />
        </div>
      ) : (
        <div className="mt-8 max-w-3xl rounded-2xl border border-dashed border-border p-5">
          <p className="text-sm font-semibold">
            {isEnglish ? 'Silentra finance space unavailable' : 'Espaço financeiro Silentra indisponível'}
          </p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {isEnglish
              ? 'Create or activate the Silentra finance space before connecting the platform.'
              : 'Cria ou ativa o espaço financeiro Silentra antes de ligares a plataforma.'}
          </p>
        </div>
      )}
    </div>
  )
}
