import Link from 'next/link'
import { ArrowLeft, Link2 } from 'lucide-react'
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

  const [{ data: profile }, { data: context }] = await Promise.all([
    supabase
      .from('profiles')
      .select('locale')
      .eq('id', user.id)
      .maybeSingle(),
    supabase
      .from('financial_contexts')
      .select('id')
      .eq('user_id', user.id)
      .eq('slug', 'silentra')
      .maybeSingle(),
  ])

  const locale = normalizeLocale(profile?.locale)
  const isEnglish = locale === 'en'

  const [{ data: accounts }, { data: integration }] = context
    ? await Promise.all([
        supabase
          .from('accounts')
          .select('id, name, currency_code')
          .eq('user_id', user.id)
          .eq('context_id', context.id)
          .eq('is_active', true)
          .eq('currency_code', 'EUR')
          .order('name', { ascending: true }),
        supabase
          .from('silentra_integrations')
          .select('account_id, account_name, currency_code, connected_at, last_synced_at')
          .eq('user_id', user.id)
          .eq('status', 'connected')
          .maybeSingle(),
      ])
    : [{ data: [] }, { data: null }]

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
            ? 'Connect services that create useful, traceable financial entries in MoneyFlow.'
            : 'Liga serviços que criam movimentos financeiros úteis e rastreáveis no MoneyFlow.'}
        </p>
      </header>

      {context ? (
        <div className="mt-8 max-w-3xl">
          <SilentraIntegrationCard
            accounts={accounts ?? []}
            initialConnection={integration ?? null}
            locale={locale}
          />
        </div>
      ) : (
        <div className="mt-8 max-w-3xl rounded-2xl border border-dashed border-border p-5">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Link2 className="size-4 text-muted-foreground" />
            {isEnglish ? 'Silentra finance space unavailable' : 'Espaço financeiro Silentra indisponível'}
          </div>
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
