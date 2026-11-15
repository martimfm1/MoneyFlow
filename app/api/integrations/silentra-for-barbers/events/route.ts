import { createHash } from 'node:crypto'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { z } from 'zod'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const schema = z.object({
  eventSecret: z.string().regex(/^[a-f0-9]{64}$/i),
  eventId: z.string().trim().min(1).max(200),
  amount: z.number().finite().positive().max(1_000_000),
  currency: z.string().regex(/^[A-Za-z]{3}$/),
  occurredAt: z.string().datetime({ offset: true }),
  description: z.string().trim().min(1).max(160),
  externalReference: z.string().trim().max(200).optional().nullable(),
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
  if (Number(request.headers.get('content-length') ?? 0) > 16_384) {
    return NextResponse.json(
      { ok: false, error: 'Pedido demasiado grande.' },
      { status: 413 },
    )
  }

  const body = await request.json().catch(() => null)
  const parsed = schema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: 'Evento de pagamento inválido.' },
      { status: 400, headers: { 'Cache-Control': 'no-store' } },
    )
  }

  try {
    const supabase = getPublicClient()
    const eventSecretHash = createHash('sha256')
      .update(parsed.data.eventSecret)
      .digest('hex')

    const { data, error } = await supabase.rpc(
      'process_silentra_platform_payment',
      {
        p_event_secret_hash: eventSecretHash,
        p_event_id: parsed.data.eventId,
        p_amount: parsed.data.amount,
        p_currency: parsed.data.currency.toUpperCase(),
        p_occurred_at: parsed.data.occurredAt,
        p_description: parsed.data.description,
        p_external_reference: parsed.data.externalReference ?? null,
      },
    )

    if (error || !data?.ok) {
      return NextResponse.json(
        { ok: false, error: 'A integração não aceitou este pagamento.' },
        {
          status: error?.message?.includes('not connected') ? 401 : 400,
          headers: { 'Cache-Control': 'no-store' },
        },
      )
    }

    return NextResponse.json(
      { ok: true, inserted: data.inserted === true },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Não foi possível registar o pagamento.' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } },
    )
  }
}
