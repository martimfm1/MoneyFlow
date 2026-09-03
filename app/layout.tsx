import type { Metadata, Viewport } from 'next'
import './globals.css'
import { RegisterServiceWorker } from '@/components/pwa/register-sw'
import { QueryToaster } from '@/components/query-toaster'
import { createClient } from '@/lib/supabase/server'
import { normalizeLocale } from '@/lib/i18n'
import { Geist } from 'next/font/google'
import { cn } from '@/lib/utils'

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' })

export const metadata: Metadata = {
  title: { default: 'MoneyFlow', template: '%s · MoneyFlow' },
  description: 'Track, understand, prioritize and decide what to do with your money.',
  applicationName: 'MoneyFlow',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [{ url: '/icon-192.png', sizes: '192x192', type: 'image/png' }, { url: '/icon-512.png', sizes: '512x512', type: 'image/png' }],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
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

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = user ? await supabase.from('profiles').select('locale').eq('id', user.id).maybeSingle() : { data: null }
  const locale = normalizeLocale(profile?.locale)

  return (
    <html lang={locale} suppressHydrationWarning className={cn('font-sans', geist.variable)}>
      <body><RegisterServiceWorker /><QueryToaster />{children}</body>
    </html>
  )
}
