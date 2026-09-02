'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const updateSchema = z.object({
  id: z.uuid(),
  transactionType: z.enum(['income', 'expense']),
  amount: z.coerce.number().finite().positive(),
  accountId: z.uuid(),
  categoryId: z.union([z.uuid(), z.literal('')]).optional(),
  description: z.string().trim().max(120).optional().or(z.literal('')),
  occurredAt: z.string().date(),
})

const deleteSchema = z.object({ id: z.uuid() })

async function getUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return { supabase, user }
}

export async function updateTransaction(formData: FormData) {
  const parsed = updateSchema.safeParse({
    id: formData.get('id'),
    transactionType: formData.get('transactionType'),
    amount: formData.get('amount'),
    accountId: formData.get('accountId'),
    categoryId: formData.get('categoryId'),
    description: formData.get('description') || '',
    occurredAt: formData.get('occurredAt'),
  })

  if (!parsed.success)
    redirect(
      `/dashboard/transactions/${formData.get('id')}/edit?error=Dados%20inválidos.`,
    )

  const { supabase, user } = await getUser()

  const [{ data: transaction }, { data: account }] = await Promise.all([
    supabase
      .from('transactions')
      .select('id')
      .eq('id', parsed.data.id)
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase
      .from('accounts')
      .select('id')
      .eq('id', parsed.data.accountId)
      .eq('user_id', user.id)
      .maybeSingle(),
  ])

  if (!transaction)
    redirect('/dashboard/transactions?error=Movimento%20inválido.')
  if (!account)
    redirect(
      `/dashboard/transactions/${parsed.data.id}/edit?error=Conta%20inválida.`,
    )

  const categoryId = parsed.data.categoryId || null
  if (categoryId) {
    const { data: category } = await supabase
      .from('categories')
      .select('id')
      .eq('id', categoryId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!category)
      redirect(
        `/dashboard/transactions/${parsed.data.id}/edit?error=Categoria%20inválida.`,
      )
  }

  const { error } = await supabase
    .from('transactions')
    .update({
      account_id: parsed.data.accountId,
      category_id: categoryId,
      transaction_type: parsed.data.transactionType,
      amount: parsed.data.amount,
      description: parsed.data.description || null,
      occurred_at: parsed.data.occurredAt,
      updated_at: new Date().toISOString(),
    })
    .eq('id', parsed.data.id)
    .eq('user_id', user.id)

  if (error)
    redirect(
      `/dashboard/transactions/${parsed.data.id}/edit?error=Não%20foi%20possível%20atualizar%20o%20movimento.`,
    )

  redirect('/dashboard/transactions')
}

export async function deleteTransaction(formData: FormData) {
  const parsed = deleteSchema.safeParse({ id: formData.get('id') })
  if (!parsed.success)
    redirect('/dashboard/transactions?error=Movimento%20inválido.')

  const { supabase, user } = await getUser()
  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', parsed.data.id)
    .eq('user_id', user.id)

  if (error)
    redirect(
      '/dashboard/transactions?error=Não%20foi%20possível%20eliminar%20o%20movimento.',
    )

  redirect('/dashboard/transactions')
}
