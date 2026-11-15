import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  let payload: { pairingToken?: unknown }

  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: 'Pedido inválido.' }, { status: 400 })
  }

  const pairingToken = payload.pairingToken
  if (
    typeof pairingToken !== 'string' ||
    pairingToken.length < 40 ||
    pairingToken.length > 100
  ) {
    return NextResponse.json({ error: 'Código de ligação inválido.' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data, error } = await supabase.rpc('consume_silentra_pairing_token', {
    p_pairing_token: pairingToken,
  })

  if (error || !Array.isArray(data) || !data[0]?.sync_token) {
    return NextResponse.json(
      { error: 'O código expirou, já foi utilizado ou não é válido.' },
      { status: 401 },
    )
  }

  const connection = data[0]
  return NextResponse.json(
    {
      connected: true,
      syncToken: connection.sync_token as string,
      accountName: connection.account_name as string,
      currencyCode: connection.currency_code as string,
      connectedAt: new Date().toISOString(),
    },
    {
      headers: {
        'Cache-Control': 'no-store, private',
        Pragma: 'no-cache',
      },
    },
  )
}
