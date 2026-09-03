'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { normalizeDecimalInput } from '@/lib/number'

const schema = z.object({
  name: z.string().trim().min(1).max(120),
  source: z.string().trim().max(120).optional(),
  amount: z.coerce.number().positive().finite(),
  frequency: z.enum(['monthly', 'quarterly', 'yearly']),
  nextIncomeDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  currencyCode: z.string().regex(/^[A-Z]{3}$/),
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

export async function createRecurringIncome(formData: FormData) {
  const parsed = schema.safeParse({
    name: formData.get('name'),
    source: formData.get('source') || undefined,
    amount: normalizeDecimalInput(formData.get('amount')),
    frequency: formData.get('frequency'),
    nextIncomeDate: formData.get('nextIncomeDate'),
    currencyCode: String(formData.get('currencyCode') || '').toUpperCase(),
    notes: formData.get('notes') || undefined,
  })

  if (!parsed.success) errorRedirect('Dados inválidos.')

  const { supabase, user } = await getUser()
  const { error } = await supabase.from('recurring_incomes').insert({
    user_id: user.id,
    name: parsed.data.name,
    source: parsed.data.source || null,
    amount: parsed.data.amount,
    frequency: parsed.data.frequency,
    next_income_date: parsed.data.nextIncomeDate,
    currency_code: parsed.data.currencyCode,
    notes: parsed.data.notes || null,
  })

  if (error) errorRedirect('Não foi possível guardar.')

  revalidatePath('/dashboard/recurring/income')
  revalidatePath('/dashboard')
  redirect('/dashboard/recurring/income?toast=Ganho%20adicionado.')
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
  redirect(`/dashboard/recurring/income?toast=${parsed.data.isActive === 'true' ? 'Ganho%20ativado.' : 'Ganho%20pausado.'}`)
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
