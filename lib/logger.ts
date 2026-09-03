type LogMeta = Record<string, unknown>

const SENSITIVE_KEYS = [
  'password',
  'token',
  'access_token',
  'refresh_token',
  'authorization',
  'cookie',
  'secret',
  'api_key',
  'apikey',
]

function sanitize(value: unknown, depth = 0): unknown {
  if (depth > 4) return '[depth-limit]'
  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack,
    }
  }
  if (Array.isArray(value))
    return value.map((item) => sanitize(item, depth + 1))
  if (!value || typeof value !== 'object') return value

  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => {
      const normalized = key.toLowerCase().replace(/[^a-z0-9]/g, '_')
      if (SENSITIVE_KEYS.some((sensitive) => normalized.includes(sensitive))) {
        return [key, '[redacted]']
      }
      return [key, sanitize(item, depth + 1)]
    }),
  )
}

export const logger = {
  error(message: string, meta?: LogMeta) {
    const payload = {
      timestamp: new Date().toISOString(),
      service: 'moneyflow',
      environment: process.env.NODE_ENV,
      level: 'error',
      message,
      ...(meta ? { meta: sanitize(meta) } : {}),
    }

    console.error(JSON.stringify(payload))
  },

  info(_message: string, _meta?: LogMeta) {},
  warn(_message: string, _meta?: LogMeta) {},
}
