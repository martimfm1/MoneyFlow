'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const schema = z.object({
  transactionType: z.enum(['income', 'expense']),
  amount: z.coerce.number().finite().positive(),
  accountId: z.uuid(),
  description: z.string().trim().max(120).optional(),
  occurredAt: z.string().date(),
})

export async function createTransaction(formData: FormData) {
  const parsed = schema.safeParse({
    transactionType: formData.get('transactionType'),
    amount: formData.get('amount'),
    accountId: formData.get('accountId'),
    description: formData.get('description') || undefined,
    occurredAt: formData.get('occurredAt'),
  })

  if (!parsed.success) redirect('/dashboard/transactions/new?error=Dados%20inválidos.')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: account } = await supabase.from('accounts').select('id').eq('id', parsed.data.accountId).eq('user_id', user.id).maybeSingle()
  if (!account) redirect('/dashboard/transactions/new?error=Conta%20inválida.')

  const { error } = await supabase.from('transactions').insert({
    user_id: user.id,
    account_id: parsed.data.accountId,
    transaction_type: parsed.data.transactionType,
    amount: parsed.data.amount,
    description: parsed.data.description ?? null,
    occurred_at: parsed.data.occurredAt,
  })

  if (error) redirect('/dashboard/transactions/new?error=Não%20foi%20possível%20guardar%20o%20movimento.')
  redirect('/dashboard')
}
