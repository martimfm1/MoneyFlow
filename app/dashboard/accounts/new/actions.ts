'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const schema = z.object({
  name: z.string().trim().min(1).max(80),
  accountType: z.enum(['cash', 'bank', 'card', 'savings', 'other']),
  balance: z.coerce.number().finite().safe(),
})

export async function createAccount(formData: FormData) {
  const parsed = schema.safeParse({
    name: formData.get('name'),
    accountType: formData.get('accountType'),
    balance: formData.get('balance'),
  })

  if (!parsed.success) redirect('/dashboard/accounts/new?error=Dados%20inválidos.')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('currency_code').eq('id', user.id).maybeSingle()
  const { error } = await supabase.from('accounts').insert({
    user_id: user.id,
    name: parsed.data.name,
    account_type: parsed.data.accountType,
    balance: parsed.data.balance,
    currency_code: profile?.currency_code ?? 'EUR',
  })

  if (error) redirect('/dashboard/accounts/new?error=Não%20foi%20possível%20criar%20a%20conta.')
  redirect('/dashboard')
}
