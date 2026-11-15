import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import type { SupabaseClient } from '@supabase/supabase-js'

export const FINANCIAL_CONTEXT_COOKIE = 'moneyflow-financial-context'
export const FINANCIAL_CONTEXT_MAX_AGE = 365 * 24 * 60 * 60

export type FinancialContextSlug = 'personal' | 'silentra'
export type FinancialContextSelection = FinancialContextSlug | 'general'

export type FinancialContext = {
  id: string
  user_id: string
  slug: FinancialContextSlug
  name: string
  context_type: 'personal' | 'business'
  currency_code: string
}

export function normalizeFinancialContextSlug(
  value: string | undefined | null,
): FinancialContextSlug {
  return value === 'silentra' ? 'silentra' : 'personal'
}

export async function getSelectedFinancialContextSlug(): Promise<FinancialContextSlug> {
  const cookieStore = await cookies()
  return normalizeFinancialContextSlug(
    cookieStore.get(FINANCIAL_CONTEXT_COOKIE)?.value,
  )
}

export async function getFinancialContextSelection(
  supabase: SupabaseClient,
  userId: string,
): Promise<FinancialContextSelection> {
  const { data, error } = await supabase
    .from('profiles')
    .select('active_finance_context')
    .eq('id', userId)
    .maybeSingle()

  if (error || !data) {
    throw new Error('Não foi possível carregar o espaço financeiro ativo.')
  }

  if (data.active_finance_context === 'general') return 'general'
  return normalizeFinancialContextSlug(data.active_finance_context)
}

export async function getFinancialContext(
  supabase: SupabaseClient,
  userId: string,
): Promise<FinancialContext> {
  const slug = await getFinancialContextSelection(supabase, userId)
  if (slug === 'general') redirect('/dashboard/overview')

  const { data, error } = await supabase
    .from('financial_contexts')
    .select('id, user_id, slug, name, context_type, currency_code')
    .eq('user_id', userId)
    .eq('slug', slug)
    .maybeSingle()

  if (error || !data) {
    throw new Error('Não foi possível carregar o espaço financeiro ativo.')
  }

  return data as FinancialContext
}

export async function getFinancialContextBySlug(
  supabase: SupabaseClient,
  userId: string,
  slug: FinancialContextSlug,
): Promise<FinancialContext | null> {
  const { data, error } = await supabase
    .from('financial_contexts')
    .select('id, user_id, slug, name, context_type, currency_code')
    .eq('user_id', userId)
    .eq('slug', slug)
    .maybeSingle()

  if (error) return null
  return (data as FinancialContext | null) ?? null
}
