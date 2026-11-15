'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  CalendarClock,
  ChartNoAxesCombined,
  CircleDollarSign,
  Heart,
  Home,
  List,
  MoreHorizontal,
  Settings,
  Tags,
  Target,
  WalletCards,
  X,
} from 'lucide-react'
import { useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { createTranslator, type MoneyFlowLocale } from '@/lib/i18n'

type Item = {
  href: string
  icon: LucideIcon
  label: Record<MoneyFlowLocale, string>
  key?: 'nav.home' | 'nav.accounts' | 'nav.transactions' | 'nav.goals' | 'nav.wishlist' | 'nav.recurring' | 'nav.settings'
}

const homeItem: Item = {
  href: '/dashboard',
  icon: Home,
  key: 'nav.home',
  label: { 'pt-PT': 'Início', en: 'Home' },
}

const transactionsItem: Item = {
  href: '/dashboard/transactions',
  icon: List,
  key: 'nav.transactions',
  label: { 'pt-PT': 'Movimentos', en: 'Activity' },
}

const goalsItem: Item = {
  href: '/dashboard/goals',
  icon: Target,
  key: 'nav.goals',
  label: { 'pt-PT': 'Objetivos', en: 'Goals' },
}

const wishlistItem: Item = {
  href: '/dashboard/wishlist',
  icon: Heart,
  key: 'nav.wishlist',
  label: { 'pt-PT': 'Wishlist', en: 'Wishlist' },
}

const sidebarGroups: Array<{ label: Record<MoneyFlowLocale, string>; items: Item[] }> = [
  {
    label: { 'pt-PT': 'Visão geral', en: 'Overview' },
    items: [
      homeItem,
      transactionsItem,
      {
        href: '/dashboard/accounts',
        icon: WalletCards,
        key: 'nav.accounts',
        label: { 'pt-PT': 'Contas', en: 'Accounts' },
      },
    ],
  },
  {
    label: { 'pt-PT': 'Planeamento', en: 'Planning' },
    items: [
      goalsItem,
      {
        href: '/dashboard/budgets',
        icon: CircleDollarSign,
        label: { 'pt-PT': 'Orçamentos', en: 'Budgets' },
      },
      {
        href: '/dashboard/recurring',
        icon: CalendarClock,
        key: 'nav.recurring',
        label: { 'pt-PT': 'Recorrentes', en: 'Recurring' },
      },
      wishlistItem,
    ],
  },
  {
    label: { 'pt-PT': 'Análise e gestão', en: 'Insights & settings' },
    items: [
      {
        href: '/dashboard/analytics',
        icon: ChartNoAxesCombined,
        label: { 'pt-PT': 'Análise', en: 'Insights' },
      },
      {
        href: '/dashboard/categories',
        icon: Tags,
        label: { 'pt-PT': 'Categorias', en: 'Categories' },
      },
      {
        href: '/dashboard/settings',
        icon: Settings,
        key: 'nav.settings',
        label: { 'pt-PT': 'Definições', en: 'Settings' },
      },
    ],
  },
]

const mobileItems = [homeItem, transactionsItem, goalsItem, wishlistItem]
const moreItems = sidebarGroups.flatMap((group) => group.items).filter(
  (item) => !mobileItems.some((mobileItem) => mobileItem.href === item.href),
)

function isItemActive(pathname: string, href: string) {
  return href === '/dashboard' ? pathname === href : pathname.startsWith(href)
}

type Props = {
  locale: MoneyFlowLocale
  variant?: 'mobile' | 'sidebar'
}

function ItemLink({
  item,
  pathname,
  locale,
  onClick,
  compact = false,
}: {
  item: Item
  pathname: string
  locale: MoneyFlowLocale
  onClick?: () => void
  compact?: boolean
}) {
  const Icon = item.icon
  const active = isItemActive(pathname, item.href)
  const translator = createTranslator(locale)
  const label = item.key ? translator(item.key) : item.label[locale]

  return (
    <Link
      href={item.href}
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={`group flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${active ? 'bg-primary/10 text-primary shadow-[inset_2px_0_0_hsl(var(--primary))]' : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground'} ${compact ? 'justify-center px-1' : ''}`}
    >
      <span className={`flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors ${active ? 'bg-primary/12' : 'bg-transparent group-hover:bg-background/70'}`}>
        <Icon className="size-[17px]" aria-hidden="true" />
      </span>
      {!compact ? <span className="min-w-0 flex-1 truncate">{label}</span> : <span className="sr-only">{label}</span>}
      {!compact && active ? <span className="size-1.5 rounded-full bg-primary" aria-hidden="true" /> : null}
    </Link>
  )
}

export function DashboardNavigation({ locale, variant = 'mobile' }: Props) {
  const pathname = usePathname()
  const translator = createTranslator(locale)
  const [moreOpen, setMoreOpen] = useState(false)

  if (variant === 'sidebar') {
    return (
      <nav aria-label={translator('nav.label')} className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-2 py-5">
        {sidebarGroups.map((group) => (
          <div key={group.label.en}>
            <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground/65">
              {group.label[locale]}
            </p>
            <div className="grid gap-1">
              {group.items.map((item) => (
                <ItemLink key={item.href} item={item} pathname={pathname} locale={locale} />
              ))}
            </div>
          </div>
        ))}
      </nav>
    )
  }

  const moreActive = moreItems.some((item) => isItemActive(pathname, item.href))
  return (
    <Dialog open={moreOpen} onOpenChange={setMoreOpen}>
      <DialogContent
        showCloseButton={false}
        className="top-auto bottom-[calc(5.75rem+env(safe-area-inset-bottom))] left-1/2 w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2 translate-y-0 gap-2 rounded-2xl border-border/80 bg-popover p-3 shadow-2xl motion-safe:animate-in motion-safe:slide-in-from-bottom-3"
      >
        <DialogHeader className="flex-row items-center justify-between gap-3 px-2 pb-1 pt-0.5">
          <div>
            <DialogTitle className="text-sm font-semibold">{translator('nav.more')}</DialogTitle>
            <DialogDescription className="sr-only">
              {locale === 'en' ? 'Additional areas of your MoneyFlow account.' : 'Outras áreas da tua conta MoneyFlow.'}
            </DialogDescription>
          </div>
          <DialogClose
            render={
              <button
                type="button"
                aria-label={locale === 'en' ? 'Close menu' : 'Fechar menu'}
                className="inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              />
            }
          >
            <X className="size-4" aria-hidden="true" />
          </DialogClose>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-1">
          {moreItems.map((item) => (
            <ItemLink
              key={item.href}
              item={item}
              pathname={pathname}
              locale={locale}
              compact={false}
              onClick={() => setMoreOpen(false)}
            />
          ))}
        </div>
      </DialogContent>

      <nav
        aria-label={translator('nav.label')}
        className="glass-nav fixed inset-x-0 bottom-0 z-40 border-t px-1"
      >
        <div className="mx-auto grid max-w-xl grid-cols-5 gap-1 px-2 pt-1.5 safe-bottom">
          {mobileItems.map((item) => {
            const active = isItemActive(pathname, item.href)
            const Icon = item.icon
            const label = item.key ? translator(item.key) : item.label[locale]
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`flex min-h-[3.6rem] flex-col items-center justify-center gap-1 rounded-xl px-1 text-[10px] font-semibold transition-colors ${active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <span className={`flex size-8 items-center justify-center rounded-xl ${active ? 'bg-primary/12' : ''}`}>
                  <Icon className="size-[18px]" aria-hidden="true" />
                </span>
                <span className="max-w-full truncate">{label}</span>
              </Link>
            )
          })}
          <DialogTrigger
            render={
              <button
                type="button"
                aria-label={translator('nav.more')}
                aria-expanded={moreOpen}
                aria-haspopup="dialog"
                className={`flex min-h-[3.6rem] flex-col items-center justify-center gap-1 rounded-xl px-1 text-[10px] font-semibold transition-colors ${moreOpen || moreActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
              />
            }
          >
            <span className={`flex size-8 items-center justify-center rounded-xl ${moreOpen || moreActive ? 'bg-primary/12' : ''}`}>
              <MoreHorizontal className="size-[18px]" aria-hidden="true" />
            </span>
            <span>{translator('nav.more')}</span>
          </DialogTrigger>
        </div>
      </nav>
    </Dialog>
  )
}
