import Link from 'next/link'
import { Plus, Target } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { addGoalContribution } from './actions'

export const dynamic = 'force-dynamic'

const priorityLabels: Record<string, string> = { high: 'Alta', medium: 'Média', low: 'Baixa' }

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat('pt-PT', { style: 'currency', currency }).format(amount)
}

export default async function GoalsPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: goals }] = await Promise.all([
    supabase.from('profiles').select('currency_code').eq('id', user.id).maybeSingle(),
    supabase.from('goals').select('id, name, target_amount, current_amount, target_date, priority').eq('user_id', user.id).order('priority', { ascending: true }).order('created_at', { ascending: false }),
  ])

  const currency = profile?.currency_code ?? 'EUR'

  return (
    <main className="moneyflow-shell py-6 sm:py-10">
      <header className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">Planeamento</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Objetivos</h1>
        </div>
        <Button asChild size="sm"><Link href="/dashboard/goals/new"><Plus className="size-4" /> Novo</Link></Button>
      </header>

      {params.error ? <p className="mt-5 rounded-[var(--radius-md)] bg-[hsl(var(--danger)/0.08)] px-3 py-2 text-sm">{params.error}</p> : null}

      {!goals?.length ? (
        <section className="mt-8 rounded-[var(--radius-lg)] border border-dashed bg-[hsl(var(--surface))] p-8 text-center">
          <Target className="mx-auto size-6" />
          <h2 className="mt-4 font-medium">Ainda não tens objetivos</h2>
          <p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-[hsl(var(--muted-foreground))]">Cria um objetivo para começar a dar um propósito concreto ao dinheiro que queres guardar.</p>
          <Button asChild className="mt-5"><Link href="/dashboard/goals/new">Criar objetivo</Link></Button>
        </section>
      ) : (
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {goals.map((goal) => {
            const current = Number(goal.current_amount)
            const target = Number(goal.target_amount)
            const remaining = Math.max(0, target - current)
            const progress = Math.min(100, Math.round((current / target) * 100))
            return (
              <article key={goal.id} className="rounded-[var(--radius-lg)] border bg-[hsl(var(--surface))] p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="font-medium">{goal.name}</h2>
                    <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">Prioridade {priorityLabels[goal.priority] ?? goal.priority}</p>
                  </div>
                  <p className="text-sm font-semibold">{progress}%</p>
                </div>
                <div className="mt-5 h-2 overflow-hidden rounded-full bg-[hsl(var(--surface-muted))]">
                  <div className="h-full rounded-full bg-[hsl(var(--primary))]" style={{ width: `${progress}%` }} />
                </div>
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="tabular-nums">{formatMoney(current, currency)}</span>
                  <span className="text-[hsl(var(--muted-foreground))]">de {formatMoney(target, currency)}</span>
                </div>
                {goal.target_date ? <p className="mt-3 text-xs text-[hsl(var(--muted-foreground))]">Data alvo: {new Intl.DateTimeFormat('pt-PT').format(new Date(`${goal.target_date}T00:00:00`))}</p> : null}

                {remaining > 0 ? (
                  <form action={addGoalContribution} className="mt-5 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                    <input type="hidden" name="goalId" value={goal.id} />
                    <label className="sr-only" htmlFor={`contribution-${goal.id}`}>Valor da contribuição</label>
                    <input id={`contribution-${goal.id}`} name="amount" type="number" inputMode="decimal" step="0.01" min="0.01" max={remaining.toFixed(2)} placeholder={`Até ${formatMoney(remaining, currency)}`} className="min-h-10 rounded-[var(--radius-md)] border bg-transparent px-3 text-sm outline-none" />
                    <label className="sr-only" htmlFor={`note-${goal.id}`}>Nota da contribuição</label>
                    <input id={`note-${goal.id}`} name="note" maxLength={500} placeholder="Nota opcional" className="min-h-10 rounded-[var(--radius-md)] border bg-transparent px-3 text-sm outline-none" />
                    <Button type="submit" size="sm">Guardar</Button>
                  </form>
                ) : (
                  <p className="mt-5 text-sm font-medium">Objetivo concluído.</p>
                )}
              </article>
            )
          })}
        </div>
      )}
    </main>
  )
}
