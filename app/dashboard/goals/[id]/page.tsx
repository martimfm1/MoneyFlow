import Link from 'next/link'
import { ArrowLeft, CalendarDays, CheckCircle2, Target } from 'lucide-react'
import { redirect, notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'
import { addGoalContribution } from '../actions'
import { DeleteGoalButton } from '../delete-goal-button'

export const dynamic = 'force-dynamic'

const priorityLabels: Record<string, string> = {
  high: 'Alta',
  medium: 'Média',
  low: 'Baixa',
}

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat('pt-PT', {
    style: 'currency',
    currency,
  }).format(amount)
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-PT', {
    dateStyle: 'medium',
  }).format(new Date(value))
}

export default async function GoalDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const [{ id }, query] = await Promise.all([params, searchParams])
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: goal }, { data: contributions }] =
    await Promise.all([
      supabase
        .from('profiles')
        .select('currency_code')
        .eq('id', user.id)
        .maybeSingle(),
      supabase
        .from('goals')
        .select(
          'id, name, target_amount, current_amount, target_date, priority, category, icon, wishlist_item_id',
        )
        .eq('id', id)
        .eq('user_id', user.id)
        .maybeSingle(),
      supabase
        .from('goal_contributions')
        .select('id, amount, contributed_at, note')
        .eq('goal_id', id)
        .eq('user_id', user.id)
        .order('contributed_at', { ascending: false }),
    ])

  if (!goal) notFound()

  const currency = profile?.currency_code ?? 'EUR'
  const current = Number(goal.current_amount)
  const target = Number(goal.target_amount)
  const remaining = Math.max(0, target - current)
  const progress = Math.min(100, Math.round((current / target) * 100))
  const totalContributed = (contributions ?? []).reduce(
    (sum, contribution) => sum + Number(contribution.amount),
    0,
  )

  return (
    <main className="moneyflow-shell py-6 sm:py-10 lg:py-12">
      <div className="flex items-center justify-between gap-2">
        <Button asChild size="sm" variant="ghost">
          <Link href="/dashboard/goals">
            <ArrowLeft className="size-4" /> Objetivos
          </Link>
        </Button>
        <DeleteGoalButton goalId={goal.id} />
      </div>

      <header className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[hsl(var(--primary)/0.1)]">
            <Target className="size-5" />
          </div>
          <div>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              Objetivo · Prioridade{' '}
              {priorityLabels[goal.priority] ?? goal.priority}
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight lg:text-3xl">
              {goal.name}
            </h1>
            {goal.category ? (
              <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
                {goal.category}
              </p>
            ) : null}
          </div>
        </div>
        {goal.wishlist_item_id ? (
          <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium">
            Ligado à Wishlist
          </span>
        ) : null}
      </header>

      {query.error ? (
        <p className="mt-5 rounded-[var(--radius-md)] bg-[hsl(var(--danger)/0.08)] px-3 py-2 text-sm">
          {query.error}
        </p>
      ) : null}

      <section className="mt-6 rounded-[var(--radius-lg)] border bg-[hsl(var(--surface))] p-5 shadow-sm sm:p-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              Progresso
            </p>
            <p className="mt-1 text-3xl font-semibold tabular-nums">
              {progress}%
            </p>
          </div>
          <div className="text-right">
            <p className="text-lg font-semibold tabular-nums">
              {formatMoney(current, currency)}
            </p>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              de {formatMoney(target, currency)}
            </p>
          </div>
        </div>
        <div
          className="mt-5 h-3 overflow-hidden rounded-full bg-[hsl(var(--surface-muted))]"
          aria-label={`Progresso do objetivo: ${progress}%`}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
        >
          <div
            className="h-full rounded-full bg-[hsl(var(--primary))] transition-[width]"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-[var(--radius-md)] bg-[hsl(var(--surface-muted))] p-3">
            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              Em falta
            </p>
            <p className="mt-1 font-semibold tabular-nums">
              {formatMoney(remaining, currency)}
            </p>
          </div>
          <div className="rounded-[var(--radius-md)] bg-[hsl(var(--surface-muted))] p-3">
            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              Contribuições
            </p>
            <p className="mt-1 font-semibold tabular-nums">
              {contributions?.length ?? 0}
            </p>
          </div>
          <div className="rounded-[var(--radius-md)] bg-[hsl(var(--surface-muted))] p-3">
            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              Guardado
            </p>
            <p className="mt-1 font-semibold tabular-nums">
              {formatMoney(totalContributed, currency)}
            </p>
          </div>
        </div>

        {goal.target_date ? (
          <div className="mt-5 flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))]">
            <CalendarDays className="size-4" />
            Data alvo: {formatDate(`${goal.target_date}T00:00:00`)}
          </div>
        ) : null}
      </section>

      {remaining > 0 ? (
        <section className="mt-6 rounded-[var(--radius-lg)] border bg-[hsl(var(--surface))] p-5 shadow-sm sm:p-6">
          <div>
            <h2 className="font-semibold">Adicionar contribuição</h2>
            <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
              Até {formatMoney(remaining, currency)} para completar este
              objetivo.
            </p>
          </div>
          <form
            action={addGoalContribution}
            className="mt-5 grid gap-3 sm:grid-cols-[1fr_1fr_auto]"
          >
            <input type="hidden" name="goalId" value={goal.id} />
            <label className="sr-only" htmlFor="detail-contribution-amount">
              Valor da contribuição
            </label>
            <input
              id="detail-contribution-amount"
              name="amount"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              placeholder={`Até ${formatMoney(remaining, currency)}`}
              className="min-h-10 rounded-[var(--radius-md)] border bg-transparent px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
              required
            />
            <label className="sr-only" htmlFor="detail-contribution-note">
              Nota da contribuição
            </label>
            <input
              id="detail-contribution-note"
              name="note"
              maxLength={500}
              placeholder="Nota opcional"
              className="min-h-10 rounded-[var(--radius-md)] border bg-transparent px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
            />
            <Button type="submit">Guardar</Button>
          </form>
        </section>
      ) : (
        <section className="mt-6 rounded-[var(--radius-lg)] border bg-[hsl(var(--surface))] p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="size-5" />
            <div>
              <h2 className="font-semibold">Objetivo concluído</h2>
              <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
                A meta já foi totalmente financiada.
              </p>
            </div>
          </div>
        </section>
      )}

      <section className="mt-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Histórico</h2>
            <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
              Todas as contribuições deste objetivo.
            </p>
          </div>
        </div>

        {!contributions?.length ? (
          <div className="mt-4 rounded-[var(--radius-lg)] border border-dashed bg-[hsl(var(--surface))] p-8 text-center">
            <p className="font-medium">Ainda sem contribuições</p>
            <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
              A primeira contribuição aparece aqui assim que começares a
              guardar.
            </p>
          </div>
        ) : (
          <div className="mt-4 overflow-hidden rounded-[var(--radius-lg)] border bg-[hsl(var(--surface))]">
            <ul className="divide-y">
              {contributions.map((contribution) => (
                <li
                  key={contribution.id}
                  className="flex items-center justify-between gap-4 p-4"
                >
                  <div className="min-w-0">
                    <p className="font-medium tabular-nums">
                      +{formatMoney(Number(contribution.amount), currency)}
                    </p>
                    <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
                      {formatDate(contribution.contributed_at)}
                      {contribution.note ? ` · ${contribution.note}` : ''}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs font-medium text-[hsl(var(--muted-foreground))]">
                    Contribuição
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </main>
  )
}
