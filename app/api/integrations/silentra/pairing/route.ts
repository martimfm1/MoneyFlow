import { createHash, randomBytes } from 'node:crypto'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const PROVIDER = 'silentra-for-barbers'
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

async function currentUser() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) return { supabase, user: null }
  return { supabase, user }
}

export async function GET() {
  const { supabase, user } = await currentUser()
  if (!user) {
    return NextResponse.json({ ok: false, error: 'Sessão não iniciada.' }, { status: 401 })
  }

  const { data: connection, error } = await supabase
    .from('moneyflow_integrations')
    .select('id, account_id, status, connected_at, last_synced_at')
    .eq('user_id', user.id)
    .eq('provider', PROVIDER)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ ok: false, error: 'Não foi possível consultar a ligação.' }, { status: 500 })
  }

  if (!connection || connection.status !== 'connected') {
    return NextResponse.json({ ok: true, connected: false })
  }

  const { data: account } = await supabase
    .from('accounts')
    .select('name, currency_code')
    .eq('id', connection.account_id)
    .eq('user_id', user.id)
    .maybeSingle()

  return NextResponse.json({
    ok: true,
    connected: true,
    accountName: account?.name ?? null,
    currencyCode: account?.currency_code ?? null,
    connectedAt: connection.connected_at,
    lastSyncedAt: connection.last_synced_at,
  }, { headers: { 'Cache-Control': 'no-store' } })
}

export async function POST(request: Request) {
  const { supabase, user } = await currentUser()
  if (!user) {
    return NextResponse.json({ ok: false, error: 'Sessão não iniciada.' }, { status: 401 })
  }

  const body = (await request.json().catch(() => null)) as { accountId?: unknown } | null
  const accountId = typeof body?.accountId === 'string' ? body.accountId : ''
  if (!UUID_PATTERN.test(accountId)) {
    return NextResponse.json({ ok: false, error: 'Seleciona uma conta válida.' }, { status: 400 })
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('active_finance_context')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError || profile?.active_finance_context !== 'silentra') {
    return NextResponse.json({
      ok: false,
      error: 'Muda primeiro para o contexto financeiro Silentra no seletor do MoneyFlow.',
    }, { status: 409 })
  }

  const { data: context, error: contextError } = await supabase
    .from('financial_contexts')
    .select('id')
    .eq('user_id', user.id)
    .eq('slug', 'silentra')
    .maybeSingle()

  if (contextError || !context) {
    return NextResponse.json({ ok: false, error: 'O contexto Silentra não está disponível.' }, { status: 409 })
  }

  const { data: account, error: accountError } = await supabase
    .from('accounts')
    .select('id')
    .eq('id', accountId)
    .eq('user_id', user.id)
    .eq('context_id', context.id)
    .eq('currency_code', 'EUR')
    .eq('is_active', true)
    .maybeSingle()

  if (accountError || !account) {
    return NextResponse.json({
      ok: false,
      error: 'A conta tem de estar ativa, pertencer ao contexto Silentra e usar EUR.',
    }, { status: 400 })
  }

  const pairingToken = randomBytes(32).toString('hex')
  const tokenHash = createHash('sha256').update(pairingToken).digest('hex')
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString()

  const { error: insertError } = await supabase
    .from('moneyflow_integration_pairings')
    .insert({
      user_id: user.id,
      context_id: context.id,
      account_id: account.id,
      token_hash: tokenHash,
      expires_at: expiresAt,
    })

  if (insertError) {
    return NextResponse.json({ ok: false, error: 'Não foi possível gerar o código de ligação.' }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    pairingToken,
    expiresAt,
  }, { headers: { 'Cache-Control': 'no-store' } })
}

export async function DELETE() {
  const { supabase, user } = await currentUser()
  if (!user) {
    return NextResponse.json({ ok: false, error: 'Sessão não iniciada.' }, { status: 401 })
  }

  const admin = createAdminClient()
  const { data: connection, error: lookupError } = await admin
    .from('moneyflow_integrations')
    .select('token_hash')
    .eq('user_id', user.id)
    .eq('provider', PROVIDER)
    .eq('status', 'connected')
    .maybeSingle()

  if (lookupError) {
    return NextResponse.json({ ok: false, error: 'Não foi possível consultar a ligação.' }, { status: 500 })
  }
  if (!connection) {
    return NextResponse.json({ ok: true, connected: false })
  }

  const { data: disconnected, error } = await admin.rpc('disconnect_silentra_integration', {
    p_sync_token_hash: connection.token_hash,
  })

  if (error || disconnected !== true) {
    return NextResponse.json({ ok: false, error: 'Não foi possível desligar a integração.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, connected: false })
}
