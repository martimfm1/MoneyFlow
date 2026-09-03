import type { Instrumentation } from 'next'
import { logger } from '@/lib/logger'

export function register() {
  logger.info('server_started', {
    runtime: process.env.NEXT_RUNTIME,
    nodeEnv: process.env.NODE_ENV,
  })
}

export const onRequestError: Instrumentation.onRequestError = async (
  error,
  request,
  context,
) => {
  logger.error('request_error', {
    error,
    digest: error.digest,
    method: request.method,
    path: request.path.split('?')[0],
    routerKind: context.routerKind,
    routePath: context.routePath,
    routeType: context.routeType,
    renderSource: context.renderSource,
    renderType: context.renderType,
    revalidateReason: context.revalidateReason,
  })
}
