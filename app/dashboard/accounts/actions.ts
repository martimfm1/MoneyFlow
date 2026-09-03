'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

export type AccountActionState = {
  error?: string
}

const toggleSchema = z.object({
  id: z.uuid(),
  isActive: z.enum(['true', 'false']),
})

const updateSchema = z.object({
  id: z.uuid(),
  name: z.string().trim().min(1).max(80),
  accountType: z.enum(['cash', 'bank', 'card', 'savings', 'other']),
})

const deleteSchema = z.object({ id: z.uuid() })

export async function toggleAccountStatus(formData: FormData) {
  const parsed = toggleSchema.safeParse({
    id: formData.get('id'),
    isActive: formData.get('isActive'),
  })
  if (!parsed.success) redirect('/dashboard/accounts?error=Conta%20inválida.')

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { error } = await supabase
    .from('accounts')
    .update({ is_active: parsed.data.isActive === 'true' })
    .eq('id', parsed.data.id)
    .eq('user_id', user.id)

  if (error)
    redirect('/dashboard/accounts?error=Não%20foi%20possível%20atualizar%20a%20conta.')

  redirect('/dashboard/accounts?toast=Conta%20atualizada.')
}

export async function updateAccount(formData: FormData) {
  const parsed = updateSchema.safeParse({
    id: formData.get('id'),
    name: formData.get('name'),
    accountType: formData.get('accountType'),
  })
  if (!parsed.success)
    redirect(`/dashboard/accounts/${formData.get('id')}/edit?error=Dados%20inválidos.`)

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { error } = await supabase
    .from('accounts')
    .update({
      name: parsed.data.name,
      account_type: parsed.data.accountType,
      updated_at: new Date().toISOString(),
    })
    .eq('id', parsed.data.id)
    .eq('user_id', user.id)

  if (error)
    redirect(
      `/dashboard/accounts/${parsed.data.id}/edit?error=Não%20foi%20possível%20atualizar%20a%20conta.`,
    )

  redirect('/dashboard/accounts?toast=Conta%20atualizada.')
}

export async function deleteAccount(
  _previousState: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  const parsed = deleteSchema.safeParse({ id: formData.get('id') })
  if (!parsed.success) return { error: 'Conta inválida.' }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: account, error: accountError } = await supabase
    .from('accounts')
    .select('id')
    .eq('id', parsed.data.id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (accountError)
    return { error: 'Não foi possível verificar a conta.' }
  if (!account) return { error: 'Conta não encontrada.' }

  const { count, error: countError } = await supabase
    .from('transactions')
    .select('id', { count: 'exact', head: true })
    .eq('account_id', parsed.data.id)
    .eq('user_id', user.id)

  if (countError) return { error: 'Não foi possível verificar os movimentos.' }

  if ((count ?? 0) > 0)
    return { error: 'Esta conta tem movimentos. Arquiva-a em vez de a apagar.' }

  const { error } = await supabase
    .from('accounts')
    .delete()
    .eq('id', parsed.data.id)
    .eq('user_id', user.id)

  if (error) return { error: error.message || 'Não foi possível apagar a conta.' }

  redirect('/dashboard/accounts?toast=Conta%20apagada.')
}
