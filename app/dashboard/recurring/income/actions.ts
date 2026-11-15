'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { normalizeDecimalInput } from '@/lib/number'
import { getFinancialContext } from '@/lib/financial-context'

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
    errorRedirect('A moeda da entrada tem de corresponder à moeda da conta.')
  }

  const { data: created, error } = await supabase
    .from('recurring_incomes')
    .insert({
      user_id: user.id,
      context_id: financialContext.id,
      account_id: parsed.data.accountId,
      name: parsed.data.name,
      source: parsed.data.source || null,
      amount: parsed.data.amount,
      frequency: parsed.data.frequency,
      next_income_date: parsed.data.nextIncomeDate,
      auto_post_enabled: false,
      schedule_day_of_month: Number(parsed.data.nextIncomeDate.slice(8, 10)),
      schedule_month_of_year: Number(parsed.data.nextIncomeDate.slice(5, 7)),
      currency_code: parsed.data.currencyCode,
      notes: parsed.data.notes || null,
    })
    .select('id')
    .single()

  if (error || !created) errorRedirect('Não foi possível guardar o ganho.')

  const { error: automationError } = await supabase.rpc(
    'set_recurring_automation',
    {
      p_recurrence_type: 'income',
      p_recurrence_id: created.id,
      p_enabled: true,
    },
  )
  if (automationError) {
    await supabase
      .from('recurring_incomes')
      .delete()
      .eq('id', created.id)
      .eq('user_id', user.id)
      .eq('context_id', financialContext.id)
    errorRedirect('Não foi possível ativar os lançamentos automáticos. O ganho não foi criado.')
  }

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
    errorRedirect('A moeda da entrada tem de corresponder à moeda da conta.')
  }

  const { data: existing, error: existingError } = await supabase
    .from('recurring_incomes')
    .select('auto_post_enabled')
    .eq('id', parsed.data.id)
    .eq('user_id', user.id)
    .eq('context_id', financialContext.id)
    .maybeSingle()
  if (existingError || !existing) errorRedirect('Ganho não encontrado.')

  const { error } = await supabase
    .from('recurring_incomes')
    .update({
      account_id: parsed.data.accountId,
      name: parsed.data.name,
      source: parsed.data.source || null,
      amount: parsed.data.amount,
      frequency: parsed.data.frequency,
      next_income_date: parsed.data.nextIncomeDate,
      schedule_day_of_month: Number(parsed.data.nextIncomeDate.slice(8, 10)),
      schedule_month_of_year: Number(parsed.data.nextIncomeDate.slice(5, 7)),
      currency_code: parsed.data.currencyCode,
      notes: parsed.data.notes || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', parsed.data.id)
    .eq('user_id', user.id)
    .eq('context_id', financialContext.id)

  if (error)
    redirect(
      `/dashboard/recurring/income/${parsed.data.id}/edit?error=${encodeURIComponent('Não foi possível atualizar o ganho.')}`,
    )

  if (existing.auto_post_enabled) {
    const { error: automationError } = await supabase.rpc(
      'set_recurring_automation',
      {
        p_recurrence_type: 'income',
        p_recurrence_id: parsed.data.id,
        p_enabled: true,
      },
    )
    if (automationError) {
      await supabase
        .from('recurring_incomes')
        .update({ auto_post_enabled: false })
        .eq('id', parsed.data.id)
        .eq('user_id', user.id)
        .eq('context_id', financialContext.id)
      errorRedirect('O ganho foi atualizado, mas a automatização foi pausada por segurança. Ativa-a novamente para continuar.')
    }
  }

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

  const { supabase, user, financialContext } = await getUser()
  const { data, error } = await supabase
    .from('recurring_incomes')
    .update({
      is_active: parsed.data.isActive === 'true',
      updated_at: new Date().toISOString(),
    })
    .eq('id', parsed.data.id)
    .eq('user_id', user.id)
    .eq('context_id', financialContext.id)
    .select('id, is_active, auto_post_enabled')
    .maybeSingle()

  if (error || !data || data.is_active !== (parsed.data.isActive === 'true')) errorRedirect('Não foi possível atualizar.')

  if (parsed.data.isActive === 'true' && data.auto_post_enabled) {
    const { error: automationError } = await supabase.rpc(
      'set_recurring_automation',
      {
        p_recurrence_type: 'income',
        p_recurrence_id: parsed.data.id,
        p_enabled: true,
      },
    )
    if (automationError) {
      await supabase
        .from('recurring_incomes')
        .update({ auto_post_enabled: false })
        .eq('id', parsed.data.id)
        .eq('user_id', user.id)
        .eq('context_id', financialContext.id)
      errorRedirect('O ganho foi ativado, mas os lançamentos automáticos foram pausados por segurança.')
    }
  }

  revalidatePath('/dashboard/recurring/income')
  revalidatePath('/dashboard')
  redirect(
    `/dashboard/recurring/income?toast=${parsed.data.isActive === 'true' ? 'Ganho%20ativado.' : 'Ganho%20pausado.'}`,
  )
}

export async function deleteRecurringIncome(formData: FormData) {
  const id = z.uuid().safeParse(formData.get('id'))
  if (!id.success) errorRedirect('Ganho inválido.')

  const { supabase, user, financialContext } = await getUser()
  const { error } = await supabase
    .from('recurring_incomes')
    .delete()
    .eq('id', id.data)
    .eq('user_id', user.id)
    .eq('context_id', financialContext.id)

  if (error) errorRedirect('Não foi possível apagar.')

  revalidatePath('/dashboard/recurring/income')
  revalidatePath('/dashboard')
  redirect('/dashboard/recurring/income?toast=Ganho%20apagado.')
}

export async function toggleRecurringIncomeAutomation(formData: FormData) {
  const parsed = z
    .object({ id: z.uuid(), enabled: z.enum(['true', 'false']) })
    .safeParse({ id: formData.get('id'), enabled: formData.get('enabled') })
  if (!parsed.success) errorRedirect('Entrada inválida.')

  const { supabase } = await getUser()
  const { error } = await supabase.rpc('set_recurring_automation', {
    p_recurrence_type: 'income',
    p_recurrence_id: parsed.data.id,
    p_enabled: parsed.data.enabled === 'true',
  })
  if (error) errorRedirect('Não foi possível atualizar a automatização.')

  revalidatePath('/dashboard/recurring/income')
  revalidatePath('/dashboard')
  redirect(
    `/dashboard/recurring/income?toast=${parsed.data.enabled === 'true' ? 'Lançamentos%20automáticos%20ativados.%20O%20primeiro%20lançamento%20será%20na%20próxima%20data%20futura.' : 'Lançamentos%20automáticos%20pausados.'}`,
  )
}
