'use client'

import { useEffect } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Toaster, toast } from '@/components/ui/toast'

export function QueryToaster() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    const message = searchParams.get('toast')
    const error = searchParams.get('error')
    if (!message && !error) return

    toast.add({
      title: message ? 'Concluído' : 'Erro',
      description: message ?? error ?? undefined,
      type: message ? 'success' : 'error',
    })

    const next = new URLSearchParams(searchParams.toString())
    next.delete('toast')
    next.delete('error')
    const query = next.toString()
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
  }, [pathname, router, searchParams])

  return <Toaster toastManager={toast} />
}
