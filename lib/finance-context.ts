import 'server-only'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

/**
 * Stops mutating routes from rendering when the user is viewing the combined
 * finance context. The database RLS policies remain the final enforcement layer.
 */
export async function redirectIfGeneralFinanceContext() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('active_finance_context')
    .eq('id', user.id)
    .maybeSingle()

  if (profile?.active_finance_context === 'general') {
    redirect('/dashboard?error=O%20contexto%20Geral%20%C3%A9%20apenas%20de%20leitura.')
  }
}
