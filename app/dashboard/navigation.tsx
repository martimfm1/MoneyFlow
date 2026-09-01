import Link from 'next/link'
import { Home, List, Target, WalletCards } from 'lucide-react'

const items = [
  { href: '/dashboard', label: 'Início', icon: Home },
  { href: '/dashboard/accounts', label: 'Contas', icon: WalletCards },
  { href: '/dashboard/transactions', label: 'Movimentos', icon: List },
  { href: '/dashboard/goals', label: 'Objetivos', icon: Target },
]

export function DashboardNavigation() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-[hsl(var(--surface)/0.94)] backdrop-blur-xl md:sticky md:top-4 md:bottom-auto md:rounded-[var(--radius-lg)] md:border md:border-[hsl(var(--border)/0.9)] md:bg-[hsl(var(--surface))] md:backdrop-blur-none">
      <div className="mx-auto grid max-w-3xl grid-cols-4 px-2 safe-bottom md:flex md:max-w-none md:items-center md:justify-center md:gap-1 md:p-1 md:safe-bottom-0">
        {items.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-[var(--radius-md)] px-2 text-[11px] font-medium text-[hsl(var(--muted-foreground))] transition-colors hover:bg-[hsl(var(--surface-muted))] hover:text-[hsl(var(--foreground))] md:min-h-10 md:flex-row md:gap-2 md:px-3 md:text-xs"
          >
            <Icon aria-hidden="true" className="size-4" />
            {label}
          </Link>
        ))}
      </div>
    </nav>
  )
}
