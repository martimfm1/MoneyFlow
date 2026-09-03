'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { normalizeDecimalInput } from '@/lib/number'

const schema = z.object({
  displayName: z.string().trim().max(80).optional(),
  currencyCode: z.string().regex(/^[A-Z]{3}$/),
  accountName: z.string().trim().min(1).max(80),
  accountType: z.enum(['cash', 'bank', 'card', 'savings', 'other']),
  balance: z.coerce.number().finite().gte(0),
})

export async function completeOnboarding(formData: FormData) {
  const parsed = schema.safeParse({
    displayName: formData.get('displayName') || undefined,
    currencyCode: formData.get('currencyCode'),
    accountName: formData.get('accountName'),
    accountType: formData.get('accountType'),
    balance: normalizeDecimalInput(formData.get('balance')),
  })

  if (!parsed.success) redirect('/onboarding?error=Confirma%20os%20dados.')

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      display_name: parsed.data.displayName ?? null,
      currency_code: parsed.data.currencyCode,
      onboarding_completed_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  if (profileError)
    redirect(
      '/onboarding?error=Não%20foi%20possível%20guardar%20a%20preferência.',
    )

  const { error: accountError } = await supabase.from('accounts').insert({
    user_id: user.id,
    name: parsed.data.accountName,
    account_type: parsed.data.accountType,
    balance: parsed.data.balance,
    currency_code: parsed.data.currencyCode,
  })

  if (accountError) {
    await supabase
      .from('profiles')
      .update({ onboarding_completed_at: null })
      .eq('id', user.id)
    redirect('/onboarding?error=Não%20foi%20possível%20criar%20a%20conta.')
  }

  redirect('/dashboard')
}
