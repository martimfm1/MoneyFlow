'use client'

import { CheckCircle2, X, XCircle } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

export function ToastViewport() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [dismissedKey, setDismissedKey] = useState<string | null>(null)

  const toast = useMemo(() => {
    const message = searchParams.get('toast')
    const error = searchParams.get('error')
    if (!message && !error) return null

    return {
      type: message ? 'success' as const : 'error' as const,
      message: message ?? error ?? '',
      key: `${pathname}:${message ?? ''}:${error ?? ''}`,
    }
  }, [pathname, searchParams])

  useEffect(() => {
    if (!toast) return

    const next = new URLSearchParams(searchParams.toString())
    next.delete('toast')
    next.delete('error')
    const query = next.toString()
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })

    const timeout = window.setTimeout(() => setDismissedKey(toast.key), 3200)
    return () => window.clearTimeout(timeout)
  }, [pathname, router, searchParams, toast])

  const visibleToast = toast && toast.key !== dismissedKey ? toast : null
  if (!visibleToast) return null

  return (
    <div className="pointer-events-none fixed inset-x-3 top-3 z-[100] flex justify-center sm:inset-x-auto sm:right-4 sm:top-4 sm:max-w-sm">
      <div role={visibleToast.type === 'error' ? 'alert' : 'status'} className="pointer-events-auto flex w-full items-center gap-3 rounded-2xl border bg-[hsl(var(--surface)/0.98)] px-3 py-3 shadow-xl backdrop-blur-xl animate-in slide-in-from-top-2">
        {visibleToast.type === 'success' ? <CheckCircle2 className="size-5 shrink-0 text-[hsl(var(--success))]" aria-hidden="true" /> : <XCircle className="size-5 shrink-0 text-[hsl(var(--danger))]" aria-hidden="true" />}
        <p className="min-w-0 flex-1 text-sm font-medium leading-5">{visibleToast.message}</p>
        <button type="button" aria-label="Fechar" onClick={() => setDismissedKey(visibleToast.key)} className="inline-flex size-8 shrink-0 items-center justify-center rounded-full text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--surface-muted))]"><X className="size-4" /></button>
      </div>
    </div>
  )
}
