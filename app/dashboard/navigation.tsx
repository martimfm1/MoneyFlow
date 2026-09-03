'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Heart, Home, List, Target, WalletCards } from 'lucide-react'

const items = [
  { href: '/dashboard', label: 'Início', icon: Home },
  { href: '/dashboard/accounts', label: 'Contas', icon: WalletCards },
  { href: '/dashboard/transactions', label: 'Movimentos', icon: List },
  { href: '/dashboard/goals', label: 'Objetivos', icon: Target },
  { href: '/dashboard/wishlist', label: 'Wishlist', icon: Heart },
]

function isItemActive(pathname: string, href: string) {
  return href === '/dashboard' ? pathname === href : pathname.startsWith(href)
}

export function DashboardNavigation() {
  const pathname = usePathname()

  return (
    <nav aria-label="Navegação principal" className="fixed inset-x-0 bottom-0 z-40 border-t bg-[hsl(var(--surface)/0.94)] backdrop-blur-xl md:sticky md:top-4 md:bottom-auto md:rounded-[var(--radius-lg)] md:border md:border-[hsl(var(--border)/0.9)] md:bg-[hsl(var(--surface))] md:backdrop-blur-none">
      <div className="mx-auto grid max-w-3xl grid-cols-5 px-2 safe-bottom md:flex md:max-w-none md:items-center md:justify-center md:gap-1 md:p-1 md:safe-bottom-0">
        {items.map(({ href, label, icon: Icon }) => {
          const active = isItemActive(pathname, href)

          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-[var(--radius-md)] px-2 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(var(--background))] md:min-h-10 md:flex-row md:gap-2 md:px-3 md:text-xs ${
                active
                  ? 'bg-[hsl(var(--surface-muted))] text-[hsl(var(--foreground))]'
                  : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--surface-muted))] hover:text-[hsl(var(--foreground))]'
              }`}
            >
              <Icon aria-hidden="true" className="size-4" />
              {label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
