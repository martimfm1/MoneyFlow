import type { Instrumentation } from 'next'
import { logger } from '@/lib/logger'

export function register() {}

export const onRequestError: Instrumentation.onRequestError = async (
  error,
  request,
  context,
) => {
  logger.error('request_error', {
    error,
    method: request.method,
    path: request.path.split('?')[0],
    routerKind: context.routerKind,
    routePath: context.routePath,
    routeType: context.routeType,
    renderSource: context.renderSource,
    revalidateReason: context.revalidateReason,
  })
}
