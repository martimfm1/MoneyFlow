import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { AccountForm } from './account-form'

export default function NewAccountPage() {
  return (
    <main className="min-h-screen">
      <div className="moneyflow-shell py-6 sm:py-10">
        <Link
          href="/dashboard/accounts"
          className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-[hsl(var(--muted-foreground))]"
        >
          <ArrowLeft className="size-4" /> Voltar
        </Link>
        <section className="mx-auto mt-8 max-w-3xl rounded-[var(--radius-lg)] border bg-[hsl(var(--surface))] p-6 shadow-sm sm:p-8">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Nova conta
          </h1>
          <AccountForm />
        </section>
      </div>
    </main>
  )
}
