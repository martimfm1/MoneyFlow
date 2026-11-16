import type { SupabaseClient } from '@supabase/supabase-js'

export type FinancialContext = {
  id: string
  user_id: string
  slug: 'personal'
  name: string
  context_type: 'personal'
  currency_code: string
}

export async function getFinancialContext(
  supabase: SupabaseClient,
  userId: string,
): Promise<FinancialContext> {
  const context = await getFinancialContextBySlug(supabase, userId, 'personal')
  if (!context) {
    throw new Error('Não foi possível carregar o espaço financeiro.')
  }
  return context
}

export async function getFinancialContextBySlug(
  supabase: SupabaseClient,
  userId: string,
  slug: 'personal',
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
