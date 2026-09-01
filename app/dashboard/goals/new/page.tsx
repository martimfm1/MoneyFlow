import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createGoal } from './actions'

export default async function NewGoalPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams

  return (
    <main className="min-h-screen">
      <div className="moneyflow-shell py-6 sm:py-10">
        <Link href="/dashboard" className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-[hsl(var(--muted-foreground))]">
          <ArrowLeft className="size-4" /> Voltar
        </Link>
        <section className="mx-auto mt-8 max-w-lg rounded-[var(--radius-lg)] border bg-[hsl(var(--surface))] p-6 shadow-sm sm:p-8">
          <h1 className="text-2xl font-semibold tracking-tight">Novo objetivo</h1>
          <p className="mt-2 text-sm leading-6 text-[hsl(var(--muted-foreground))]">Dá um propósito a uma parte do teu dinheiro.</p>
          {params.error ? <p className="mt-4 rounded-[var(--radius-md)] bg-[hsl(var(--danger)/0.08)] px-3 py-2 text-sm">{params.error}</p> : null}

          <form action={createGoal} className="mt-6 space-y-4">
            <label className="block space-y-2 text-sm font-medium">
              <span>Nome</span>
              <input name="name" required maxLength={120} placeholder="Viagem, computador, fundo de emergência..." className="min-h-11 w-full rounded-[var(--radius-md)] border bg-transparent px-3 outline-none" />
            </label>

            <label className="block space-y-2 text-sm font-medium">
              <span>Valor objetivo</span>
              <input name="targetAmount" type="number" inputMode="decimal" step="0.01" min="0.01" required placeholder="1000,00" className="min-h-11 w-full rounded-[var(--radius-md)] border bg-transparent px-3 text-lg outline-none" />
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
              <span>Data alvo <span className="font-normal text-[hsl(var(--muted-foreground))]">(opcional)</span></span>
              <input name="targetDate" type="date" className="min-h-11 w-full rounded-[var(--radius-md)] border bg-transparent px-3 outline-none" />
            </label>

            <Button type="submit" className="w-full">Criar objetivo</Button>
          </form>
        </section>
      </div>
    </main>
  )
}
