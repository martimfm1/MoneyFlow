'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { normalizeDecimalInput } from '@/lib/number'

const recurringExpenseSchema = z.object({
  id: z.uuid().optional(),
  name: z.string().trim().min(1).max(120),
  provider: z.string().trim().max(120).optional(),
  amount: z.coerce.number().positive().finite(),
  frequency: z.enum(['monthly', 'quarterly', 'yearly']),
  nextDueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  currencyCode: z.string().regex(/^[A-Z]{3}$/),
  accountId: z.uuid(),
  notes: z.string().trim().max(500).optional(),
})

const idSchema = z.uuid()

function errorRedirect(message: string): never {
  redirect(`/dashboard/recurring?error=${encodeURIComponent(message)}`)
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

export async function createRecurringExpense(formData: FormData) {
  const parsed = recurringExpenseSchema.safeParse({
    name: formData.get('name'),
    provider: formData.get('provider') || undefined,
    amount: normalizeDecimalInput(formData.get('amount')),
    frequency: formData.get('frequency'),
    nextDueDate: formData.get('nextDueDate'),
    currencyCode: String(formData.get('currencyCode') || '').toUpperCase(),
    accountId: formData.get('accountId'),
    notes: formData.get('notes') || undefined,
  })

  if (!parsed.success) errorRedirect('Verifica os dados da despesa.')

  const { supabase, user } = await getUser()
  const account = await getActiveAccount(
    supabase,
    user.id,
    parsed.data.accountId,
  )
  if (!account) errorRedirect('Conta inválida.')
  if (!account.is_active) errorRedirect('Escolhe uma conta ativa.')

  const { error } = await supabase.from('recurring_expenses').insert({
    user_id: user.id,
    account_id: parsed.data.accountId,
    name: parsed.data.name,
    provider: parsed.data.provider || null,
    amount: parsed.data.amount,
    frequency: parsed.data.frequency,
    next_due_date: parsed.data.nextDueDate,
    currency_code: parsed.data.currencyCode,
    notes: parsed.data.notes || null,
  })
  if (error) errorRedirect('Não foi possível guardar a despesa.')
  revalidatePath('/dashboard/recurring')
  revalidatePath('/dashboard')
  redirect('/dashboard/recurring?toast=Despesa%20recorrente%20adicionada.')
}

export async function updateRecurringExpense(formData: FormData) {
  const parsed = recurringExpenseSchema.safeParse({
    id: formData.get('id'),
    name: formData.get('name'),
    provider: formData.get('provider') || undefined,
    amount: normalizeDecimalInput(formData.get('amount')),
    frequency: formData.get('frequency'),
    nextDueDate: formData.get('nextDueDate'),
    currencyCode: String(formData.get('currencyCode') || '').toUpperCase(),
    accountId: formData.get('accountId'),
    notes: formData.get('notes') || undefined,
  })
  if (!parsed.success || !parsed.data.id)
    errorRedirect('Verifica os dados da despesa.')

  const { supabase, user } = await getUser()
  const account = await getActiveAccount(
    supabase,
    user.id,
    parsed.data.accountId,
  )
  if (!account) errorRedirect('Conta inválida.')
  if (!account.is_active) errorRedirect('Escolhe uma conta ativa.')

  const { error } = await supabase
    .from('recurring_expenses')
    .update({
      account_id: parsed.data.accountId,
      name: parsed.data.name,
      provider: parsed.data.provider || null,
      amount: parsed.data.amount,
      frequency: parsed.data.frequency,
      next_due_date: parsed.data.nextDueDate,
      currency_code: parsed.data.currencyCode,
      notes: parsed.data.notes || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', parsed.data.id)
    .eq('user_id', user.id)

  if (error)
    redirect(
      `/dashboard/recurring/${parsed.data.id}/edit?error=${encodeURIComponent('Não foi possível atualizar a despesa.')}`,
    )
  revalidatePath('/dashboard/recurring')
  revalidatePath(`/dashboard/recurring/${parsed.data.id}/edit`)
  revalidatePath('/dashboard')
  redirect('/dashboard/recurring?toast=Despesa%20recorrente%20atualizada.')
}

export async function deleteRecurringExpense(formData: FormData) {
  const parsed = idSchema.safeParse(formData.get('id'))
  if (!parsed.success) errorRedirect('Despesa inválida.')
  const { supabase, user } = await getUser()
  const { error } = await supabase
    .from('recurring_expenses')
    .delete()
    .eq('id', parsed.data)
    .eq('user_id', user.id)
  if (error) errorRedirect('Não foi possível apagar a despesa.')
  revalidatePath('/dashboard/recurring')
  revalidatePath('/dashboard')
  redirect('/dashboard/recurring?toast=Despesa%20recorrente%20apagada.')
}

export async function toggleRecurringExpense(formData: FormData) {
  const parsed = z
    .object({ id: z.uuid(), isActive: z.enum(['true', 'false']) })
    .safeParse({ id: formData.get('id'), isActive: formData.get('isActive') })
  if (!parsed.success) errorRedirect('Despesa inválida.')

  const { supabase, user } = await getUser()
  const nextIsActive = parsed.data.isActive === 'true'
  const { data, error } = await supabase
    .from('recurring_expenses')
    .update({
      is_active: nextIsActive,
      updated_at: new Date().toISOString(),
    })
    .eq('id', parsed.data.id)
    .eq('user_id', user.id)
    .select('id, is_active')
    .maybeSingle()

  if (error || !data || data.is_active !== nextIsActive)
    errorRedirect('Não foi possível atualizar a despesa recorrente.')

  revalidatePath('/dashboard/recurring')
  revalidatePath('/dashboard')
  redirect(
    `/dashboard/recurring?toast=${nextIsActive ? 'Despesa%20ativada.' : 'Despesa%20pausada.'}`,
  )
}
