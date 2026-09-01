import Link from 'next/link'
import { Plus, Target } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

const priorityLabels: Record<string, string> = { high: 'Alta', medium: 'Média', low: 'Baixa' }

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat('pt-PT', { style: 'currency', currency }).format(amount)
}

export default async function GoalsPage() {
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
              </article>
            )
          })}
        </div>
      )}
    </main>
  )
}
