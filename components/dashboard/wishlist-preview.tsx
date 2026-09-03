import Link from 'next/link'
import { ChevronRight, ExternalLink } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatDate } from '@/lib/format'
import { Button } from '@/components/ui/button'

const priorityLabels = { high: 'Alta', medium: 'Média', low: 'Baixa' } as const
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
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            O que queres comprar
          </p>
          <h2
            id="wishlist-preview-title"
            className="mt-1 text-lg font-semibold"
          >
            Próximas compras
          </h2>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/wishlist">
            Ver wishlist
            <ChevronRight className="size-4" />
          </Link>
        </Button>
      </div>

      {!relevant.length ? (
        <div className="mt-4 rounded-[var(--radius-lg)] border border-dashed bg-[hsl(var(--surface))] p-6 text-center">
          <p className="font-medium">Ainda não tens compras planeadas</p>
          <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
            Adiciona algo à wishlist para começares a priorizar decisões.
          </p>
          <Button asChild className="mt-4">
            <Link href="/dashboard/wishlist/new">Adicionar item</Link>
          </Button>
        </div>
      ) : (
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {relevant.map((item) => (
            <article
              key={item.id}
              className="rounded-[var(--radius-lg)] border bg-[hsl(var(--surface))] p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link
                    href={`/dashboard/wishlist/${item.id}/edit`}
                    className="truncate font-medium hover:underline"
                  >
                    {item.name}
                  </Link>
                  <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
                    Prioridade{' '}
                    {priorityLabels[
                      item.priority as keyof typeof priorityLabels
                    ] ?? item.priority}
                  </p>
                </div>
                <p className="shrink-0 font-semibold tabular-nums">
                  {formatCurrency(Number(item.price), currency)}
                </p>
              </div>
              {item.desired_date ? (
                <p className="mt-3 text-xs text-[hsl(var(--muted-foreground))]">
                  Até {formatDate(`${item.desired_date}T00:00:00`)}
                </p>
              ) : null}
              {item.url ? (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex min-h-9 items-center gap-1 text-xs font-medium hover:underline"
                >
                  <ExternalLink className="size-3.5" /> Abrir produto
                </a>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
