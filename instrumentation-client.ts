const enabled = process.env.NODE_ENV === 'production'

function normalizePath(url: string) {
  return url
    .split('?')[0]
    .split('#')[0]
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/gi, '[id]')
}

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
    path: normalizePath(url),
  })
}
