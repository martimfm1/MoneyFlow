const enabled = process.env.NODE_ENV === 'production'

function sendClientLog(level: 'info' | 'error', message: string, meta?: Record<string, unknown>) {
  if (!enabled || typeof navigator === 'undefined') return

  const body = JSON.stringify({ level, message, meta })
  const blob = new Blob([body], { type: 'application/json' })

  try {
    if (level === 'error' && navigator.sendBeacon) {
      navigator.sendBeacon('/api/client-log', blob)
      return
    }

    void fetch('/api/client-log', {
      method: 'POST',
      body,
      headers: { 'content-type': 'application/json' },
      keepalive: true,
    }).catch(() => undefined)
  } catch {
    // Observability must never affect the application.
  }
}

if (enabled) {
  window.addEventListener('error', (event) => {
    sendClientLog('error', 'client_error', {
      message: event.message,
      source: event.filename?.split('/').pop(),
      line: event.lineno,
      column: event.colno,
    })
  })

  window.addEventListener('unhandledrejection', (event) => {
    sendClientLog('error', 'unhandled_rejection', {
      reason:
        event.reason instanceof Error ? event.reason.message : String(event.reason),
    })
  })
}

export function onRouterTransitionStart(
  url: string,
  navigationType: 'push' | 'replace' | 'traverse',
) {
  sendClientLog('info', 'navigation_started', {
    navigationType,
    path: url.split('?')[0].split('#')[0],
  })
}
