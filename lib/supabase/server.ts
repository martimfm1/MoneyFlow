import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { logger } from '@/lib/logger'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch {
            // Server Components cannot always mutate cookies; middleware handles refreshes.
          }
        },
      },
      global: {
        fetch: async (input, init) => {
          const startedAt = performance.now()
          const isRequest = input instanceof Request
          const requestUrl =
            typeof input === 'string'
              ? input
              : isRequest
                ? input.url
                : input.toString()
          const method =
            init?.method ?? (isRequest ? input.method : 'GET')
          let path = 'unknown'

          try {
            path = new URL(requestUrl).pathname
          } catch {
            // Keep malformed/unexpected URLs out of the log payload.
          }

          try {
            const response = await fetch(input, init)
            logger.info('supabase_request', {
              method,
              path,
              status: response.status,
              durationMs: Math.round(performance.now() - startedAt),
            })
            return response
          } catch (error) {
            logger.error('supabase_request_failed', {
              method,
              path,
              durationMs: Math.round(performance.now() - startedAt),
              error,
            })
            throw error
          }
        },
      },
    },
  )
}
