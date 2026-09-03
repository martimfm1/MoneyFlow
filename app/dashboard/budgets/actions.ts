'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'
import { z } from 'zod'

const budgetSchema = z.object({
  categoryId: z.uuid(),
  amount: z.coerce.number().finite().positive(),
  month: z.string().regex(/^\d{4}-\d{2}$/),
})

function normalizeNumber(value: FormDataEntryValue | null) {
  if (typeof value !== 'string') return value
  const normalized = value.trim()
  if (normalized.includes(',')) {
    return normalized.replace(/\./g, '').replace(',', '.')
  }
  return normalized
}

function redirectWithError(month: string, message: string): never {
  redirect(
    `/dashboard/budgets?month=${encodeURIComponent(month)}&error=${encodeURIComponent(message)}`,
  )
}

export async function upsertBudget(formData: FormData) {
  const parsed = budgetSchema.safeParse({
    categoryId: formData.get('categoryId'),
    amount: normalizeNumber(formData.get('amount')),
    month: formData.get('month'),
  })

  if (!parsed.success) {
    logger.error('budget_create_validation_failed', {
      fieldCount: parsed.error.issues.length,
    })
    redirectWithError('current', 'Dados do orçamento inválidos.')
  }

  const [year, monthNumber] = parsed.data.month.split('-').map(Number)
  const monthStart = new Date(Date.UTC(year, monthNumber - 1, 1))
  const normalizedMonth = `${year.toString().padStart(4, '0')}-${monthNumber.toString().padStart(2, '0')}`

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(monthNumber) ||
    monthNumber < 1 ||
    monthNumber > 12 ||
    monthStart.getUTCFullYear() !== year ||
    monthStart.getUTCMonth() !== monthNumber - 1
  ) {
    logger.error('budget_create_invalid_month', { month: normalizedMonth })
    redirectWithError(normalizedMonth, 'Mês inválido.')
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: category } = await supabase
    .from('categories')
    .select('id')
    .eq('id', parsed.data.categoryId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!category) {
    logger.error('budget_create_category_not_found')
    redirectWithError(normalizedMonth, 'Categoria inválida.')
  }

  const { error } = await supabase.from('budgets').upsert(
    {
      user_id: user.id,
      category_id: parsed.data.categoryId,
      month_start: normalizedMonth,
      amount: parsed.data.amount,
    },
    { onConflict: 'user_id,category_id,month_start' },
  )

  if (error) {
    logger.error('budget_create_db_failed', {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    })
    redirectWithError(normalizedMonth, 'Não foi possível guardar o orçamento.')
  }

  redirect(`/dashboard/budgets?month=${encodeURIComponent(normalizedMonth)}`)
}
