import type { Metadata, Viewport } from 'next'
import './globals.css'
import { RegisterServiceWorker } from '@/components/pwa/register-sw'
import { ToastViewport } from '@/components/toast-viewport'
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
    ? await supabase
        .from('profiles')
        .select('locale')
        .eq('id', user.id)
        .maybeSingle()
    : { data: null }

  const locale = normalizeLocale(profile?.locale)

  return (
    <html lang={locale} suppressHydrationWarning>
      <body>
        <RegisterServiceWorker />
        <ToastViewport />
        {children}
      </body>
    </html>
  )
}
