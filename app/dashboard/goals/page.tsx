import Link from 'next/link'
import { Plus, Target } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { addGoalContribution } from './actions'
import { DeleteGoalButton } from './delete-goal-button'
import { formatCurrency, formatDate } from '@/lib/format'

export const dynamic = 'force-dynamic'

const priorityLabels: Record<string, string> = {
  high: 'Alta',
  medium: 'Média',
  low: 'Baixa',
}

export default async function GoalsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; toast?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: goals }] = await Promise.all([
    supabase
      .from('profiles')
      .select('currency_code')
      .eq('id', user.id)
      .maybeSingle(),
    supabase
      .from('goals')
      .select('id, name, target_amount, current_amount, target_date, priority')
      .eq('user_id', user.id)
      .order('priority', { ascending: true })
      .order('created_at', { ascending: false }),
  ])

  const currency = profile?.currency_code ?? 'EUR'

  return (
    <main className="moneyflow-shell py-6 sm:py-10 lg:py-12">
      <header className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            Planeamento
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight lg:text-3xl">
            Objetivos
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-[hsl(var(--muted-foreground))]">
            Define metas de poupança e acompanha o progresso com contribuições.
          </p>
        </div>
        <Button asChild size="sm">
          <Link href="/dashboard/goals/new">
            <Plus className="size-4" aria-hidden="true" /> Novo objetivo
          </Link>
        </Button>
      </header>

      {params.toast ? (
        <p
          role="status"
          className="mt-5 rounded-[var(--radius-md)] border border-[hsl(var(--success)/0.25)] bg-[hsl(var(--success)/0.08)] px-3 py-2 text-sm"
        >
          {params.toast}
        </p>
      ) : null}
      {params.error ? (
        <p
          role="alert"
          className="mt-5 rounded-[var(--radius-md)] bg-[hsl(var(--danger)/0.08)] px-3 py-2 text-sm"
        >
          {params.error}
        </p>
      ) : null}

      {!goals?.length ? (
        <section className="mt-8 rounded-[var(--radius-lg)] border border-dashed bg-[hsl(var(--surface))] p-8 text-center lg:p-12">
          <Target className="mx-auto size-6" />
          <h2 className="mt-4 font-medium">Ainda não tens objetivos</h2>
          <p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-[hsl(var(--muted-foreground))]">
            Cria um objetivo para começar a dar um propósito concreto ao
            dinheiro que queres guardar.
          </p>
          <Button asChild className="mt-5">
            <Link href="/dashboard/goals/new">Criar objetivo</Link>
          </Button>
        </section>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {goals.map((goal) => {
            const current = Number(goal.current_amount)
            const target = Number(goal.target_amount)
            const remaining = Math.max(0, target - current)
            const progress =
              target > 0
                ? Math.min(100, Math.round((current / target) * 100))
                : 0
            return (
              <article
                key={goal.id}
                className="flex min-h-full flex-col rounded-[var(--radius-lg)] border bg-[hsl(var(--surface))] p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="break-words font-medium">{goal.name}</h2>
                    <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
                      Prioridade{' '}
                      {priorityLabels[goal.priority] ?? goal.priority}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-semibold tabular-nums">
                    {progress}%
                  </p>
                </div>
                <div
                  className="mt-5 h-2 overflow-hidden rounded-full bg-[hsl(var(--surface-muted))]"
                  role="progressbar"
                  aria-label={`Progresso de ${goal.name}`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={progress}
                  aria-valuetext={`${progress}% concluído`}
                >
                  <div
                    className="h-full rounded-full bg-[hsl(var(--primary))]"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="mt-3 flex items-center justify-between gap-3 text-sm">
                  <span className="tabular-nums">
                    {formatCurrency(current, currency)}
                  </span>
                  <span className="text-right text-[hsl(var(--muted-foreground))]">
                    de {formatCurrency(target, currency)}
                  </span>
                </div>
                <p className="mt-2 text-xs text-[hsl(var(--muted-foreground))]">
                  {remaining > 0
                    ? `Faltam ${formatCurrency(remaining, currency)}`
                    : 'Objetivo alcançado'}
                </p>
                {goal.target_date ? (
                  <p className="mt-3 text-xs text-[hsl(var(--muted-foreground))]">
                    Data alvo: {formatDate(`${goal.target_date}T00:00:00`)}
                  </p>
                ) : null}

                <div className="mt-auto pt-5">
                  {remaining > 0 ? (
                    <form
                      action={addGoalContribution}
                      className="flex min-w-0 gap-2"
                    >
                      <input type="hidden" name="goalId" value={goal.id} />
                      <label
                        className="sr-only"
                        htmlFor={`contribution-${goal.id}`}
                      >
                        Valor da contribuição
                      </label>
                      <input
                        id={`contribution-${goal.id}`}
                        name="amount"
                        type="text"
                        inputMode="decimal"
                        autoComplete="off"
                        minLength={1}
                        placeholder={`Até ${formatCurrency(remaining, currency)}`}
                        className="min-h-11 min-w-0 flex-1 rounded-[var(--radius-md)] border bg-transparent px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
                      />
                      <Button type="submit" size="sm">
                        Adicionar
                      </Button>
                    </form>
                  ) : null}

                  <div className="mt-3 flex items-center justify-between gap-2 border-t pt-3">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/dashboard/goals/${goal.id}`}>
                        Ver objetivo
                      </Link>
                    </Button>
                    <DeleteGoalButton goalId={goal.id} />
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </main>
  )
}
