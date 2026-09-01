import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createWishlistItem } from '../actions'

export default async function NewWishlistItemPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams

  return (
    <main className="min-h-screen">
      <div className="moneyflow-shell py-6 sm:py-10">
        <Link href="/dashboard/wishlist" className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-[hsl(var(--muted-foreground))]">
          <ArrowLeft className="size-4" /> Voltar à wishlist
        </Link>
        <section className="mx-auto mt-8 max-w-lg rounded-[var(--radius-lg)] border bg-[hsl(var(--surface))] p-6 shadow-sm sm:p-8">
          <h1 className="text-2xl font-semibold tracking-tight">Novo item</h1>
          <p className="mt-2 text-sm leading-6 text-[hsl(var(--muted-foreground))]">Regista algo que queres comprar para poderes comparar prioridades antes de gastar.</p>
          {params.error ? <p className="mt-4 rounded-[var(--radius-md)] bg-[hsl(var(--danger)/0.08)] px-3 py-2 text-sm">{params.error}</p> : null}

          <form action={createWishlistItem} className="mt-6 space-y-4">
            <label className="block space-y-2 text-sm font-medium">
              <span>Nome</span>
              <input name="name" required maxLength={120} placeholder="Auscultadores, monitor, viagem..." className="min-h-11 w-full rounded-[var(--radius-md)] border bg-transparent px-3 outline-none" />
            </label>

            <label className="block space-y-2 text-sm font-medium">
              <span>Preço</span>
              <input name="price" type="number" inputMode="decimal" step="0.01" min="0" required placeholder="199,99" className="min-h-11 w-full rounded-[var(--radius-md)] border bg-transparent px-3 text-lg outline-none" />
            </label>

            <label className="block space-y-2 text-sm font-medium">
              <span>Prioridade</span>
              <select name="priority" defaultValue="medium" className="min-h-11 w-full rounded-[var(--radius-md)] border bg-[hsl(var(--surface))] px-3 outline-none">
                <option value="high">Alta</option>
                <option value="medium">Média</option>
                <option value="low">Baixa</option>
              </select>
            </label>

            <label className="block space-y-2 text-sm font-medium">
              <span>Link <span className="font-normal text-[hsl(var(--muted-foreground))]">(opcional)</span></span>
              <input name="url" type="url" placeholder="https://..." className="min-h-11 w-full rounded-[var(--radius-md)] border bg-transparent px-3 outline-none" />
            </label>

            <label className="block space-y-2 text-sm font-medium">
              <span>Data desejada <span className="font-normal text-[hsl(var(--muted-foreground))]">(opcional)</span></span>
              <input name="desiredDate" type="date" className="min-h-11 w-full rounded-[var(--radius-md)] border bg-transparent px-3 outline-none" />
            </label>

            <label className="block space-y-2 text-sm font-medium">
              <span>Notas <span className="font-normal text-[hsl(var(--muted-foreground))]">(opcional)</span></span>
              <textarea name="notes" maxLength={1000} rows={4} placeholder="Porque queres isto? Há alternativas?" className="w-full rounded-[var(--radius-md)] border bg-transparent px-3 py-2 outline-none" />
            </label>

            <Button type="submit" className="w-full">Adicionar à wishlist</Button>
          </form>
        </section>
      </div>
    </main>
  )
}
