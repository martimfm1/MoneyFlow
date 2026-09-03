const enabled = process.env.NODE_ENV === 'production'

function sendClientError(message: string, meta?: Record<string, unknown>) {
  if (!enabled || typeof navigator === 'undefined') return

  const body = JSON.stringify({ level: 'error', message, meta })
  const blob = new Blob([body], { type: 'application/json' })

  try {
    if (navigator.sendBeacon) {
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
    sendClientError('client_error', {
      message: event.message,
      source: event.filename?.split('/').pop(),
      line: event.lineno,
      column: event.colno,
    })
  })

  window.addEventListener('unhandledrejection', (event) => {
    sendClientError('unhandled_rejection', {
      reason:
        event.reason instanceof Error ? event.reason.message : String(event.reason),
    })
  })
}
