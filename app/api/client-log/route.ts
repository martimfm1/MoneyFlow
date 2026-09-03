import { logger } from '@/lib/logger'

const MAX_BODY_BYTES = 8192
const MAX_MESSAGE_LENGTH = 240

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get('content-length') ?? 0)
  if (contentLength > MAX_BODY_BYTES) {
    return new Response(null, { status: 413 })
  }

  try {
    const body = (await request.json()) as {
      level?: unknown
      message?: unknown
      meta?: unknown
    }

    if (body.level !== 'error') {
      return new Response(null, { status: 400 })
    }

    const message =
      typeof body.message === 'string'
        ? body.message.slice(0, MAX_MESSAGE_LENGTH)
        : 'client_event'
    const meta =
      body.meta && typeof body.meta === 'object' && !Array.isArray(body.meta)
        ? (body.meta as Record<string, unknown>)
        : undefined

    logger.error(`client_${message}`, meta)
    return new Response(null, { status: 204 })
  } catch (error) {
    logger.error('client_log_rejected', { error })
    return new Response(null, { status: 400 })
  }
}
