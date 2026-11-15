'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { normalizeDecimalInput } from '@/lib/number'
import { getFinancialContext } from '@/lib/financial-context'

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
  const financialContext = await getFinancialContext(supabase, user.id)
  return { supabase, user, financialContext }
}

async function getActiveAccount(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  accountId: string,
  contextId: string,
) {
  const { data } = await supabase
    .from('accounts')
    .select('id, is_active, currency_code')
    .eq('id', accountId)
    .eq('user_id', userId)
    .eq('context_id', contextId)
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

  const { supabase, user, financialContext } = await getUser()
  const account = await getActiveAccount(
    supabase,
    user.id,
    parsed.data.accountId,
    financialContext.id,
  )
  if (!account) errorRedirect('Conta inválida.')
  if (!account.is_active) errorRedirect('Escolhe uma conta ativa.')
  if (account.currency_code !== parsed.data.currencyCode) {
    errorRedirect('A moeda da despesa tem de corresponder à moeda da conta.')
  }

  const { data: created, error } = await supabase
    .from('recurring_expenses')
    .insert({
      user_id: user.id,
      context_id: financialContext.id,
      account_id: parsed.data.accountId,
      name: parsed.data.name,
      provider: parsed.data.provider || null,
      amount: parsed.data.amount,
      frequency: parsed.data.frequency,
      next_due_date: parsed.data.nextDueDate,
      auto_post_enabled: false,
      schedule_day_of_month: Number(parsed.data.nextDueDate.slice(8, 10)),
      schedule_month_of_year: Number(parsed.data.nextDueDate.slice(5, 7)),
      currency_code: parsed.data.currencyCode,
      notes: parsed.data.notes || null,
    })
    .select('id')
    .single()
  if (error || !created) errorRedirect('Não foi possível guardar a despesa.')

  const { error: automationError } = await supabase.rpc(
    'set_recurring_automation',
    {
      p_recurrence_type: 'expense',
      p_recurrence_id: created.id,
      p_enabled: true,
    },
  )
  if (automationError) {
    await supabase
      .from('recurring_expenses')
      .delete()
      .eq('id', created.id)
      .eq('user_id', user.id)
      .eq('context_id', financialContext.id)
    errorRedirect('Não foi possível ativar os lançamentos automáticos. A despesa não foi criada.')
  }
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

  const { supabase, user, financialContext } = await getUser()
  const account = await getActiveAccount(
    supabase,
    user.id,
    parsed.data.accountId,
    financialContext.id,
  )
  if (!account) errorRedirect('Conta inválida.')
  if (!account.is_active) errorRedirect('Escolhe uma conta ativa.')
  if (account.currency_code !== parsed.data.currencyCode) {
    errorRedirect('A moeda da despesa tem de corresponder à moeda da conta.')
  }

  const { data: existing, error: existingError } = await supabase
    .from('recurring_expenses')
    .select('auto_post_enabled')
    .eq('id', parsed.data.id)
    .eq('user_id', user.id)
    .eq('context_id', financialContext.id)
    .maybeSingle()
  if (existingError || !existing) errorRedirect('Despesa não encontrada.')

  const { error } = await supabase
    .from('recurring_expenses')
    .update({
      account_id: parsed.data.accountId,
      name: parsed.data.name,
      provider: parsed.data.provider || null,
      amount: parsed.data.amount,
      frequency: parsed.data.frequency,
      next_due_date: parsed.data.nextDueDate,
      schedule_day_of_month: Number(parsed.data.nextDueDate.slice(8, 10)),
      schedule_month_of_year: Number(parsed.data.nextDueDate.slice(5, 7)),
      currency_code: parsed.data.currencyCode,
      notes: parsed.data.notes || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', parsed.data.id)
    .eq('user_id', user.id)
    .eq('context_id', financialContext.id)

  if (error)
    redirect(
      `/dashboard/recurring/${parsed.data.id}/edit?error=${encodeURIComponent('Não foi possível atualizar a despesa.')}`,
    )

  if (existing.auto_post_enabled) {
    const { error: automationError } = await supabase.rpc(
      'set_recurring_automation',
      {
        p_recurrence_type: 'expense',
        p_recurrence_id: parsed.data.id,
        p_enabled: true,
      },
    )
    if (automationError) {
      await supabase
        .from('recurring_expenses')
        .update({ auto_post_enabled: false })
        .eq('id', parsed.data.id)
        .eq('user_id', user.id)
        .eq('context_id', financialContext.id)
      errorRedirect('A despesa foi atualizada, mas a automatização foi pausada por segurança. Ativa-a novamente para continuar.')
    }
  }

  revalidatePath('/dashboard/recurring')
  revalidatePath(`/dashboard/recurring/${parsed.data.id}/edit`)
  revalidatePath('/dashboard')
  redirect('/dashboard/recurring?toast=Despesa%20recorrente%20atualizada.')
}

export async function deleteRecurringExpense(formData: FormData) {
  const parsed = idSchema.safeParse(formData.get('id'))
  if (!parsed.success) errorRedirect('Despesa inválida.')
  const { supabase, user, financialContext } = await getUser()
  const { error } = await supabase
    .from('recurring_expenses')
    .delete()
    .eq('id', parsed.data)
    .eq('user_id', user.id)
    .eq('context_id', financialContext.id)
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

  const { supabase, user, financialContext } = await getUser()
  const nextIsActive = parsed.data.isActive === 'true'
  const { data, error } = await supabase
    .from('recurring_expenses')
    .update({
      is_active: nextIsActive,
      updated_at: new Date().toISOString(),
    })
    .eq('id', parsed.data.id)
    .eq('user_id', user.id)
    .eq('context_id', financialContext.id)
    .select('id, is_active, auto_post_enabled')
    .maybeSingle()

  if (error || !data || data.is_active !== nextIsActive)
    errorRedirect('Não foi possível atualizar a despesa recorrente.')

  if (nextIsActive && data.auto_post_enabled) {
    const { error: automationError } = await supabase.rpc(
      'set_recurring_automation',
      {
        p_recurrence_type: 'expense',
        p_recurrence_id: parsed.data.id,
        p_enabled: true,
      },
    )
    if (automationError) {
      await supabase
        .from('recurring_expenses')
        .update({ auto_post_enabled: false })
        .eq('id', parsed.data.id)
        .eq('user_id', user.id)
        .eq('context_id', financialContext.id)
      errorRedirect('A despesa foi ativada, mas os lançamentos automáticos foram pausados por segurança.')
    }
  }

  revalidatePath('/dashboard/recurring')
  revalidatePath('/dashboard')
  redirect(
    `/dashboard/recurring?toast=${nextIsActive ? 'Despesa%20ativada.' : 'Despesa%20pausada.'}`,
  )
}

export async function toggleRecurringExpenseAutomation(formData: FormData) {
  const parsed = z
    .object({ id: z.uuid(), enabled: z.enum(['true', 'false']) })
    .safeParse({ id: formData.get('id'), enabled: formData.get('enabled') })
  if (!parsed.success) errorRedirect('Despesa inválida.')

  const { supabase } = await getUser()
  const { error } = await supabase.rpc('set_recurring_automation', {
    p_recurrence_type: 'expense',
    p_recurrence_id: parsed.data.id,
    p_enabled: parsed.data.enabled === 'true',
  })
  if (error) errorRedirect('Não foi possível atualizar a automatização.')

  revalidatePath('/dashboard/recurring')
  revalidatePath('/dashboard')
  redirect(
    `/dashboard/recurring?toast=${parsed.data.enabled === 'true' ? 'Lançamentos%20automáticos%20ativados.%20O%20primeiro%20lançamento%20será%20na%20próxima%20data%20futura.' : 'Lançamentos%20automáticos%20pausados.'}`,
  )
}
