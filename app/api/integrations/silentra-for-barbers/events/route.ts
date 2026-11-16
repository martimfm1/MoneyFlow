import { createHash } from 'node:crypto'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const schema = z.object({
  eventId: z.string().trim().min(1).max(160),
  amount: z.number().finite().positive().max(1_000_000),
  currency: z.string().regex(/^[A-Za-z]{3}$/),
  occurredAt: z.string().datetime({ offset: true }),
  description: z.string().trim().min(1).max(120),
  externalReference: z.string().trim().max(120).optional().nullable(),
})

export async function POST(request: Request) {
  const authorization = request.headers.get('authorization') ?? ''
  const syncToken = authorization.startsWith('Bearer ')
    ? authorization.slice(7).trim()
    : ''
  if (!/^[a-f0-9]{64}$/i.test(syncToken)) {
    return NextResponse.json(
      { ok: false, error: 'Não autorizado.' },
      { status: 401 },
    )
  }

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
      { status: 400 },
    )
  }

  try {
    const supabase = await createClient()
    const syncTokenHash = createHash('sha256').update(syncToken).digest('hex')
    const { data, error } = await supabase.rpc(
      'record_silentra_platform_payment',
      {
        p_sync_token_hash: syncTokenHash,
        p_event_id: parsed.data.eventId,
        p_amount: parsed.data.amount,
        p_currency: parsed.data.currency.toUpperCase(),
        p_occurred_at: parsed.data.occurredAt,
        p_description: parsed.data.description,
        p_external_reference: parsed.data.externalReference ?? null,
      },
    )

    if (error) {
      const unauthorized = /INTEGRATION_NOT_CONNECTED/i.test(error.message)
      return NextResponse.json(
        {
          ok: false,
          error: unauthorized
            ? 'Integração desligada ou token inválido.'
            : 'O pagamento não pôde ser registado.',
        },
        {
          status: unauthorized ? 401 : 422,
          headers: { 'Cache-Control': 'no-store' },
        },
      )
    }

    return NextResponse.json(
      {
        ok: true,
        created: data?.created === true,
        duplicate: data?.duplicate === true,
      },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Não foi possível registar o pagamento.' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } },
    )
  }
}
