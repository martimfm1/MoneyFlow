import { randomBytes, createHash } from 'node:crypto'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const origin = request.headers.get('origin')
  if (origin && origin !== new URL(request.url).origin) {
    return NextResponse.json({ ok: false, error: 'Pedido inválido.' }, { status: 403 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ ok: false, error: 'Inicia sessão para continuar.' }, { status: 401 })
  }

  try {
    const admin = createAdminClient()
    const replacementHash = createHash('sha256').update(randomBytes(32)).digest('hex')
    const { error } = await admin
      .from('moneyflow_integrations')
      .update({ status: 'disconnected', token_hash: replacementHash, updated_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('provider', 'silentra-for-barbers')
      .eq('status', 'connected')

    if (error) throw error
    return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } })
  } catch {
    return NextResponse.json({ ok: false, error: 'Não foi possível desligar a integração.' }, { status: 500 })
  }
}
