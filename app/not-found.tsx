import Link from 'next/link'
import { ArrowLeft, SearchX } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[hsl(var(--background))] px-5 py-10 text-[hsl(var(--foreground))]">
      <section className="w-full max-w-md text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-[hsl(var(--surface-muted))] text-[hsl(var(--muted-foreground))]">
          <SearchX aria-hidden="true" className="size-7" />
        </div>
        <p className="mt-5 text-sm font-medium text-[hsl(var(--muted-foreground))]">
          404
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          Page not found
        </h1>
        <p className="mt-2 text-sm leading-6 text-[hsl(var(--muted-foreground))]">
          This page doesn’t exist or may have moved. You can safely head back to
          MoneyFlow.
        </p>
        <div className="mt-6">
          <Button asChild>
            <Link href="/dashboard">
              <ArrowLeft aria-hidden="true" className="size-4" />
              Back to dashboard
            </Link>
          </Button>
        </div>
      </section>
    </main>
  )
}
