'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { normalizeDecimalInput } from '@/lib/number'

const schema = z.object({
  name: z.string().trim().min(1).max(120),
  targetAmount: z.coerce.number().finite().positive(),
  priority: z.enum(['high', 'medium', 'low']),
  targetDate: z.string().date().optional(),
})

export async function createGoal(formData: FormData) {
  const parsed = schema.safeParse({
    name: formData.get('name'),
    targetAmount: normalizeDecimalInput(formData.get('targetAmount')),
    priority: formData.get('priority'),
    targetDate: formData.get('targetDate') || undefined,
  })

  if (!parsed.success) redirect('/dashboard/goals/new?error=Dados%20inválidos.')

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { error } = await supabase.from('goals').insert({
    user_id: user.id,
    name: parsed.data.name,
    target_amount: parsed.data.targetAmount,
    priority: parsed.data.priority,
    target_date: parsed.data.targetDate ?? null,
  })

  if (error)
    redirect(
      '/dashboard/goals/new?error=Não%20foi%20possível%20criar%20o%20objetivo.',
    )
  redirect('/dashboard')
}
