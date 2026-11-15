import { createHash, randomBytes } from 'node:crypto'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const bodySchema = z.object({
  accountId: z.uuid(),
})

function sameOrigin(request: Request) {
  const origin = request.headers.get('origin')
  return !origin || origin === new URL(request.url).origin
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) {
    return NextResponse.json({ ok: false, error: 'Pedido inválido.' }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  const parsed = bodySchema.safeParse(body)
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

  const pairingToken = randomBytes(32).toString('hex')
  const tokenHash = createHash('sha256').update(pairingToken).digest('hex')
  const { data: expiresAt, error } = await supabase.rpc(
    'create_silentra_pairing',
    {
      p_account_id: parsed.data.accountId,
      p_token_hash: tokenHash,
    },
  )

  if (error || !expiresAt) {
    return NextResponse.json(
      {
        ok: false,
        error:
          'Não foi possível gerar o código. Confirma que escolheste uma conta ativa em EUR no espaço Silentra.',
      },
      { status: 400 },
    )
  }

  return NextResponse.json(
    { ok: true, pairingToken, expiresAt },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}

export async function DELETE(request: Request) {
  if (!sameOrigin(request)) {
    return NextResponse.json({ ok: false, error: 'Pedido inválido.' }, { status: 403 })
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

  const { error } = await supabase.rpc('disconnect_silentra_integration')
  if (error) {
    return NextResponse.json(
      { ok: false, error: 'Não foi possível desligar a integração.' },
      { status: 500 },
    )
  }

  return NextResponse.json(
    { ok: true },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
