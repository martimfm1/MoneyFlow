import { createHash } from 'node:crypto'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { z } from 'zod'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const schema = z.object({
  eventSecret: z.string().regex(/^[a-f0-9]{64}$/i),
})

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: 'Credencial de integração inválida.' },
      { status: 400 },
    )
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) {
    return NextResponse.json(
      { ok: false, error: 'Serviço indisponível.' },
      { status: 503 },
    )
  }

  const supabase = createSupabaseClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })
  const eventSecretHash = createHash('sha256')
    .update(parsed.data.eventSecret)
    .digest('hex')

  const { data, error } = await supabase.rpc(
    'disconnect_silentra_integration_by_secret_hash',
    { p_event_secret_hash: eventSecretHash },
  )

  if (error || data !== true) {
    return NextResponse.json(
      { ok: false, error: 'A credencial não corresponde a uma ligação ativa.' },
      { status: 401 },
    )
  }

  return NextResponse.json(
    { ok: true },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
