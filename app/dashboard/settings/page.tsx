import Link from 'next/link'
import { ArrowLeft, Languages } from 'lucide-react'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'
import { createTranslator, normalizeLocale } from '@/lib/i18n'
import { updateLocale } from './actions'

export const dynamic = 'force-dynamic'

type SearchParams = { saved?: string; error?: string }

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('locale')
    .eq('id', user.id)
    .maybeSingle()
  const locale = normalizeLocale(profile?.locale)
  const t = createTranslator(locale)
  const errorMessage =
    params.error === 'invalid_locale' || params.error === 'save_failed'
      ? t('settings.saveError')
      : null

  return (
    <main className="moneyflow-shell py-6 sm:py-10">
      <Button asChild size="sm" variant="ghost">
        <Link href="/dashboard">
          <ArrowLeft className="size-4" aria-hidden="true" />
          {t('settings.back')}
        </Link>
      </Button>
      <header className="mt-5">
        <p className="text-sm text-[hsl(var(--muted-foreground))]">
          {t('settings.eyebrow')}
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl lg:text-4xl">
          {t('settings.title')}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[hsl(var(--muted-foreground))]">
          {t('settings.description')}
        </p>
      </header>
      {params.saved ? (
        <p
          role="status"
          className="mt-5 rounded-[var(--radius-md)] bg-[hsl(var(--success)/0.08)] px-3 py-2 text-sm"
        >
          {t('settings.saved')}
        </p>
      ) : null}
      {errorMessage ? (
        <p
          role="alert"
          className="mt-5 rounded-[var(--radius-md)] bg-[hsl(var(--danger)/0.08)] px-3 py-2 text-sm"
        >
          {errorMessage}
        </p>
      ) : null}

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(20rem,0.75fr)_minmax(0,1.25fr)] lg:items-start">
        <section className="rounded-[var(--radius-lg)] border bg-[hsl(var(--surface))] p-5 shadow-sm sm:p-6">
          <div className="flex items-start gap-3">
            <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[hsl(var(--surface-muted))]">
              <Languages className="size-4" aria-hidden="true" />
            </span>
            <div>
              <h2 className="font-medium">{t('settings.language')}</h2>
              <p className="mt-1 text-sm leading-6 text-[hsl(var(--muted-foreground))]">
                {t('settings.languageHint')}
              </p>
            </div>
          </div>
        </section>
        <section className="rounded-[var(--radius-lg)] border bg-[hsl(var(--surface))] p-5 shadow-sm sm:p-6">
          <form action={updateLocale} className="max-w-xl space-y-5">
            <label className="grid gap-2 text-sm font-medium">
              <span>{t('settings.language')}</span>
              <select
                name="locale"
                defaultValue={locale}
                className="min-h-11 rounded-[var(--radius-md)] border bg-transparent px-3 font-normal outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
              >
                <option value="pt-PT">{t('settings.portuguese')}</option>
                <option value="en">{t('settings.english')}</option>
              </select>
            </label>
            <Button type="submit">{t('settings.save')}</Button>
          </form>
        </section>
      </div>
    </main>
  )
}
