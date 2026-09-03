'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { normalizeDecimalInput } from '@/lib/number'
import { logger } from '@/lib/logger'

export type AccountActionState = {
  error?: string
}

const schema = z.object({
  name: z.string().trim().min(1).max(80),
  accountType: z.enum(['cash', 'bank', 'card', 'savings', 'other']),
  balance: z.coerce.number().finite().safe().gte(0),
})

export async function createAccount(
  _previousState: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  const parsed = schema.safeParse({
    name: formData.get('name'),
    accountType: formData.get('accountType'),
    balance: normalizeDecimalInput(formData.get('balance')),
  })

  if (!parsed.success) return { error: 'Confirma os dados da conta.' }

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
    return { error: 'Não foi possível ler a moeda da conta.' }
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
    return { error: error.message || 'Não foi possível criar a conta.' }
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/accounts')
  revalidatePath('/dashboard/transactions')
  redirect('/dashboard/accounts?toast=Conta%20criada.')
}
