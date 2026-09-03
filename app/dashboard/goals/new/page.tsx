import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createGoal } from './actions'

export default async function NewGoalPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const params = await searchParams

  return (
    <main className="min-h-screen">
      <div className="moneyflow-shell py-5 sm:py-10">
        <Link
          href="/dashboard/goals"
          className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-[hsl(var(--muted-foreground))]"
        >
          <ArrowLeft className="size-4" aria-hidden="true" /> Voltar
        </Link>
        <section className="mx-auto mt-5 max-w-lg rounded-[1.35rem] border bg-[hsl(var(--surface))] p-5 shadow-sm sm:mt-8 sm:p-8">
          <h1 className="text-2xl font-semibold tracking-tight">
            Novo objetivo
          </h1>
          {params.error ? (
            <p
              role="alert"
              className="mt-4 rounded-xl bg-[hsl(var(--danger)/0.08)] px-3 py-2 text-sm"
            >
              {params.error}
            </p>
          ) : null}

          <form action={createGoal} className="mt-6 space-y-4">
            <label className="block space-y-2 text-sm font-medium">
              <span>Nome</span>
              <input
                name="name"
                required
                maxLength={120}
                autoFocus
                placeholder="Ex.: viagem"
                className="min-h-12 w-full rounded-xl border bg-transparent px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
              />
            </label>

            <label className="block space-y-2 text-sm font-medium">
              <span>Quanto precisas?</span>
              <input
                name="targetAmount"
                type="text"
                inputMode="decimal"
                autoComplete="off"
                required
                placeholder="1000,00"
                className="min-h-14 w-full rounded-xl border bg-transparent px-3 text-2xl font-semibold tracking-tight tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
              />
            </label>

            <details className="rounded-xl border px-4">
              <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between text-sm font-medium">
                <span>Mais opções</span>
                <span className="text-xs text-[hsl(var(--muted-foreground))]">
                  Prioridade · data
                </span>
              </summary>
              <div className="space-y-4 pb-4">
                <fieldset className="space-y-2">
                  <legend className="text-sm font-medium">Prioridade</legend>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      ['high', 'Alta'],
                      ['medium', 'Média'],
                      ['low', 'Baixa'],
                    ].map(([value, label]) => (
                      <label key={value} className="cursor-pointer">
                        <input
                          type="radio"
                          name="priority"
                          value={value}
                          defaultChecked={value === 'medium'}
                          className="peer sr-only"
                        />
                        <span className="flex min-h-11 items-center justify-center rounded-xl border px-2 text-xs font-medium peer-checked:border-[hsl(var(--foreground))] peer-checked:bg-[hsl(var(--surface-muted))]">
                          {label}
                        </span>
                      </label>
                    ))}
                  </div>
                </fieldset>
                <label className="block space-y-2 text-sm font-medium">
                  <span>Data alvo</span>
                  <input
                    name="targetDate"
                    type="date"
                    className="min-h-11 w-full rounded-xl border bg-transparent px-3 outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
                  />
                </label>
              </div>
            </details>

            <Button type="submit" className="w-full min-h-12">
              Criar objetivo
            </Button>
          </form>
        </section>
      </div>
    </main>
  )
}
