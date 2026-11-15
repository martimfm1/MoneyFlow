import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type PlatformPaymentPayload = {
  eventId?: unknown
  amount?: unknown
  currency?: unknown
  occurredAt?: unknown
  description?: unknown
  externalReference?: unknown
}

function bearerToken(request: Request) {
  const header = request.headers.get('authorization')
  if (!header?.startsWith('Bearer ')) return null
  const token = header.slice(7).trim()
  return token.length >= 40 && token.length <= 100 ? token : null
}

export async function POST(request: Request) {
  const syncToken = bearerToken(request)
  if (!syncToken) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  let payload: PlatformPaymentPayload
  try {
    payload = (await request.json()) as PlatformPaymentPayload
  } catch {
    return NextResponse.json({ error: 'Pedido inválido.' }, { status: 400 })
  }

  const eventId = typeof payload.eventId === 'string' ? payload.eventId.trim() : ''
  const amount = Number(payload.amount)
  const currency =
    typeof payload.currency === 'string' ? payload.currency.toUpperCase() : ''
  const occurredAt =
    typeof payload.occurredAt === 'string' ? new Date(payload.occurredAt) : null
  const description =
    typeof payload.description === 'string' ? payload.description.trim() : ''
  const externalReference =
    typeof payload.externalReference === 'string'
      ? payload.externalReference.trim().slice(0, 120)
      : null

  if (
    !eventId ||
    eventId.length > 200 ||
    !Number.isFinite(amount) ||
    amount <= 0 ||
    amount > 1_000_000 ||
    !/^[A-Z]{3}$/.test(currency) ||
    !occurredAt ||
    Number.isNaN(occurredAt.getTime()) ||
    !description ||
    description.length > 160
  ) {
    return NextResponse.json(
      { error: 'Os dados do pagamento não são válidos.' },
      { status: 400 },
    )
  }

  const supabase = await createClient()
  const { data, error } = await supabase.rpc(
    'record_silentra_platform_payment',
    {
      p_sync_token: syncToken,
      p_event_id: eventId,
      p_amount: Math.round(amount * 100) / 100,
      p_currency: currency,
      p_occurred_at: occurredAt.toISOString(),
      p_description: description,
      p_external_reference: externalReference,
    },
  )

  if (error) {
    const unauthorized =
      error.message.includes('INTEGRATION_NOT_CONNECTED') ||
      error.message.includes('INVALID_INTEGRATION_TOKEN')
    const status = unauthorized ? 401 : 422
    return NextResponse.json(
      { error: unauthorized ? 'Integração desligada ou token inválido.' : 'O pagamento não pôde ser registado.' },
      { status },
    )
  }

  return NextResponse.json(
    { ok: true, duplicate: data?.duplicate === true },
    { headers: { 'Cache-Control': 'no-store, private' } },
  )
}
