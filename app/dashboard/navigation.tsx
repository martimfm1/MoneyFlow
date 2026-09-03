'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CalendarClock, Heart, Home, List, Target, WalletCards } from 'lucide-react'
import { createTranslator, type MoneyFlowLocale } from '@/lib/i18n'

const items = [
  { href: '/dashboard', key: 'nav.home' as const, icon: Home },
  { href: '/dashboard/accounts', key: 'nav.accounts' as const, icon: WalletCards },
  { href: '/dashboard/transactions', key: 'nav.transactions' as const, icon: List },
  { href: '/dashboard/goals', key: 'nav.goals' as const, icon: Target },
  { href: '/dashboard/wishlist', key: 'nav.wishlist' as const, icon: Heart },
  { href: '/dashboard/recurring', key: 'nav.recurring' as const, icon: CalendarClock },
]

function isItemActive(pathname: string, href: string) {
  return href === '/dashboard' ? pathname === href : pathname.startsWith(href)
}

type DashboardNavigationProps = {
  locale: MoneyFlowLocale
  variant?: 'mobile' | 'sidebar'
}

export function DashboardNavigation({
  locale,
  variant = 'mobile',
}: DashboardNavigationProps) {
  const pathname = usePathname()
  const t = createTranslator(locale)
  const isSidebar = variant === 'sidebar'

  return (
    <nav
      aria-label={t('nav.label')}
      className={
        isSidebar
          ? 'rounded-[var(--radius-lg)] border bg-[hsl(var(--surface))] p-2 shadow-sm'
          : 'fixed inset-x-0 bottom-0 z-40 border-t bg-[hsl(var(--surface)/0.94)] backdrop-blur-xl'
      }
    >
      <div
        className={
          isSidebar
            ? 'flex flex-col gap-1'
            : 'mx-auto grid max-w-5xl grid-cols-6 px-2 safe-bottom'
        }
      >
        {items.map(({ href, key, icon: Icon }) => {
          const active = isItemActive(pathname, href)
          const label = t(key)

          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={`flex font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(var(--background))] ${
                isSidebar
                  ? 'min-h-11 items-center gap-3 rounded-[var(--radius-md)] px-3 text-sm'
                  : 'min-h-14 flex-col items-center justify-center gap-1 rounded-[var(--radius-md)] px-1 text-[10px] sm:text-[11px]'
              } ${
                active
                  ? 'bg-[hsl(var(--surface-muted))] text-[hsl(var(--foreground))]'
                  : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--surface-muted))] hover:text-[hsl(var(--foreground))]'
              }`}
            >
              <Icon aria-hidden="true" className="size-4 shrink-0" />
              <span className={isSidebar ? 'truncate' : undefined}>{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
