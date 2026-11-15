import Image from 'next/image'
import type { ReactNode } from 'react'
import Link from 'next/link'
import { ArrowUpRight, Plus } from 'lucide-react'
import { DashboardNavigation } from './navigation'
import { SilentraCredit } from '@/components/silentra-credit'
import { QuickAdd } from '@/components/dashboard/quick-add'
import { createClient } from '@/lib/supabase/server'
import { createTranslator, normalizeLocale } from '@/lib/i18n'
import { FinancialContextSwitcher } from '@/components/dashboard/financial-context-switcher'
import { getFinancialContextSelection } from '@/lib/financial-context'
import { Button } from '@/components/ui/button'

export default async function DashboardLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = user
    ? await supabase
        .from('profiles')
        .select('locale, active_finance_context')
        .eq('id', user.id)
        .maybeSingle()
    : { data: null }

  const locale = normalizeLocale(profile?.locale)
  const t = createTranslator(locale)
  const activeContext = user
    ? await getFinancialContextSelection(supabase, user.id)
    : null
  const isEnglish = locale === 'en'

  return (
    <div className="min-h-screen bg-background">
      <a
        href="#main-content"
        className="sr-only fixed left-4 top-4 z-[100] rounded-lg bg-foreground px-4 py-2 text-sm font-semibold text-background focus:not-sr-only focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
      >
        {isEnglish ? 'Skip to main content' : 'Saltar para o conteúdo principal'}
      </a>

      <div className="mx-auto min-h-screen max-w-[1720px] lg:grid lg:grid-cols-[16.5rem_minmax(0,1fr)]">
        <aside className="hidden border-r border-sidebar-border/80 bg-sidebar/70 lg:block">
          <div className="sticky top-0 flex h-screen flex-col px-4 py-6">
            <Link href="/dashboard" className="group flex items-center gap-3 px-2">
              <Image
                src="/moneyflow-icon.svg"
                alt=""
                width={40}
                height={40}
                className="rounded-xl shadow-lg shadow-primary/10 transition-transform group-hover:scale-[1.04]"
              />
              <span className="min-w-0">
                <span className="block text-[15px] font-bold tracking-tight text-sidebar-foreground">MoneyFlow</span>
                <span className="mt-0.5 block text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Money, in focus</span>
              </span>
            </Link>

            <div className="mx-2 mt-7 rounded-xl border border-sidebar-border/80 bg-background/35 px-3 py-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                {isEnglish ? 'Your workspace' : 'O teu espaço'}
              </p>
              <p className="mt-1 text-sm font-medium text-sidebar-foreground">
                {activeContext === 'silentra' ? 'Silentra' : activeContext === 'general' ? (isEnglish ? 'Overview' : 'Visão geral') : (isEnglish ? 'Personal space' : 'Espaço pessoal')}
              </p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                {isEnglish ? 'One clear view of your money.' : 'Uma visão clara do teu dinheiro.'}
              </p>
            </div>

            <DashboardNavigation locale={locale} variant="sidebar" />

            <div className="mt-auto rounded-xl border border-sidebar-border/70 bg-background/35 p-3">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-primary shadow-[0_0_12px_hsl(var(--primary)/0.8)]" />
                <p className="text-xs font-semibold text-sidebar-foreground">
                  {isEnglish ? 'All in one place' : 'Tudo no mesmo lugar'}
                </p>
              </div>
              <p className="mt-1.5 text-[11px] leading-5 text-muted-foreground">
                {isEnglish ? 'Track today. Plan tomorrow.' : 'Controla hoje. Planeia amanhã.'}
              </p>
            </div>
          </div>
        </aside>

        <div className="min-w-0">
          <div className="sticky top-0 z-30 border-b border-border/70 bg-background/82 backdrop-blur-xl">
            <div className="moneyflow-shell flex min-h-[4.25rem] items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="lg:hidden">
                  <Link href="/dashboard" className="flex items-center gap-2.5">
                    <Image src="/moneyflow-icon.svg" alt="" width={32} height={32} className="rounded-lg" />
                    <span className="text-sm font-bold tracking-tight">MoneyFlow</span>
                  </Link>
                </div>
                {activeContext ? <FinancialContextSwitcher active={activeContext} locale={locale} /> : null}
                {activeContext === 'general' ? (
                  <span className="hidden text-xs text-muted-foreground sm:inline">
                    {isEnglish ? 'Read-only overview' : 'Visão geral · só leitura'}
                  </span>
                ) : null}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="hidden text-xs font-medium text-muted-foreground md:inline">
                  {isEnglish ? 'Make every move count' : 'Cada movimento conta'}
                </span>
                {user && activeContext !== 'general' ? (
                  <Button asChild size="sm" className="hidden shadow-sm shadow-primary/10 sm:inline-flex">
                    <Link href="/dashboard/transactions/new">
                      <Plus className="size-4" aria-hidden="true" />
                      {isEnglish ? 'Add transaction' : 'Novo movimento'}
                    </Link>
                  </Button>
                ) : null}
                <Link
                  href="/dashboard/settings"
                  aria-label={t('nav.settings')}
                  className="inline-flex size-9 items-center justify-center rounded-lg border border-border/70 bg-card/70 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:hidden"
                >
                  <ArrowUpRight className="size-4" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>

          <main id="main-content" tabIndex={-1} className="min-w-0 pb-24 outline-none lg:pb-10">
            {children}
            <div className="moneyflow-shell pb-5 pt-5">
              <SilentraCredit className="border-t border-border/60 pt-5" />
            </div>
          </main>
        </div>
      </div>

      {user && activeContext !== 'general' ? <QuickAdd locale={locale} /> : null}
      <div className="lg:hidden">
        <DashboardNavigation locale={locale} />
      </div>
    </div>
  )
}
