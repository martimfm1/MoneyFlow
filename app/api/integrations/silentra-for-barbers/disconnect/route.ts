import { createHash } from 'node:crypto'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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
      const supabase = await createClient()
      const syncTokenHash = createHash('sha256').update(syncToken).digest('hex')
      const { data, error } = await supabase.rpc(
        'disconnect_silentra_integration',
        { p_sync_token_hash: syncTokenHash },
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
    const { data, error } = await supabase.rpc(
      'disconnect_own_silentra_integration',
    )

    if (error || data !== true) {
      return NextResponse.json(
        { ok: false, error: 'Não existe uma integração ativa para desligar.' },
        { status: 404 },
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
