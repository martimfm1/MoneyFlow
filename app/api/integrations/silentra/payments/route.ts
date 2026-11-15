import { createHash } from 'node:crypto'
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type PaymentEvent = {
  eventId?: unknown
  amount?: unknown
  currency?: unknown
  occurredAt?: unknown
  description?: unknown
  externalReference?: unknown
}

export async function POST(request: Request) {
  const authorization = request.headers.get('authorization') ?? ''
  const match = authorization.match(/^Bearer ([a-f0-9]{64})$/i)
  if (!match) {
    return NextResponse.json({ ok: false, error: 'Credencial inválida.' }, { status: 401 })
  }

  const body = (await request.json().catch(() => null)) as PaymentEvent | null
  const eventId = typeof body?.eventId === 'string' ? body.eventId.trim() : ''
  const amount = typeof body?.amount === 'number' ? body.amount : Number.NaN
  const currency = typeof body?.currency === 'string' ? body.currency.toUpperCase() : ''
  const occurredAt =
    typeof body?.occurredAt === 'string' && Number.isFinite(Date.parse(body.occurredAt))
      ? new Date(body.occurredAt).toISOString()
      : null
  const description =
    typeof body?.description === 'string' ? body.description.trim().slice(0, 120) : ''
  const externalReference =
    typeof body?.externalReference === 'string'
      ? body.externalReference.trim().slice(0, 120)
      : null

  if (
    !eventId ||
    eventId.length > 160 ||
    !Number.isFinite(amount) ||
    amount <= 0 ||
    amount > 100000000 ||
    currency !== 'EUR' ||
    !occurredAt
  ) {
    return NextResponse.json({ ok: false, error: 'Dados do pagamento inválidos.' }, { status: 400 })
  }

  const tokenHash = createHash('sha256').update(match[1].toLowerCase()).digest('hex')
  const admin = createAdminClient()
  const { data, error } = await admin.rpc('record_silentra_platform_payment', {
    p_sync_token_hash: tokenHash,
    p_event_id: eventId,
    p_amount: amount,
    p_currency: currency,
    p_occurred_at: occurredAt,
    p_description: description || 'Subscrição Silentra for Barbers',
    p_external_reference: externalReference,
  })

  if (error) {
    const message = error.message ?? ''
    const unauthorized = /SILENTRA_INTEGRATION_NOT_CONNECTED/.test(message)
    return NextResponse.json({
      ok: false,
      error: unauthorized ? 'A integração já não está ligada.' : 'Não foi possível registar o pagamento.',
    }, { status: unauthorized ? 401 : 400 })
  }

  return NextResponse.json(data ?? { ok: true }, {
    headers: { 'Cache-Control': 'no-store' },
  })
}
