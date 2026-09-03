'use client'

import { CheckCircle2, X, XCircle } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

export function ToastViewport() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  useEffect(() => {
    const message = searchParams.get('toast')
    const error = searchParams.get('error')
    if (!message && !error) return

    setToast({ type: message ? 'success' : 'error', message: message ?? error ?? '' })
    const next = new URLSearchParams(searchParams.toString())
    next.delete('toast')
    next.delete('error')
    const query = next.toString()
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })

    const timeout = window.setTimeout(() => setToast(null), 3200)
    return () => window.clearTimeout(timeout)
  }, [pathname, router, searchParams])

  if (!toast) return null

  return (
    <div className="pointer-events-none fixed inset-x-3 top-3 z-[100] flex justify-center sm:inset-x-auto sm:right-4 sm:top-4 sm:max-w-sm">
      <div role={toast.type === 'error' ? 'alert' : 'status'} className="pointer-events-auto flex w-full items-center gap-3 rounded-2xl border bg-[hsl(var(--surface)/0.98)] px-3 py-3 shadow-xl backdrop-blur-xl animate-in slide-in-from-top-2">
        {toast.type === 'success' ? <CheckCircle2 className="size-5 shrink-0 text-[hsl(var(--success))]" aria-hidden="true" /> : <XCircle className="size-5 shrink-0 text-[hsl(var(--danger))]" aria-hidden="true" />}
        <p className="min-w-0 flex-1 text-sm font-medium leading-5">{toast.message}</p>
        <button type="button" aria-label="Fechar" onClick={() => setToast(null)} className="inline-flex size-8 shrink-0 items-center justify-center rounded-full text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--surface-muted))]"><X className="size-4" /></button>
      </div>
    </div>
  )
}
