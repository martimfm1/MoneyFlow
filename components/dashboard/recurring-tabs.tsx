import Link from 'next/link'
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react'

type RecurringTabsProps = {
  active: 'income' | 'expense'
}

const tabs = [
  {
    id: 'income',
    href: '/dashboard/recurring/income',
    label: 'Entradas recorrentes',
    icon: ArrowDownLeft,
  },
  {
    id: 'expense',
    href: '/dashboard/recurring',
    label: 'Saídas recorrentes',
    icon: ArrowUpRight,
  },
] as const

export function RecurringTabs({ active }: RecurringTabsProps) {
  return (
    <nav
      aria-label="Tipo de movimento recorrente"
      className="mt-5 grid grid-cols-2 gap-1 rounded-2xl border bg-[hsl(var(--surface-muted)/0.6)] p-1"
    >
      {tabs.map(({ id, href, label, icon: Icon }) => {
        const selected = active === id
        return (
          <Link
            key={id}
            href={href}
            aria-current={selected ? 'page' : undefined}
            className={`flex min-h-11 items-center justify-center gap-2 rounded-xl px-2 text-center text-xs font-medium transition-colors sm:text-sm ${
              selected
                ? 'bg-[hsl(var(--surface))] text-[hsl(var(--foreground))] shadow-sm ring-1 ring-border'
                : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
            }`}
          >
            <Icon className="size-4 shrink-0" aria-hidden="true" />
            <span>{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
