'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('MoneyFlow application error', error)
  }, [error])

  return (
    <main className="flex min-h-screen items-center justify-center bg-[hsl(var(--background))] px-5 py-10 text-[hsl(var(--foreground))]">
      <section className="w-full max-w-md text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-[hsl(var(--danger)/0.12)] text-[hsl(var(--danger))]">
          <AlertTriangle aria-hidden="true" className="size-7" />
        </div>
        <h1 className="mt-5 text-2xl font-semibold tracking-tight">Something went wrong</h1>
        <p className="mt-2 text-sm leading-6 text-[hsl(var(--muted-foreground))]">
          We couldn’t load this part of MoneyFlow. Try again, or return to your dashboard.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button type="button" onClick={reset}>
            <RefreshCw aria-hidden="true" className="size-4" />
            Try again
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard">Back to dashboard</Link>
          </Button>
        </div>
      </section>
    </main>
  )
}
