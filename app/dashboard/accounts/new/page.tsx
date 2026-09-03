import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createAccount } from './actions'

export default async function NewAccountPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams

  return (
    <main className="min-h-screen">
      <div className="moneyflow-shell py-6 sm:py-10">
        <Link href="/dashboard" className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-[hsl(var(--muted-foreground))]"><ArrowLeft className="size-4" /> Voltar</Link>
        <section className="mx-auto mt-8 max-w-3xl rounded-[var(--radius-lg)] border bg-[hsl(var(--surface))] p-6 shadow-sm sm:p-8">
          <div className="max-w-2xl"><h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Nova conta</h1><p className="mt-2 text-sm leading-6 text-[hsl(var(--muted-foreground))]">Adiciona uma conta para o MoneyFlow saber onde está o teu dinheiro.</p></div>
          {params.error ? <p role="alert" className="mt-5 rounded-[var(--radius-md)] bg-[hsl(var(--danger)/0.08)] px-3 py-2 text-sm">{params.error}</p> : null}
          <form action={createAccount} className="mt-7 grid gap-5 lg:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium"><span>Nome</span><input name="name" required maxLength={80} placeholder="Conta principal" className="min-h-11 w-full rounded-[var(--radius-md)] border bg-transparent px-3 font-normal outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]" /></label>
            <label className="grid gap-2 text-sm font-medium"><span>Tipo</span><select name="accountType" defaultValue="bank" className="min-h-11 w-full rounded-[var(--radius-md)] border bg-[hsl(var(--surface))] px-3 font-normal outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"><option value="bank">Banco</option><option value="cash">Dinheiro</option><option value="card">Cartão</option><option value="savings">Poupança</option><option value="other">Outro</option></select></label>
            <label className="grid gap-2 text-sm font-medium"><span>Saldo atual</span><input name="balance" type="number" inputMode="decimal" step="0.01" required placeholder="0,00" className="min-h-11 w-full rounded-[var(--radius-md)] border bg-transparent px-3 font-normal outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]" /></label>
            <div className="flex items-end lg:justify-end"><Button type="submit" className="w-full lg:w-auto">Criar conta</Button></div>
          </form>
        </section>
      </div>
    </main>
  )
}
