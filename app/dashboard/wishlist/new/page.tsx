import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createWishlistItem } from '../actions'

export default async function NewWishlistItemPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams
  return (
    <main className="min-h-screen">
      <div className="moneyflow-shell py-6 sm:py-10">
        <Link href="/dashboard/wishlist" className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-[hsl(var(--muted-foreground))]"><ArrowLeft className="size-4" /> Voltar à wishlist</Link>
        <section className="mx-auto mt-8 max-w-3xl rounded-[var(--radius-lg)] border bg-[hsl(var(--surface))] p-6 shadow-sm sm:p-8">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Novo item</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[hsl(var(--muted-foreground))]">Regista uma compra que estás a considerar. Preço e prioridade são suficientes para começares; os restantes dados ajudam a decidir melhor.</p>
          {params.error ? <p role="alert" className="mt-4 rounded-[var(--radius-md)] bg-[hsl(var(--danger)/0.08)] px-3 py-2 text-sm">{params.error}</p> : null}
          <form action={createWishlistItem} className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <label className="grid gap-2 text-sm font-medium lg:col-span-2">Nome<input name="name" required maxLength={120} placeholder="Auscultadores, monitor, viagem..." className="min-h-11 rounded-[var(--radius-md)] border bg-transparent px-3 font-normal outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]" /></label>
            <label className="grid gap-2 text-sm font-medium">Preço<input name="price" type="number" inputMode="decimal" step="0.01" min="0" required placeholder="199,99" className="min-h-11 rounded-[var(--radius-md)] border bg-transparent px-3 text-lg font-normal outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]" /></label>
            <label className="grid gap-2 text-sm font-medium">Categoria<input name="category" maxLength={50} placeholder="Tecnologia" className="min-h-11 rounded-[var(--radius-md)] border bg-transparent px-3 font-normal outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]" /></label>
            <label className="grid gap-2 text-sm font-medium">Prioridade<select name="priority" defaultValue="medium" className="min-h-11 rounded-[var(--radius-md)] border bg-[hsl(var(--surface))] px-3 font-normal outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"><option value="high">Alta</option><option value="medium">Média</option><option value="low">Baixa</option></select></label>
            <label className="grid gap-2 text-sm font-medium">Data desejada<input name="desiredDate" type="date" className="min-h-11 rounded-[var(--radius-md)] border bg-transparent px-3 font-normal outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]" /></label>
            <label className="grid gap-2 text-sm font-medium lg:col-span-2">Link <span className="font-normal text-[hsl(var(--muted-foreground))]">(opcional)</span><input name="url" type="url" maxLength={2048} placeholder="https://..." className="min-h-11 rounded-[var(--radius-md)] border bg-transparent px-3 font-normal outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]" /></label>
            <label className="grid gap-2 text-sm font-medium">Imagem <span className="font-normal text-[hsl(var(--muted-foreground))]">(URL, opcional)</span><input name="imageUrl" type="url" maxLength={2048} placeholder="https://.../imagem.jpg" className="min-h-11 rounded-[var(--radius-md)] border bg-transparent px-3 font-normal outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]" /></label>
            <label className="grid gap-2 text-sm font-medium sm:col-span-2 lg:col-span-3">Notas <span className="font-normal text-[hsl(var(--muted-foreground))]">(opcional)</span><textarea name="notes" maxLength={1000} rows={4} placeholder="Porque queres isto? Há alternativas?" className="rounded-[var(--radius-md)] border bg-transparent px-3 py-2 font-normal outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]" /></label>
            <div className="flex items-end sm:col-span-2 lg:col-span-3"><Button type="submit" className="w-full sm:w-auto">Adicionar à wishlist</Button></div>
          </form>
        </section>
      </div>
    </main>
  )
}
