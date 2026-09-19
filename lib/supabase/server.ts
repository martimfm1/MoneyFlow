import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { logger } from '@/lib/logger'

export const REMEMBER_COOKIE = 'moneyflow-remember'
export const SESSION_MAX_AGE = 30 * 24 * 60 * 60

type CreateClientOptions = {
  remember?: boolean
}

export async function createClient(options: CreateClientOptions = {}) {
  const cookieStore = await cookies()
  const remember =
    options.remember ??
    cookieStore.get(REMEMBER_COOKIE)?.value === '1'

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
            cookiesToSet.forEach(({ name, value, options: cookieOptions }) => {
              const options =
                remember && value
                  ? { ...cookieOptions, maxAge: SESSION_MAX_AGE }
                  : cookieOptions
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
          const method = init?.method ?? (isRequest ? input.method : 'GET')
          let path = 'unknown'

          try {
            path = new URL(requestUrl).pathname
          } catch {
            // Keep malformed/unexpected URLs out of the log payload.
          }

          try {
            const response = await fetch(input, init)
            if (response.status >= 400) {
              logger.error('database_request_failed', {
                method,
                path,
                status: response.status,
                durationMs: Math.round(performance.now() - startedAt),
              })
            }
            return response
          } catch (error) {
            logger.error('database_request_failed', {
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
