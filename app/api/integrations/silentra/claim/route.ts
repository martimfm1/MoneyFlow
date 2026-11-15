import { createHash } from 'node:crypto'
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { pairingToken?: unknown } | null
  const pairingToken =
    typeof body?.pairingToken === 'string' ? body.pairingToken.trim().toLowerCase() : ''

  if (!/^[a-f0-9]{64}$/.test(pairingToken)) {
    return NextResponse.json({ ok: false, error: 'Código de ligação inválido.' }, { status: 400 })
  }

  const tokenHash = createHash('sha256').update(pairingToken).digest('hex')
  const admin = createAdminClient()
  const { data, error } = await admin.rpc('claim_silentra_pairing', {
    p_token_hash: tokenHash,
  })

  if (error) {
    const status = /PAIRING_TOKEN_EXPIRED_OR_INVALID/.test(error.message ?? '') ? 410 : 400
    return NextResponse.json({
      ok: false,
      error: status === 410
        ? 'O código expirou ou já foi utilizado. Gera um novo no MoneyFlow.'
        : 'Não foi possível concluir a ligação.',
    }, { status })
  }

  const connection = Array.isArray(data) ? data[0] : data
  if (!connection?.sync_token) {
    return NextResponse.json({ ok: false, error: 'A ligação não devolveu uma credencial válida.' }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    accountName: connection.account_name,
    currencyCode: connection.currency_code,
    syncToken: connection.sync_token,
  }, { headers: { 'Cache-Control': 'no-store' } })
}
