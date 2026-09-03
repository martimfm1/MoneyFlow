const enabled = process.env.NODE_ENV === 'production'

function clientLog(level: 'info' | 'error', message: string, meta?: Record<string, unknown>) {
  if (!enabled) return

  const payload = JSON.stringify({
    timestamp: new Date().toISOString(),
    service: 'moneyflow-client',
    level,
    message,
    ...(meta ? { meta } : {}),
  })

  if (level === 'error') console.error(payload)
  else console.info(payload)
}

if (enabled) {
  window.addEventListener('error', (event) => {
    clientLog('error', 'client_error', {
      message: event.message,
      source: event.filename?.split('/').pop(),
      line: event.lineno,
      column: event.colno,
    })
  })

  window.addEventListener('unhandledrejection', (event) => {
    clientLog('error', 'unhandled_rejection', {
      reason:
        event.reason instanceof Error ? event.reason.message : String(event.reason),
    })
  })
}

export function onRouterTransitionStart(
  url: string,
  navigationType: 'push' | 'replace' | 'traverse',
) {
  clientLog('info', 'navigation_started', {
    navigationType,
    path: url.split('?')[0].split('#')[0],
  })
}
