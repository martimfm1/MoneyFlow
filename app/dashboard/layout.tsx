import type { ReactNode } from 'react'
import Link from 'next/link'
import { Settings } from 'lucide-react'
import { DashboardNavigation } from './navigation'
import { QuickAdd } from '@/components/dashboard/quick-add'
import { createClient } from '@/lib/supabase/server'
import { createTranslator, normalizeLocale } from '@/lib/i18n'

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
        .select('locale')
        .eq('id', user.id)
        .maybeSingle()
    : { data: null }

  const locale = normalizeLocale(profile?.locale)
  const t = createTranslator(locale)

  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
      <a
        href="#main-content"
        className="sr-only fixed left-4 top-4 z-[100] rounded-[var(--radius-md)] bg-[hsl(var(--foreground))] px-4 py-2 text-sm font-medium text-[hsl(var(--background))] focus:not-sr-only focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] focus:ring-offset-2 focus:ring-offset-[hsl(var(--background))]"
      >
        {locale === 'en'
          ? 'Skip to main content'
          : 'Saltar para o conteúdo principal'}
      </a>

      <div className="mx-auto min-h-screen max-w-[1600px] lg:grid lg:grid-cols-[17rem_minmax(0,1fr)] lg:gap-8 lg:px-6 xl:px-8">
        <aside className="hidden lg:block">
          <div className="sticky top-0 flex h-screen flex-col py-6">
            <div className="flex items-start justify-between gap-3 px-3 pb-5">
              <div>
                <p className="text-base font-semibold tracking-tight">
                  MoneyFlow
                </p>
                <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
                  Track → Understand → Decide
                </p>
              </div>
              {user ? (
                <Link
                  href="/dashboard/settings"
                  aria-label={t('nav.settings')}
                  className="inline-flex size-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] text-[hsl(var(--muted-foreground))] transition-colors hover:bg-[hsl(var(--surface-muted))] hover:text-[hsl(var(--foreground))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
                >
                  <Settings className="size-4" aria-hidden="true" />
                </Link>
              ) : null}
            </div>
            <DashboardNavigation locale={locale} variant="sidebar" />
            <div className="mt-auto px-3 pt-5 text-xs leading-5 text-[hsl(var(--muted-foreground))]">
              <p>MoneyFlow</p>
              <p>Finanças pessoais, com contexto.</p>
            </div>
          </div>
        </aside>

        <main
          id="main-content"
          tabIndex={-1}
          className="min-w-0 pb-20 outline-none lg:pb-10"
        >
          {children}
        </main>
      </div>

      {user ? <QuickAdd /> : null}
      <div className="lg:hidden">
        <DashboardNavigation locale={locale} />
      </div>
    </div>
  )
}
