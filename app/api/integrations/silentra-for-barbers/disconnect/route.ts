import { randomBytes, createHash } from 'node:crypto'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const authorization = request.headers.get('authorization') ?? ''
  const syncToken = authorization.startsWith('Bearer ')
    ? authorization.slice(7).trim()
    : ''

  if (syncToken) {
    if (!/^[a-f0-9]{64}$/i.test(syncToken)) {
      return NextResponse.json(
        { ok: false, error: 'Não autorizado.' },
        { status: 401 },
      )
    }
    try {
      const admin = createAdminClient()
      const syncTokenHash = createHash('sha256').update(syncToken).digest('hex')
      const { data, error } = await admin.rpc(
        'disconnect_silentra_integration',
        {
          p_sync_token_hash: syncTokenHash,
        },
      )
      if (error || data !== true) {
        return NextResponse.json(
          { ok: false, error: 'Token inválido ou integração já desligada.' },
          { status: 401 },
        )
      }
      return NextResponse.json(
        { ok: true },
        { headers: { 'Cache-Control': 'no-store' } },
      )
    } catch {
      return NextResponse.json(
        { ok: false, error: 'Não foi possível desligar a integração.' },
        { status: 500 },
      )
    }
  }

  const origin = request.headers.get('origin')
  if (origin && origin !== new URL(request.url).origin) {
    return NextResponse.json(
      { ok: false, error: 'Pedido inválido.' },
      { status: 403 },
    )
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json(
      { ok: false, error: 'Inicia sessão para continuar.' },
      { status: 401 },
    )
  }

  try {
    const admin = createAdminClient()
    const replacementHash = createHash('sha256')
      .update(randomBytes(32))
      .digest('hex')
    const { error } = await admin
      .from('moneyflow_integrations')
      .update({
        status: 'disconnected',
        token_hash: replacementHash,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)
      .eq('provider', 'silentra-for-barbers')
      .eq('status', 'connected')

    if (error) throw error
    return NextResponse.json(
      { ok: true },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Não foi possível desligar a integração.' },
      { status: 500 },
    )
  }
}
