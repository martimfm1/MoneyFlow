import Link from 'next/link'
import { ArrowLeft, Tags } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { createCategory } from './actions'
import { CategoryActions } from './category-actions'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function CategoriesPage({
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

  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, sort_order')
    .eq('user_id', user.id)
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true })

  return (
    <main className="moneyflow-shell py-6 sm:py-10">
      <Link
        href="/dashboard/transactions"
        className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-[hsl(var(--muted-foreground))]"
      >
        <ArrowLeft className="size-4" /> Voltar aos movimentos
      </Link>
      <header className="mt-6">
        <p className="text-sm text-[hsl(var(--muted-foreground))]">Organização</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl lg:text-4xl">Categorias</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[hsl(var(--muted-foreground))]">
          Cria, renomeia, apaga e ordena as categorias usadas nos teus movimentos.
        </p>
      </header>

      {params.error ? (
        <p role="alert" className="mt-5 rounded-[var(--radius-md)] bg-[hsl(var(--danger)/0.08)] px-3 py-2 text-sm">
          {params.error}
        </p>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(20rem,0.8fr)_minmax(0,1.4fr)] lg:items-start">
        <section className="rounded-[var(--radius-lg)] border bg-[hsl(var(--surface))] p-5 shadow-sm sm:p-6 lg:sticky lg:top-8">
          <h2 className="font-medium">Nova categoria</h2>
          <p className="mt-1 text-sm leading-6 text-[hsl(var(--muted-foreground))]">
            Mantém nomes claros e consistentes para melhorar os filtros e os analytics.
          </p>
          <form action={createCategory} className="mt-5 space-y-3">
            <label className="grid gap-2 text-sm font-medium" htmlFor="category-name">
              Nome
              <input id="category-name" name="name" required maxLength={50} placeholder="Ex.: Software" className="min-h-11 rounded-[var(--radius-md)] border bg-transparent px-3 font-normal outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]" />
            </label>
            <Button type="submit" className="w-full">Adicionar categoria</Button>
          </form>
        </section>

        <section className="rounded-[var(--radius-lg)] border bg-[hsl(var(--surface))] shadow-sm">
          <div className="flex items-center justify-between gap-3 border-b px-5 py-4 sm:px-6">
            <div>
              <h2 className="font-medium">As tuas categorias</h2>
              <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">{categories?.length ?? 0} categorias</p>
            </div>
            <Tags className="size-5 text-[hsl(var(--muted-foreground))]" />
          </div>
          {!categories?.length ? (
            <div className="p-8 text-center">
              <Tags className="mx-auto size-6" />
              <p className="mt-4 font-medium">Ainda não tens categorias</p>
              <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">A tua próxima despesa pode criar a primeira.</p>
            </div>
          ) : (
            <div className="grid gap-3 p-4 sm:p-5">
              {categories.map((category, index) => (
                <div key={category.id} className="flex flex-col gap-3 rounded-[var(--radius-md)] border bg-[hsl(var(--surface-muted)/0.35)] p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--surface-muted))] text-xs font-semibold">{index + 1}</span>
                    <p className="truncate font-medium">{category.name}</p>
                  </div>
                  <CategoryActions id={category.id} name={category.name} canMoveUp={index > 0} canMoveDown={index < categories.length - 1} />
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
