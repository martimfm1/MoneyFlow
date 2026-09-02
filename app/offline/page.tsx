import Link from 'next/link'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const dynamic = 'force-static'

export default function OfflinePage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <section className="w-full max-w-md rounded-[var(--radius-lg)] border bg-[hsl(var(--surface))] p-6 text-center shadow-sm sm:p-8">
        <div className="mx-auto inline-flex size-12 items-center justify-center rounded-full bg-[hsl(var(--surface-muted))]">
          <RefreshCw className="size-5" aria-hidden="true" />
        </div>
        <p className="mt-5 text-sm font-medium text-[hsl(var(--muted-foreground))]">
          MoneyFlow
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          Estás offline
        </h1>
        <p className="mt-3 text-sm leading-6 text-[hsl(var(--muted-foreground))]">
          Não foi possível carregar esta página agora. Volta a ligar-te à internet e tenta novamente.
        </p>
        <Button asChild className="mt-6">
          <Link href="/dashboard">Tentar novamente</Link>
        </Button>
      </section>
    </main>
  )
}
