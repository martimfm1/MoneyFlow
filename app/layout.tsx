import type { Metadata, Viewport } from 'next'
import './globals.css'
import { ThemeToggle } from '@/components/theme/theme-toggle'
import { RegisterServiceWorker } from '@/components/pwa/register-sw'

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

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-PT" suppressHydrationWarning>
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
