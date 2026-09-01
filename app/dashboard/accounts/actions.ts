'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const toggleSchema = z.object({
  id: z.uuid(),
  isActive: z.enum(['true', 'false']),
})

const updateSchema = z.object({
  id: z.uuid(),
  name: z.string().trim().min(1).max(80),
  accountType: z.enum(['cash', 'bank', 'card', 'savings', 'other']),
})

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

  redirect('/dashboard/accounts')
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

  redirect('/dashboard/accounts')
}
