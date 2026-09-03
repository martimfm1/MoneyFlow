'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { normalizeDecimalInput } from '@/lib/number'
import { logger } from '@/lib/logger'

const schema = z.object({
  name: z.string().trim().min(1).max(80),
  accountType: z.enum(['cash', 'bank', 'card', 'savings', 'other']),
  balance: z.coerce.number().finite().safe().gte(0),
})

export async function createAccount(formData: FormData) {
  const parsed = schema.safeParse({
    name: formData.get('name'),
    accountType: formData.get('accountType'),
    balance: normalizeDecimalInput(formData.get('balance')),
  })

  if (!parsed.success) {
    redirect('/dashboard/accounts/new?error=Confirma%20os%20dados%20da%20conta.')
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('currency_code')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError) {
    logger.error('account_create_profile_failed', {
      code: profileError.code,
      message: profileError.message,
      details: profileError.details,
      hint: profileError.hint,
    })
    redirect(
      '/dashboard/accounts/new?error=Não%20foi%20possível%20ler%20a%20moeda%20da%20conta.%20Tenta%20novamente.',
    )
  }

  const { error } = await supabase.from('accounts').insert({
    user_id: user.id,
    name: parsed.data.name,
    account_type: parsed.data.accountType,
    balance: parsed.data.balance,
    currency_code: profile?.currency_code ?? 'EUR',
  })

  if (error) {
    logger.error('account_create_failed', {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    })
    redirect(
      `/dashboard/accounts/new?error=${encodeURIComponent(error.message || 'Não foi possível criar a conta.')}`,
    )
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/accounts')
  revalidatePath('/dashboard/transactions')
  redirect('/dashboard/accounts?toast=Conta%20criada.')
}
