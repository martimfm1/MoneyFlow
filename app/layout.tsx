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
        <a
          href="#main-content"
          className="sr-only fixed left-4 top-4 z-[100] rounded-[var(--radius-md)] bg-[hsl(var(--foreground))] px-4 py-2 text-sm font-medium text-[hsl(var(--background))] focus:not-sr-only focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] focus:ring-offset-2 focus:ring-offset-[hsl(var(--background))]"
        >
          Saltar para o conteúdo principal
        </a>
        <RegisterServiceWorker />
        <div className="fixed right-4 top-4 z-50">
          <ThemeToggle />
        </div>
        <div id="main-content" tabIndex={-1}>
          {children}
        </div>
      </body>
    </html>
  )
}
