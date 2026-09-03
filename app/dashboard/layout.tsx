import Link from 'next/link'
import { Settings } from 'lucide-react'
import { DashboardNavigation } from './navigation'
import { createClient } from '@/lib/supabase/server'
import { createTranslator, normalizeLocale } from '@/lib/i18n'

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = user
    ? await supabase.from('profiles').select('locale').eq('id', user.id).maybeSingle()
    : { data: null }

  const locale = normalizeLocale(profile?.locale)
  const t = createTranslator(locale)

  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
      <a
        href="#main-content"
        className="sr-only fixed left-4 top-4 z-[100] rounded-[var(--radius-md)] bg-[hsl(var(--foreground))] px-4 py-2 text-sm font-medium text-[hsl(var(--background))] focus:not-sr-only focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] focus:ring-offset-2 focus:ring-offset-[hsl(var(--background))]"
      >
        {locale === 'en' ? 'Skip to main content' : 'Saltar para o conteúdo principal'}
      </a>

      <div className="mx-auto max-w-7xl md:flex md:gap-6 md:px-6">
        <aside className="hidden w-60 shrink-0 py-6 md:block">
          <div className="sticky top-6 space-y-4">
            <div className="flex items-start justify-between gap-3 px-3">
              <div>
                <p className="text-sm font-semibold tracking-tight">MoneyFlow</p>
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
            <DashboardNavigation locale={locale} />
          </div>
        </aside>
        <main
          id="main-content"
          tabIndex={-1}
          className="min-w-0 flex-1 pb-16 outline-none md:pb-8"
        >
          {children}
        </main>
      </div>
      <div className="fixed bottom-[5.5rem] right-4 z-30 md:hidden">
        {user ? (
          <Link
            href="/dashboard/settings"
            aria-label={t('nav.settings')}
            className="inline-flex size-11 items-center justify-center rounded-full border bg-[hsl(var(--surface))] text-[hsl(var(--muted-foreground))] shadow-sm transition-colors hover:text-[hsl(var(--foreground))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
          >
            <Settings className="size-4" aria-hidden="true" />
          </Link>
        ) : null}
      </div>
      <div className="md:hidden">
        <DashboardNavigation locale={locale} />
      </div>
    </div>
  )
}
