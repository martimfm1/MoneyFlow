import type { Metadata, Viewport } from 'next'
import './globals.css'
import { ThemeToggle } from '@/components/theme/theme-toggle'
import { RegisterServiceWorker } from '@/components/pwa/register-sw'
import { createClient } from '@/lib/supabase/server'
import { normalizeLocale } from '@/lib/i18n'

export const metadata: Metadata = {
  title: {
    default: 'MoneyFlow',
    template: '%s · MoneyFlow',
  },
  description:
    'Track, understand, prioritize and decide what to do with your money.',
  applicationName: 'MoneyFlow',
  manifest: '/manifest.webmanifest',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fafafa' },
    { media: '(prefers-color-scheme: dark)', color: '#09090b' },
  ],
}

export default async function RootLayout({
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

  return (
    <html lang={locale} suppressHydrationWarning>
      <body>
        <RegisterServiceWorker />
        <div className="fixed right-4 top-4 z-50">
          <ThemeToggle />
        </div>
        {children}
      </body>
    </html>
  )
}
