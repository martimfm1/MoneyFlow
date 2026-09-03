'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  CalendarClock,
  ChartNoAxesCombined,
  ChevronUp,
  CircleDollarSign,
  Heart,
  Home,
  List,
  MoreHorizontal,
  Settings,
  Tags,
  Target,
  WalletCards,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import { createTranslator, type MoneyFlowLocale } from '@/lib/i18n'

const primaryItems = [
  { href: '/dashboard', key: 'nav.home' as const, icon: Home },
  { href: '/dashboard/goals', key: 'nav.goals' as const, icon: Target },
  { href: '/dashboard/wishlist', key: 'nav.wishlist' as const, icon: Heart },
  {
    href: '/dashboard/transactions',
    key: 'nav.transactions' as const,
    icon: List,
  },
]

const moreItems = [
  {
    href: '/dashboard/accounts',
    key: 'nav.accounts' as const,
    icon: WalletCards,
  },
  {
    href: '/dashboard/budgets',
    label: { 'pt-PT': 'Orçamentos', en: 'Budgets' },
    icon: CircleDollarSign,
  },
  {
    href: '/dashboard/analytics',
    label: { 'pt-PT': 'Analytics', en: 'Analytics' },
    icon: ChartNoAxesCombined,
  },
  {
    href: '/dashboard/recurring',
    key: 'nav.recurring' as const,
    icon: CalendarClock,
  },
  {
    href: '/dashboard/categories',
    label: { 'pt-PT': 'Categorias', en: 'Categories' },
    icon: Tags,
  },
  { href: '/dashboard/settings', key: 'nav.settings' as const, icon: Settings },
]

function isItemActive(pathname: string, href: string) {
  return href === '/dashboard' ? pathname === href : pathname.startsWith(href)
}

type DashboardNavigationProps = {
  locale: MoneyFlowLocale
  variant?: 'mobile' | 'sidebar'
}

type NavigationItem = {
  href: string
  icon: LucideIcon
  key?:
    | 'nav.home'
    | 'nav.accounts'
    | 'nav.transactions'
    | 'nav.goals'
    | 'nav.wishlist'
    | 'nav.recurring'
    | 'nav.settings'
  label?: Record<MoneyFlowLocale, string>
}

export function DashboardNavigation({
  locale,
  variant = 'mobile',
}: DashboardNavigationProps) {
  const pathname = usePathname()
  const t = createTranslator(locale)
  const isSidebar = variant === 'sidebar'
  const [moreOpen, setMoreOpen] = useState(false)

  useEffect(() => {
    if (!moreOpen) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMoreOpen(false)
    }
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [moreOpen])

  if (isSidebar) {
    const allItems: NavigationItem[] = [...primaryItems, ...moreItems]
    return (
      <nav
        aria-label={t('nav.label')}
        className="glass-panel rounded-[var(--radius-lg)] p-2"
      >
        <div className="flex flex-col gap-1">
          {allItems.map(({ href, key, label, icon: Icon }) => {
            const active = isItemActive(pathname, href)
            const text = key ? t(key) : (label?.[locale] ?? '')
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={`flex min-h-11 items-center gap-3 rounded-[var(--radius-sm)] px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] ${active ? 'bg-[hsl(var(--surface-muted))] text-[hsl(var(--foreground))]' : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--surface-muted))] hover:text-[hsl(var(--foreground))]'}`}
              >
                <Icon aria-hidden="true" className="size-4 shrink-0" />
                <span className="truncate">{text}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    )
  }

  const moreActive = moreItems.some(({ href }) => isItemActive(pathname, href))
  const closeMore = () => setMoreOpen(false)

  return (
    <>
      {moreOpen ? (
        <>
          <button
            aria-label={locale === 'en' ? 'Close menu' : 'Fechar menu'}
            type="button"
            onClick={closeMore}
            className="fixed inset-0 z-40 bg-black/45 backdrop-blur-sm"
          />
          <section
            aria-label={t('nav.more')}
            className="glass-panel fixed inset-x-3 bottom-[5.75rem] z-50 mx-auto max-w-md overflow-hidden rounded-[var(--radius-lg)] p-2 shadow-2xl motion-safe:animate-in motion-safe:slide-in-from-bottom-3"
          >
            <div className="mx-auto mb-2 mt-1 h-1 w-10 rounded-full bg-[hsl(var(--border))]" />
            <div className="flex items-center justify-between px-3 pb-2 pt-1">
              <p className="text-sm font-semibold">{t('nav.more')}</p>
              <button
                type="button"
                onClick={closeMore}
                className="inline-flex size-10 items-center justify-center rounded-full hover:bg-[hsl(var(--surface-muted))]"
                aria-label={locale === 'en' ? 'Close' : 'Fechar'}
              >
                <ChevronUp className="size-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-1">
              {moreItems.map(({ href, key, label, icon: Icon }) => {
                const active = isItemActive(pathname, href)
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={closeMore}
                    className={`flex min-h-12 items-center gap-3 rounded-[var(--radius-sm)] px-3 text-sm font-medium transition-colors ${active ? 'bg-[hsl(var(--surface-muted))] text-[hsl(var(--foreground))]' : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--surface-muted))] hover:text-[hsl(var(--foreground))]'}`}
                  >
                    <Icon className="size-4" aria-hidden="true" />
                    {key ? t(key) : label?.[locale]}
                  </Link>
                )
              })}
            </div>
          </section>
        </>
      ) : null}

      <nav
        aria-label={t('nav.label')}
        className="glass-nav fixed inset-x-0 bottom-0 z-40 border-t shadow-[0_-12px_40px_hsl(0_0%_0%/0.24)]"
      >
        <div className="mx-auto grid max-w-3xl grid-cols-5 px-2 safe-bottom">
          {primaryItems.map(({ href, key, icon: Icon }) => {
            const active = isItemActive(pathname, href)
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-[var(--radius-sm)] px-1 text-[11px] font-medium transition-colors ${active ? 'text-[hsl(var(--foreground))]' : 'text-[hsl(var(--muted-foreground))]'}`}
              >
                <span
                  className={`flex size-9 items-center justify-center rounded-full ${active ? 'bg-[hsl(var(--surface-muted))]' : ''}`}
                >
                  <Icon className="size-[18px]" aria-hidden="true" />
                </span>
                <span>{t(key)}</span>
              </Link>
            )
          })}
          <button
            type="button"
            onClick={() => setMoreOpen((open) => !open)}
            aria-expanded={moreOpen}
            aria-haspopup="dialog"
            className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-[var(--radius-sm)] px-1 text-[11px] font-medium transition-colors ${moreOpen || moreActive ? 'text-[hsl(var(--foreground))]' : 'text-[hsl(var(--muted-foreground))]'}`}
          >
            <span
              className={`flex size-9 items-center justify-center rounded-full ${moreOpen || moreActive ? 'bg-[hsl(var(--surface-muted))]' : ''}`}
            >
              <MoreHorizontal className="size-[18px]" aria-hidden="true" />
            </span>
            <span>{t('nav.more')}</span>
          </button>
        </div>
      </nav>
    </>
  )
}
