import Link from 'next/link'
import { ChevronRight, ExternalLink } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatDate } from '@/lib/format'
import { Button } from '@/components/ui/button'

const priorityRank = { high: 0, medium: 1, low: 2 } as const

export async function WishlistPreview({ currency }: { currency: string }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: items } = await supabase
    .from('wishlist_items')
    .select('id, name, price, priority, status, url, desired_date')
    .eq('user_id', user.id)
    .neq('status', 'purchased')
    .limit(12)

  const relevant = (items ?? [])
    .sort((a, b) => {
      const priorityDiff =
        priorityRank[a.priority as keyof typeof priorityRank] -
        priorityRank[b.priority as keyof typeof priorityRank]
      if (priorityDiff !== 0) return priorityDiff
      if (a.desired_date && b.desired_date)
        return a.desired_date.localeCompare(b.desired_date)
      if (a.desired_date) return -1
      if (b.desired_date) return 1
      return Number(a.price) - Number(b.price)
    })
    .slice(0, 3)

  return (
    <section className="mt-8 lg:mt-10" aria-labelledby="wishlist-preview-title">
      <div className="flex items-center justify-between gap-3">
        <h2 id="wishlist-preview-title" className="text-base font-semibold">
          Wishlist
        </h2>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/wishlist">
            Ver tudo <ChevronRight className="size-4" aria-hidden="true" />
          </Link>
        </Button>
      </div>

      {!relevant.length ? (
        <Link
          href="/dashboard/wishlist/new"
          className="mt-3 flex min-h-20 items-center justify-between rounded-[var(--radius-lg)] border border-dashed bg-[hsl(var(--surface))] px-4"
        >
          <span className="font-medium">Adicionar à wishlist</span>
          <ChevronRight className="size-4" aria-hidden="true" />
        </Link>
      ) : (
        <div className="mt-3 -mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-1 md:grid md:grid-cols-3 md:overflow-visible">
          {relevant.map((item) => (
            <article
              key={item.id}
              className="min-w-[15.5rem] snap-start overflow-hidden rounded-[var(--radius-lg)] border bg-[hsl(var(--surface))] shadow-sm transition-colors md:min-w-0"
            >
              <Link
                href={`/dashboard/wishlist/${item.id}/edit`}
                className="block p-4 active:bg-[hsl(var(--surface-muted))]"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="min-w-0 truncate font-medium">{item.name}</p>
                  <p className="shrink-0 font-semibold tabular-nums">
                    {formatCurrency(Number(item.price), currency)}
                  </p>
                </div>
                <div className="mt-3 flex items-center justify-between gap-3 text-xs text-[hsl(var(--muted-foreground))]">
                  <span>
                    {item.desired_date
                      ? `Até ${formatDate(`${item.desired_date}T00:00:00`)}`
                      : item.status === 'saving'
                        ? 'A poupar'
                        : 'Em espera'}
                  </span>
                </div>
              </Link>
              {item.url ? (
                <div className="border-t px-4 py-2">
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`Abrir ${item.name}`}
                    className="inline-flex min-h-8 items-center gap-1.5 text-xs font-medium text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                  >
                    <ExternalLink className="size-3.5" aria-hidden="true" />
                    Abrir link
                  </a>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
