import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { notFound, redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'
import { updateWishlistItem } from '../../actions'

export const dynamic = 'force-dynamic'

export default async function EditWishlistItemPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const { id } = await params
  const query = await searchParams
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: item } = await supabase
    .from('wishlist_items')
    .select(
      'id, name, price, category, priority, url, image_url, desired_date, notes',
    )
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle()
  if (!item) notFound()

  return (
    <main className="moneyflow-shell py-6 sm:py-10">
      <Link
        href="/dashboard/wishlist"
        className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-[hsl(var(--muted-foreground))]"
      >
        <ArrowLeft className="size-4" /> Voltar à wishlist
      </Link>
      <section className="mx-auto mt-8 max-w-3xl rounded-[var(--radius-lg)] border bg-[hsl(var(--surface))] p-5 shadow-sm sm:p-7">
        <header>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            Wishlist
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
            Editar item
          </h1>
          <p className="mt-2 text-sm leading-6 text-[hsl(var(--muted-foreground))]">
            Mantém preço, prioridade e data alinhados com a compra que tens
            realmente em mente.
          </p>
        </header>
        {query.error ? (
          <p
            role="alert"
            className="mt-5 rounded-[var(--radius-md)] bg-[hsl(var(--danger)/0.08)] px-3 py-2 text-sm"
          >
            {query.error}
          </p>
        ) : null}
        <form
          action={updateWishlistItem}
          className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          <input type="hidden" name="id" value={item.id} />
          <label className="grid gap-2 text-sm font-medium lg:col-span-2">
            Nome
            <input
              name="name"
              required
              maxLength={120}
              defaultValue={item.name}
              className="min-h-11 rounded-[var(--radius-md)] border bg-transparent px-3 font-normal outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
            />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Preço
            <input
              name="price"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              required
              defaultValue={item.price}
              className="min-h-11 rounded-[var(--radius-md)] border bg-transparent px-3 font-normal outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
            />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Categoria
            <input
              name="category"
              maxLength={50}
              defaultValue={item.category ?? ''}
              placeholder="Ex.: Tecnologia"
              className="min-h-11 rounded-[var(--radius-md)] border bg-transparent px-3 font-normal outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
            />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Prioridade
            <select
              name="priority"
              defaultValue={item.priority}
              className="min-h-11 rounded-[var(--radius-md)] border bg-[hsl(var(--surface))] px-3 font-normal outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
            >
              <option value="high">Alta</option>
              <option value="medium">Média</option>
              <option value="low">Baixa</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Data desejada
            <input
              name="desiredDate"
              type="date"
              defaultValue={item.desired_date ?? ''}
              className="min-h-11 rounded-[var(--radius-md)] border bg-transparent px-3 font-normal outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
            />
          </label>
          <label className="grid gap-2 text-sm font-medium lg:col-span-2">
            Link
            <input
              name="url"
              type="url"
              maxLength={2048}
              defaultValue={item.url ?? ''}
              placeholder="https://..."
              className="min-h-11 rounded-[var(--radius-md)] border bg-transparent px-3 font-normal outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
            />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Imagem (URL)
            <input
              name="imageUrl"
              type="url"
              maxLength={2048}
              defaultValue={item.image_url ?? ''}
              placeholder="https://.../imagem.jpg"
              className="min-h-11 rounded-[var(--radius-md)] border bg-transparent px-3 font-normal outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
            />
          </label>
          <label className="grid gap-2 text-sm font-medium sm:col-span-2 lg:col-span-3">
            Notas
            <textarea
              name="notes"
              maxLength={1000}
              rows={4}
              defaultValue={item.notes ?? ''}
              className="rounded-[var(--radius-md)] border bg-transparent px-3 py-2 font-normal outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
            />
          </label>
          <div className="flex flex-col-reverse gap-2 sm:col-span-2 sm:flex-row lg:col-span-3 sm:justify-end">
            <Button asChild type="button" variant="ghost">
              <Link href="/dashboard/wishlist">Cancelar</Link>
            </Button>
            <Button type="submit">Guardar alterações</Button>
          </div>
        </form>
      </section>
    </main>
  )
}
