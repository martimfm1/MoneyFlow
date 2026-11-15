import { createHash } from 'node:crypto'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { z } from 'zod'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const schema = z.object({
  pairingToken: z.string().regex(/^[a-f0-9]{64}$/i),
  eventSecretHash: z.string().regex(/^[a-f0-9]{64}$/i),
})

function getPublicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) throw new Error('Supabase is not configured')
  return createSupabaseClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const parsed = schema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: 'Código de ligação inválido.' },
      { status: 400, headers: { 'Cache-Control': 'no-store' } },
    )
  }

  try {
    const supabase = getPublicClient()
    const tokenHash = createHash('sha256')
      .update(parsed.data.pairingToken)
      .digest('hex')

    const { data, error } = await supabase.rpc(
      'consume_silentra_pairing_token',
      {
        p_token_hash: tokenHash,
        p_event_secret_hash: parsed.data.eventSecretHash.toLowerCase(),
      },
    )

    if (error || !data?.length) {
      return NextResponse.json(
        {
          ok: false,
          error: 'O código expirou, já foi utilizado ou não é válido.',
        },
        { status: 400, headers: { 'Cache-Control': 'no-store' } },
      )
    }

    return NextResponse.json(
      {
        ok: true,
        accountName: data[0].account_name,
        currencyCode: data[0].currency_code,
        connectedAt: new Date().toISOString(),
      },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Não foi possível concluir a ligação.' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } },
    )
  }
}
