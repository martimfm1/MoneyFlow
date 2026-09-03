'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { normalizeDecimalInput } from '@/lib/number'

const schema = z.object({
  id: z.uuid().optional(),
  name: z.string().trim().min(1).max(120),
  source: z.string().trim().max(120).optional(),
  amount: z.coerce.number().positive().finite(),
  frequency: z.enum(['monthly', 'quarterly', 'yearly']),
  nextIncomeDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  currencyCode: z.string().regex(/^[A-Z]{3}$/),
  accountId: z.uuid(),
  notes: z.string().trim().max(500).optional(),
})

const toggleSchema = z.object({
  id: z.uuid(),
  isActive: z.enum(['true', 'false']),
})

function errorRedirect(message: string): never {
  redirect(`/dashboard/recurring/income?error=${encodeURIComponent(message)}`)
}

async function getUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return { supabase, user }
}

async function getActiveAccount(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  accountId: string,
) {
  const { data } = await supabase
    .from('accounts')
    .select('id, is_active')
    .eq('id', accountId)
    .eq('user_id', userId)
    .maybeSingle()
  return data
}

export async function createRecurringIncome(formData: FormData) {
  const parsed = schema.safeParse({
    name: formData.get('name'),
    source: formData.get('source') || undefined,
    amount: normalizeDecimalInput(formData.get('amount')),
    frequency: formData.get('frequency'),
    nextIncomeDate: formData.get('nextIncomeDate'),
    currencyCode: String(formData.get('currencyCode') || '').toUpperCase(),
    accountId: formData.get('accountId'),
    notes: formData.get('notes') || undefined,
  })

  if (!parsed.success) errorRedirect('Verifica os dados do ganho.')

  const { supabase, user } = await getUser()
  const account = await getActiveAccount(
    supabase,
    user.id,
    parsed.data.accountId,
  )
  if (!account) errorRedirect('Conta inválida.')
  if (!account.is_active) errorRedirect('Escolhe uma conta ativa.')

  const { error } = await supabase.from('recurring_incomes').insert({
    user_id: user.id,
    account_id: parsed.data.accountId,
    name: parsed.data.name,
    source: parsed.data.source || null,
    amount: parsed.data.amount,
    frequency: parsed.data.frequency,
    next_income_date: parsed.data.nextIncomeDate,
    currency_code: parsed.data.currencyCode,
    notes: parsed.data.notes || null,
  })

  if (error) errorRedirect('Não foi possível guardar o ganho.')

  revalidatePath('/dashboard/recurring/income')
  revalidatePath('/dashboard')
  redirect('/dashboard/recurring/income?toast=Ganho%20adicionado.')
}

export async function updateRecurringIncome(formData: FormData) {
  const parsed = schema.safeParse({
    id: formData.get('id'),
    name: formData.get('name'),
    source: formData.get('source') || undefined,
    amount: normalizeDecimalInput(formData.get('amount')),
    frequency: formData.get('frequency'),
    nextIncomeDate: formData.get('nextIncomeDate'),
    currencyCode: String(formData.get('currencyCode') || '').toUpperCase(),
    accountId: formData.get('accountId'),
    notes: formData.get('notes') || undefined,
  })

  if (!parsed.success || !parsed.data.id)
    redirect('/dashboard/recurring/income?error=Verifica%20os%20dados.')

  const { supabase, user } = await getUser()
  const account = await getActiveAccount(
    supabase,
    user.id,
    parsed.data.accountId,
  )
  if (!account) errorRedirect('Conta inválida.')
  if (!account.is_active) errorRedirect('Escolhe uma conta ativa.')

  const { error } = await supabase
    .from('recurring_incomes')
    .update({
      account_id: parsed.data.accountId,
      name: parsed.data.name,
      source: parsed.data.source || null,
      amount: parsed.data.amount,
      frequency: parsed.data.frequency,
      next_income_date: parsed.data.nextIncomeDate,
      currency_code: parsed.data.currencyCode,
      notes: parsed.data.notes || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', parsed.data.id)
    .eq('user_id', user.id)

  if (error)
    redirect(
      `/dashboard/recurring/income/${parsed.data.id}/edit?error=${encodeURIComponent('Não foi possível atualizar o ganho.')}`,
    )

  revalidatePath('/dashboard/recurring/income')
  revalidatePath(`/dashboard/recurring/income/${parsed.data.id}/edit`)
  revalidatePath('/dashboard')
  redirect('/dashboard/recurring/income?toast=Ganho%20atualizado.')
}

export async function toggleRecurringIncome(formData: FormData) {
  const parsed = toggleSchema.safeParse({
    id: formData.get('id'),
    isActive: formData.get('isActive'),
  })
  if (!parsed.success) errorRedirect('Ganho inválido.')

  const { supabase, user } = await getUser()
  const { error } = await supabase
    .from('recurring_incomes')
    .update({
      is_active: parsed.data.isActive === 'true',
      updated_at: new Date().toISOString(),
    })
    .eq('id', parsed.data.id)
    .eq('user_id', user.id)

  if (error) errorRedirect('Não foi possível atualizar.')

  revalidatePath('/dashboard/recurring/income')
  revalidatePath('/dashboard')
  redirect(
    `/dashboard/recurring/income?toast=${parsed.data.isActive === 'true' ? 'Ganho%20ativado.' : 'Ganho%20pausado.'}`,
  )
}

export async function deleteRecurringIncome(formData: FormData) {
  const id = z.uuid().safeParse(formData.get('id'))
  if (!id.success) errorRedirect('Ganho inválido.')

  const { supabase, user } = await getUser()
  const { error } = await supabase
    .from('recurring_incomes')
    .delete()
    .eq('id', id.data)
    .eq('user_id', user.id)

  if (error) errorRedirect('Não foi possível apagar.')

  revalidatePath('/dashboard/recurring/income')
  revalidatePath('/dashboard')
  redirect('/dashboard/recurring/income?toast=Ganho%20apagado.')
}
