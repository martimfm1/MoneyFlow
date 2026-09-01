import Link from 'next/link'
import { ArrowLeft, Tags } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { createCategory } from './actions'
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
        <p className="text-sm text-[hsl(var(--muted-foreground))]">
          Organização
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          Categorias
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-[hsl(var(--muted-foreground))]">
          Mantém as categorias simples para conseguires perceber rapidamente
          para onde vai o teu dinheiro.
        </p>
      </header>

      {params.error ? (
        <p className="mt-5 rounded-[var(--radius-md)] bg-[hsl(var(--danger)/0.08)] px-3 py-2 text-sm">
          {params.error}
        </p>
      ) : null}

      <section className="mt-6 rounded-[var(--radius-lg)] border bg-[hsl(var(--surface))] p-5 shadow-sm sm:p-6">
        <h2 className="font-medium">Nova categoria</h2>
        <form
          action={createCategory}
          className="mt-4 flex flex-col gap-3 sm:flex-row"
        >
          <label className="sr-only" htmlFor="category-name">
            Nome da categoria
          </label>
          <input
            id="category-name"
            name="name"
            required
            maxLength={50}
            placeholder="Ex.: Alimentação"
            className="min-h-11 flex-1 rounded-[var(--radius-md)] border bg-transparent px-3 outline-none"
          />
          <Button type="submit">Adicionar</Button>
        </form>
      </section>

      <section className="mt-6 rounded-[var(--radius-lg)] border bg-[hsl(var(--surface))] shadow-sm">
        {!categories?.length ? (
          <div className="p-8 text-center">
            <Tags className="mx-auto size-6" />
            <p className="mt-4 font-medium">Ainda não tens categorias</p>
            <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
              A tua próxima despesa pode criar a primeira.
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {categories.map((category) => (
              <div
                key={category.id}
                className="flex items-center justify-between gap-4 p-4"
              >
                <div className="flex items-center gap-3">
                  <span className="inline-flex size-9 items-center justify-center rounded-full bg-[hsl(var(--surface-muted))] text-xs font-semibold">
                    {category.sort_order + 1}
                  </span>
                  <p className="font-medium">{category.name}</p>
                </div>
                <span className="text-xs text-[hsl(var(--muted-foreground))]">
                  Personalizada
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
