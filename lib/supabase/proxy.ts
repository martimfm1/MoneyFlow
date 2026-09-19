import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { REMEMBER_COOKIE, SESSION_MAX_AGE } from '@/lib/supabase/session'

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })
  const remember = request.cookies.get(REMEMBER_COOKIE)?.value === '1'

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => {
            const nextOptions =
              remember && value
                ? { ...options, maxAge: SESSION_MAX_AGE }
                : options
            response.cookies.set(name, value, nextOptions)
          })
        },
      },
    },
  )

  await supabase.auth.getClaims()
  return response
}
