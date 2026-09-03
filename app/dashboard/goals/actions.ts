'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const contributionSchema = z.object({
  goalId: z.uuid(),
  amount: z.coerce.number().finite().positive(),
  note: z.string().trim().max(500).optional().or(z.literal('')),
})

const deleteGoalSchema = z.object({
  goalId: z.uuid(),
})

export async function addGoalContribution(formData: FormData) {
  const parsed = contributionSchema.safeParse({
    goalId: formData.get('goalId'),
    amount: formData.get('amount'),
    note: formData.get('note') || undefined,
  })

  if (!parsed.success)
    redirect('/dashboard/goals?error=Contribuição%20inválida.')

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: goal } = await supabase
    .from('goals')
    .select('id, current_amount, target_amount')
    .eq('id', parsed.data.goalId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!goal) redirect('/dashboard/goals?error=Objetivo%20inválido.')

  const remaining = Number(goal.target_amount) - Number(goal.current_amount)
  if (parsed.data.amount > remaining)
    redirect(
      '/dashboard/goals?error=A%20contribuição%20ultrapassa%20o%20valor%20em%20falta.',
    )

  const { error } = await supabase.from('goal_contributions').insert({
    user_id: user.id,
    goal_id: parsed.data.goalId,
    amount: parsed.data.amount,
    note: parsed.data.note || null,
  })

  if (error)
    redirect(
      '/dashboard/goals?error=Não%20foi%20possível%20adicionar%20a%20contribuição.',
    )
  redirect('/dashboard/goals')
}

export async function deleteGoal(formData: FormData) {
  const parsed = deleteGoalSchema.safeParse({
    goalId: formData.get('goalId'),
  })

  if (!parsed.success)
    redirect('/dashboard/goals?error=Objetivo%20inválido.')

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { error } = await supabase
    .from('goals')
    .delete()
    .eq('id', parsed.data.goalId)
    .eq('user_id', user.id)

  if (error)
    redirect('/dashboard/goals?error=Não%20foi%20possível%20apagar%20o%20objetivo.')

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/goals')
  redirect('/dashboard/goals')
}
