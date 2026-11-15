import { createHash } from 'node:crypto'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const schema = z.object({ pairingToken: z.string().regex(/^[a-f0-9]{64}$/i) })

export async function POST(request: Request) {
  if (Number(request.headers.get('content-length') ?? 0) > 4096) {
    return NextResponse.json({ ok: false, error: 'Pedido demasiado grande.' }, { status: 413 })
  }

  const body = await request.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'Código de ligação inválido.' }, { status: 400 })
  }

  try {
    const admin = createAdminClient()
    const tokenHash = createHash('sha256').update(parsed.data.pairingToken).digest('hex')
    const { data, error } = await admin.rpc('claim_silentra_pairing', {
      p_token_hash: tokenHash,
    })

    if (error || !Array.isArray(data) || !data[0]?.sync_token) {
      return NextResponse.json(
        { ok: false, error: 'O código expirou, já foi utilizado ou não é válido.' },
        { status: 401, headers: { 'Cache-Control': 'no-store' } },
      )
    }

    return NextResponse.json(
      {
        ok: true,
        syncToken: data[0].sync_token,
        accountName: data[0].account_name,
        currencyCode: data[0].currency_code,
        connectedAt: new Date().toISOString(),
      },
      { headers: { 'Cache-Control': 'no-store, private', Pragma: 'no-cache' } },
    )
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Não foi possível concluir a ligação.' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } },
    )
  }
}
