'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CalendarClock, ChartNoAxesCombined, ChevronUp, CircleDollarSign, Heart, Home, List, MoreHorizontal, Settings, Target, Tags, WalletCards } from 'lucide-react'
import { useState } from 'react'
import { createTranslator, type MoneyFlowLocale } from '@/lib/i18n'

const primaryItems = [
  { href: '/dashboard', key: 'nav.home' as const, icon: Home },
  { href: '/dashboard/goals', key: 'nav.goals' as const, icon: Target },
  { href: '/dashboard/wishlist', key: 'nav.wishlist' as const, icon: Heart },
  { href: '/dashboard/transactions', key: 'nav.transactions' as const, icon: List },
]

const moreItems = [
  { href: '/dashboard/accounts', key: 'nav.accounts' as const, icon: WalletCards },
  { href: '/dashboard/budgets', label: { 'pt-PT': 'Orçamentos', en: 'Budgets' }, icon: CircleDollarSign },
  { href: '/dashboard/analytics', label: { 'pt-PT': 'Analytics', en: 'Analytics' }, icon: ChartNoAxesCombined },
  { href: '/dashboard/recurring', key: 'nav.recurring' as const, icon: CalendarClock },
  { href: '/dashboard/categories', label: { 'pt-PT': 'Categorias', en: 'Categories' }, icon: Tags },
  { href: '/dashboard/settings', key: 'nav.settings' as const, icon: Settings },
]

function isItemActive(pathname: string, href: string) {
  return href === '/dashboard' ? pathname === href : pathname.startsWith(href)
}

type DashboardNavigationProps = {
  locale: MoneyFlowLocale
  variant?: 'mobile' | 'sidebar'
}

export function DashboardNavigation({ locale, variant = 'mobile' }: DashboardNavigationProps) {
  const pathname = usePathname()
  const t = createTranslator(locale)
  const isSidebar = variant === 'sidebar'
  const [moreOpen, setMoreOpen] = useState(false)
  const moreActive = moreItems.some(({ href }) => isItemActive(pathname, href))

  if (isSidebar) {
    const allItems = [...primaryItems, ...moreItems]
    return (
      <nav aria-label={t('nav.label')} className="rounded-[var(--radius-lg)] border bg-[hsl(var(--surface))] p-2 shadow-sm">
        <div className="flex flex-col gap-1">
          {allItems.map(({ href, key, label, icon: Icon }) => {
            const active = isItemActive(pathname, href)
            const text = key ? t(key) : label?.[locale] ?? ''
            return (
              <Link key={href} href={href} aria-current={active ? 'page' : undefined} className={`flex min-h-11 items-center gap-3 rounded-[var(--radius-md)] px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] ${active ? 'bg-[hsl(var(--surface-muted))]' : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--surface-muted))] hover:text-[hsl(var(--foreground))]'}`}>
                <Icon aria-hidden="true" className="size-4 shrink-0" />
                <span className="truncate">{text}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    )
  }

  return (
    <>
      {moreOpen ? (
        <div className="fixed inset-x-3 bottom-[5.75rem] z-50 mx-auto max-w-md rounded-[var(--radius-lg)] border bg-[hsl(var(--surface))] p-2 shadow-lg">
          <div className="flex items-center justify-between px-3 py-2">
            <p className="text-sm font-medium">{t('nav.more')}</p>
            <button type="button" className="inline-flex size-9 items-center justify-center rounded-[var(--radius-md)] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--surface-muted))]" onClick={() => setMoreOpen(false)} aria-label="Fechar menu">
              <ChevronUp className="size-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-1">
            {moreItems.map(({ href, key, label, icon: Icon }) => (
              <Link key={href} href={href} onClick={() => setMoreOpen(false)} className={`flex min-h-11 items-center gap-2 rounded-[var(--radius-md)] px-3 text-sm font-medium ${isItemActive(pathname, href) ? 'bg-[hsl(var(--surface-muted))]' : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--surface-muted))]'}`}>
                <Icon className="size-4" aria-hidden="true" />
                {key ? t(key) : label?.[locale]}
              </Link>
            ))}
          </div>
        </div>
      ) : null}
      <nav aria-label={t('nav.label')} className="fixed inset-x-0 bottom-0 z-40 border-t bg-[hsl(var(--surface)/0.94)] backdrop-blur-xl">
        <div className="mx-auto grid max-w-3xl grid-cols-5 px-2 safe-bottom">
          {primaryItems.map(({ href, key, icon: Icon }) => {
            const active = isItemActive(pathname, href)
            return <Link key={href} href={href} aria-current={active ? 'page' : undefined} className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-[var(--radius-md)] px-2 text-[11px] font-medium ${active ? 'bg-[hsl(var(--surface-muted))] text-[hsl(var(--foreground))]' : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--surface-muted))]'}`}><Icon className="size-4" aria-hidden="true" /><span>{t(key)}</span></Link>
          })}
          <button type="button" onClick={() => setMoreOpen((open) => !open)} aria-expanded={moreOpen} className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-[var(--radius-md)] px-2 text-[11px] font-medium ${moreOpen || moreActive ? 'bg-[hsl(var(--surface-muted))] text-[hsl(var(--foreground))]' : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--surface-muted))]'}`}>
            <MoreHorizontal className="size-4" aria-hidden="true" />
            <span>{t('nav.more')}</span>
          </button>
        </div>
      </nav>
    </>
  )
}
