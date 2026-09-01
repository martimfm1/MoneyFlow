'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const schema = z.object({
  currencyCode: z.enum(['EUR', 'USD', 'GBP']),
  accountName: z.string().trim().min(1).max(80),
  accountType: z.enum(['cash', 'bank', 'card', 'savings', 'other']),
  balance: z.coerce.number().finite(),
})

export async function completeOnboarding(formData: FormData) {
  const parsed = schema.safeParse({
    currencyCode: formData.get('currencyCode'),
    accountName: formData.get('accountName'),
    accountType: formData.get('accountType'),
    balance: formData.get('balance'),
  })

  if (!parsed.success) redirect('/onboarding?error=Confirma%20os%20dados.')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { error: profileError } = await supabase
    .from('profiles')
    .update({ currency_code: parsed.data.currencyCode })
    .eq('id', user.id)

  if (profileError) redirect('/onboarding?error=Não%20foi%20possível%20guardar%20a%20preferência.')

  const { error: accountError } = await supabase.from('accounts').insert({
    user_id: user.id,
    name: parsed.data.accountName,
    account_type: parsed.data.accountType,
    balance: parsed.data.balance,
    currency_code: parsed.data.currencyCode,
  })

  if (accountError) redirect('/onboarding?error=Não%20foi%20possível%20criar%20a%20conta.')
  redirect('/dashboard')
}
