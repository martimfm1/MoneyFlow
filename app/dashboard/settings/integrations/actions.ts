'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getFinancialContextBySlug } from '@/lib/financial-context'

export type PairingActionResult =
  | { ok: true; pairingToken: string; expiresAt: string; accountName: string }
  | { ok: false; error: string }

export async function createSilentraIntegrationAccount() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { ok: false as const, error: 'Inicia sessão para continuar.' }

  const context = await getFinancialContextBySlug(supabase, user.id, 'silentra')
  if (!context) {
    return { ok: false as const, error: 'O espaço financeiro Silentra não está disponível.' }
  }

  const { data: existing, error: lookupError } = await supabase
    .from('accounts')
    .select('id')
    .eq('user_id', user.id)
    .eq('context_id', context.id)
    .eq('is_active', true)
    .eq('currency_code', 'EUR')
    .limit(1)

  if (lookupError) {
    return { ok: false as const, error: 'Não foi possível verificar as contas.' }
  }
  if (existing?.length) {
    return { ok: true as const }
  }

  const { error } = await supabase.from('accounts').insert({
    user_id: user.id,
    context_id: context.id,
    name: 'Silentra for Barbers',
    account_type: 'other',
    balance: 0,
    currency_code: 'EUR',
    is_active: true,
  })

  if (error) {
    return { ok: false as const, error: 'Não foi possível criar a conta da plataforma.' }
  }

  revalidatePath('/dashboard/settings/integrations')
  return { ok: true as const }
}

export async function createSilentraPairingCode(
  accountId: string,
): Promise<PairingActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { ok: false, error: 'Inicia sessão para continuar.' }

  const context = await getFinancialContextBySlug(supabase, user.id, 'silentra')
  if (!context) {
    return { ok: false, error: 'O espaço financeiro Silentra não está disponível.' }
  }

  const { data: account, error: accountError } = await supabase
    .from('accounts')
    .select('id, name, currency_code, is_active')
    .eq('id', accountId)
    .eq('user_id', user.id)
    .eq('context_id', context.id)
    .maybeSingle()

  if (accountError || !account || !account.is_active) {
    return { ok: false, error: 'Seleciona uma conta ativa do espaço Silentra.' }
  }
  if (account.currency_code !== 'EUR') {
    return { ok: false, error: 'A ligação da plataforma utiliza uma conta em EUR.' }
  }

  const { data, error } = await supabase.rpc('issue_silentra_pairing_token', {
    p_account_id: account.id,
  })

  if (error || !Array.isArray(data) || !data[0]?.pairing_token) {
    return {
      ok: false,
      error: 'Não foi possível gerar o código de ligação. Tenta novamente.',
    }
  }

  revalidatePath('/dashboard/settings/integrations')
  return {
    ok: true,
    pairingToken: data[0].pairing_token as string,
    expiresAt: data[0].expires_at as string,
    accountName: account.name,
  }
}

export async function disconnectSilentraPlatform() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { ok: false as const, error: 'Inicia sessão para continuar.' }

  const { error } = await supabase.rpc('disconnect_silentra_integration')
  if (error) {
    return { ok: false as const, error: 'Não foi possível desligar a integração.' }
  }

  revalidatePath('/dashboard/settings/integrations')
  return { ok: true as const }
}
