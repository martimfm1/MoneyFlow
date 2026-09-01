import Link from 'next/link'
import { ExternalLink, Heart, Plus, Target } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { createGoalFromWishlist, updateWishlistStatus } from './actions'

export const dynamic = 'force-dynamic'

const priorityLabels: Record<string, string> = {
  high: 'Alta',
  medium: 'Média',
  low: 'Baixa',
}
const statusLabels: Record<string, string> = {
  want: 'Quero',
  saving: 'A guardar',
  ready: 'Pronto',
  purchased: 'Comprado',
}

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat('pt-PT', { style: 'currency', currency }).format(
    amount,
  )
}

export default async function WishlistPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: items }] = await Promise.all([
    supabase
      .from('profiles')
      .select('currency_code')
      .eq('id', user.id)
      .maybeSingle(),
    supabase
      .from('wishlist_items')
      .select('id, name, price, priority, status, url, desired_date, notes')
      .eq('user_id', user.id)
      .order('status', { ascending: true })
      .order('priority', { ascending: true })
      .order('created_at', { ascending: false }),
  ])

  const currency = profile?.currency_code ?? 'EUR'

  return (
    <main className="moneyflow-shell py-6 sm:py-10">
      <header className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">Priorizar</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Wishlist</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-[hsl(var(--muted-foreground))]">
            Guarda aquilo que queres comprar e decide o que merece prioridade antes de gastar.
          </p>
        </div>
        <Button asChild size="sm">
          <Link href="/dashboard/wishlist/new">
            <Plus className="size-4" /> Novo
          </Link>
        </Button>
      </header>

      {params.error ? (
        <p className="mt-5 rounded-[var(--radius-md)] bg-[hsl(var(--danger)/0.08)] px-3 py-2 text-sm">
          {params.error}
        </p>
      ) : null}

      {!items?.length ? (
        <section className="mt-8 rounded-[var(--radius-lg)] border border-dashed bg-[hsl(var(--surface))] p-8 text-center">
          <Heart className="mx-auto size-6" />
          <h2 className="mt-4 font-medium">A tua wishlist está vazia</h2>
          <p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-[hsl(var(--muted-foreground))]">
            Adiciona algo que queres comprar e transforma a intenção numa decisão planeada.
          </p>
          <Button asChild className="mt-5">
            <Link href="/dashboard/wishlist/new">Adicionar item</Link>
          </Button>
        </section>
      ) : (
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {items.map((item) => (
            <article
              key={item.id}
              className="rounded-[var(--radius-lg)] border bg-[hsl(var(--surface))] p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="truncate font-medium">{item.name}</h2>
                  <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
                    Prioridade {priorityLabels[item.priority] ?? item.priority} ·{' '}
                    {statusLabels[item.status] ?? item.status}
                  </p>
                </div>
                <p className="shrink-0 text-lg font-semibold tabular-nums">
                  {formatMoney(Number(item.price), currency)}
                </p>
              </div>

              {item.notes ? (
                <p className="mt-4 line-clamp-2 text-sm leading-6 text-[hsl(var(--muted-foreground))]">
                  {item.notes}
                </p>
              ) : null}
              {item.desired_date ? (
                <p className="mt-3 text-xs text-[hsl(var(--muted-foreground))]">
                  Idealmente até{' '}
                  {new Intl.DateTimeFormat('pt-PT').format(
                    new Date(`${item.desired_date}T00:00:00`),
                  )}
                </p>
              ) : null}

              <div className="mt-5 flex flex-wrap items-center gap-2">
                <form action={updateWishlistStatus}>
                  <input type="hidden" name="id" value={item.id} />
                  <label className="sr-only" htmlFor={`status-${item.id}`}>
                    Estado de {item.name}
                  </label>
                  <select
                    id={`status-${item.id}`}
                    name="status"
                    defaultValue={item.status}
                    className="min-h-10 rounded-[var(--radius-md)] border bg-[hsl(var(--surface))] px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
                  >
                    <option value="want">Quero</option>
                    <option value="saving">A guardar</option>
                    <option value="ready">Pronto</option>
                    <option value="purchased">Comprado</option>
                  </select>
                  <Button type="submit" size="sm" variant="outline" className="ml-2">
                    Guardar estado
                  </Button>
                </form>

                <form action={createGoalFromWishlist}>
                  <input type="hidden" name="id" value={item.id} />
                  <Button type="submit" size="sm" variant="ghost">
                    <Target className="size-4" /> Criar objetivo
                  </Button>
                </form>

                {item.url ? (
                  <Button asChild size="sm" variant="ghost">
                    <a href={item.url} target="_blank" rel="noreferrer">
                      <ExternalLink className="size-4" /> Abrir
                    </a>
                  </Button>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  )
}
