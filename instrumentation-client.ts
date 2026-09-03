if (process.env.NODE_ENV === 'production') {
  const clientLog = (message: string, meta?: Record<string, unknown>) => {
    console.info(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        service: 'moneyflow-client',
        level: 'info',
        message,
        ...(meta ? { meta } : {}),
      }),
    )
  }

  window.addEventListener('error', (event) => {
    console.error(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        service: 'moneyflow-client',
        level: 'error',
        message: 'client_error',
        meta: {
          message: event.message,
          source: event.filename?.split('/').pop(),
          line: event.lineno,
          column: event.colno,
        },
      }),
    )
  })

  window.addEventListener('unhandledrejection', (event) => {
    console.error(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        service: 'moneyflow-client',
        level: 'error',
        message: 'unhandled_rejection',
        meta: {
          reason:
            event.reason instanceof Error ? event.reason.message : String(event.reason),
        },
      }),
    )
  })

  export function onRouterTransitionStart(
    url: string,
    navigationType: 'push' | 'replace' | 'traverse',
  ) {
    clientLog('navigation_started', {
      navigationType,
      path: url.split('?')[0].split('#')[0],
    })
  }
}
