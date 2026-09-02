'use client'

import { useEffect } from 'react'

export function RegisterServiceWorker() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') return

    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Service workers are an enhancement; the application remains fully usable without one.
    })
  }, [])

  return null
}
