import { createHash, randomBytes } from 'node:crypto'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getFinancialContext } from '@/lib/financial-context'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const schema = z.object({ accountId: z.uuid() })

function sameOrigin(request: Request) {
  const origin = request.headers.get('origin')
  return !origin || origin === new URL(request.url).origin
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) {
    return NextResponse.json(
      { ok: false, error: 'Pedido inválido.' },
      { status: 403 },
    )
  }

  const body = await request.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: 'Seleciona uma conta válida.' },
      { status: 400 },
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

  const context = await getFinancialContext(supabase, user.id)
  if (!context) {
    return NextResponse.json(
      { ok: false, error: 'O espaço financeiro não está disponível.' },
      { status: 404 },
    )
  }

  const { data: account } = await supabase
    .from('accounts')
    .select('id, name, currency_code, is_active')
    .eq('id', parsed.data.accountId)
    .eq('user_id', user.id)
    .eq('context_id', context.id)
    .maybeSingle()

  if (!account || !account.is_active || account.currency_code !== 'EUR') {
    return NextResponse.json(
      {
        ok: false,
        error: 'Escolhe uma conta ativa em EUR.',
      },
      { status: 400 },
    )
  }

  const pairingToken = randomBytes(32).toString('hex')
  const tokenHash = createHash('sha256').update(pairingToken).digest('hex')
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString()

  const { error } = await supabase
    .from('moneyflow_integration_pairings')
    .insert({
      user_id: user.id,
      context_id: context.id,
      account_id: account.id,
      token_hash: tokenHash,
      expires_at: expiresAt,
    })

  if (error) {
    return NextResponse.json(
      { ok: false, error: 'Não foi possível gerar o código de ligação.' },
      { status: 500 },
    )
  }

  return NextResponse.json(
    { ok: true, pairingToken, expiresAt, accountName: account.name },
    { headers: { 'Cache-Control': 'no-store, private', Pragma: 'no-cache' } },
  )
}
