import Link from 'next/link'
import { ArrowLeft, Languages, Palette, Sparkles } from 'lucide-react'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme/theme-toggle'
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
  const isEnglish = locale === 'en'
  const errorMessage =
    params.error === 'invalid_locale' || params.error === 'save_failed'
      ? t('settings.saveError')
      : null

  return (
    <div className="moneyflow-shell py-6 sm:py-8 lg:py-10">
      <Button asChild size="sm" variant="ghost" className="-ml-2">
        <Link href="/dashboard">
          <ArrowLeft className="size-4" aria-hidden="true" />
          {t('settings.back')}
        </Link>
      </Button>

      <header className="mt-5 max-w-2xl">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
          {isEnglish ? 'Make it yours' : 'Personaliza a experiência'}
        </p>
        <h1 className="mt-2 text-[clamp(1.8rem,4vw,2.55rem)] font-semibold tracking-[-0.045em]">
          {t('settings.title')}
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {t('settings.description')}
        </p>
      </header>

      {params.saved ? (
        <p
          role="status"
          className="mt-5 max-w-3xl rounded-xl border border-[hsl(var(--success)/0.25)] bg-[hsl(var(--success)/0.08)] px-4 py-3 text-sm"
        >
          {t('settings.saved')}
        </p>
      ) : null}
      {errorMessage ? (
        <p
          role="alert"
          className="mt-5 max-w-3xl rounded-xl border border-[hsl(var(--danger)/0.25)] bg-[hsl(var(--danger)/0.08)] px-4 py-3 text-sm"
        >
          {errorMessage}
        </p>
      ) : null}

      <div className="mt-8 grid max-w-5xl gap-4 xl:grid-cols-[minmax(16rem,0.8fr)_minmax(0,1.2fr)]">
        <section
          className="overflow-hidden rounded-2xl border border-border/80 bg-card/75 shadow-sm"
          aria-labelledby="language-title"
        >
          <div className="border-b border-border/70 p-5 sm:p-6">
            <span className="mb-4 inline-flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Languages className="size-[18px]" aria-hidden="true" />
            </span>
            <h2
              id="language-title"
              className="text-base font-semibold tracking-tight"
            >
              {t('settings.language')}
            </h2>
            <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
              {t('settings.languageHint')}
            </p>
          </div>
          <form
            action={updateLocale}
            className="flex flex-col gap-3 p-5 sm:p-6"
          >
            <label
              className="text-xs font-semibold text-muted-foreground"
              htmlFor="settings-locale"
            >
              {isEnglish ? 'Display language' : 'Idioma de apresentação'}
            </label>
            <select
              id="settings-locale"
              name="locale"
              defaultValue={locale}
              className="min-h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none transition-colors focus-visible:border-primary/50 focus-visible:ring-2 focus-visible:ring-ring/30"
            >
              <option value="pt-PT">{t('settings.portuguese')}</option>
              <option value="en">{t('settings.english')}</option>
            </select>
            <Button type="submit" className="w-full">
              {t('settings.save')}
            </Button>
          </form>
        </section>

        <section
          className="overflow-hidden rounded-2xl border border-border/80 bg-card/75 shadow-sm"
          aria-labelledby="appearance-title"
        >
          <div className="border-b border-border/70 p-5 sm:p-6">
            <span className="mb-4 inline-flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Palette className="size-[18px]" aria-hidden="true" />
            </span>
            <h2
              id="appearance-title"
              className="text-base font-semibold tracking-tight"
            >
              {isEnglish ? 'Appearance' : 'Aparência'}
            </h2>
            <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
              {isEnglish
                ? 'Choose how MoneyFlow looks and feels. Your preferences stay on this device.'
                : 'Escolhe o aspeto do MoneyFlow. As preferências ficam guardadas neste dispositivo.'}
            </p>
          </div>
          <div className="p-5 sm:p-6">
            <ThemeToggle locale={locale} />
          </div>
        </section>
      </div>

      <section className="mt-6 max-w-5xl overflow-hidden rounded-2xl border border-border/80 bg-card/75 shadow-sm">
        <Link
          href="/dashboard/settings/integrations"
          className="flex flex-col gap-3 p-5 transition-colors hover:bg-muted/30 sm:flex-row sm:items-center sm:justify-between sm:p-6"
        >
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-primary" aria-hidden="true" />
              <h2 className="text-sm font-semibold">
                {isEnglish ? 'Integrations' : 'Integrações'}
              </h2>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {isEnglish
                ? 'Connect Silentra for Barbers and automatically record confirmed platform subscription revenue.'
                : 'Liga o Silentra for Barbers e regista automaticamente as receitas confirmadas das subscrições da plataforma.'}
            </p>
          </div>
          <span className="inline-flex min-h-10 items-center justify-center rounded-lg border border-border px-3 text-xs font-semibold">
            {isEnglish ? 'Manage integrations' : 'Gerir integrações'}
          </span>
        </Link>
      </section>

      <div className="mt-6 flex max-w-5xl items-start gap-3 rounded-2xl border border-border/70 bg-muted/35 p-4">
        <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-background text-primary">
          <Sparkles className="size-4" aria-hidden="true" />
        </span>
        <p className="text-xs leading-5 text-muted-foreground">
          {isEnglish
            ? 'Tip: the accent colour changes highlights, active navigation and focus states without changing your financial data.'
            : 'Dica: a cor de destaque altera realces, navegação ativa e estados de foco, sem alterar os teus dados financeiros.'}
        </p>
      </div>
    </div>
  )
}
