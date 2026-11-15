import { timingSafeEqual } from 'node:crypto'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 10

function isAuthorized(request: Request, secret: string) {
  const header = request.headers.get('authorization')
  if (!header?.startsWith('Bearer ')) return false

  const provided = Buffer.from(header.slice(7))
  const expected = Buffer.from(secret)
  return (
    provided.length === expected.length && timingSafeEqual(provided, expected)
  )
}

export async function GET(request: Request) {
  const secret = process.env.MONEYFLOW_RECURRING_CRON_SECRET
  if (!secret) {
    return NextResponse.json(
      { error: 'A automatização recorrente ainda não está configurada.' },
      { status: 503 },
    )
  }

  if (!isAuthorized(request, secret)) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  const supabase = await createClient()
  const { data, error } = await supabase.rpc(
    'process_due_recurring_transactions',
    {
      p_cron_secret: secret,
      p_batch_size: 500,
    },
  )

  if (error) {
    console.error('moneyflow.recurring_processing_failed', {
      code: error.code ?? 'unknown',
    })
    return NextResponse.json(
      { error: 'Não foi possível processar as recorrências.' },
      { status: 500 },
    )
  }

  return NextResponse.json(
    { ok: true, result: data },
    { headers: { 'Cache-Control': 'no-store, private' } },
  )
}
