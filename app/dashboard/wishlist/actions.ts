'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const createSchema = z.object({
  name: z.string().trim().min(1).max(120),
  price: z.coerce.number().finite().nonnegative(),
  priority: z.enum(['high', 'medium', 'low']),
  url: z.string().trim().url().max(2048).optional().or(z.literal('')),
  desiredDate: z.string().date().optional().or(z.literal('')),
  notes: z.string().trim().max(1000).optional().or(z.literal('')),
})

const statusSchema = z.object({
  id: z.uuid(),
  status: z.enum(['want', 'saving', 'ready', 'purchased']),
})

const goalSchema = z.object({
  id: z.uuid(),
})

export async function createWishlistItem(formData: FormData) {
  const parsed = createSchema.safeParse({
    name: formData.get('name'),
    price: formData.get('price'),
    priority: formData.get('priority'),
    url: formData.get('url') || undefined,
    desiredDate: formData.get('desiredDate') || undefined,
    notes: formData.get('notes') || undefined,
  })

  if (!parsed.success)
    redirect('/dashboard/wishlist/new?error=Confirma%20os%20dados.')

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { error } = await supabase.from('wishlist_items').insert({
    user_id: user.id,
    name: parsed.data.name,
    price: parsed.data.price,
    priority: parsed.data.priority,
    url: parsed.data.url || null,
    desired_date: parsed.data.desiredDate || null,
    notes: parsed.data.notes || null,
  })

  if (error)
    redirect(
      '/dashboard/wishlist/new?error=Não%20foi%20possível%20guardar%20o%20item.',
    )
  redirect('/dashboard/wishlist')
}

export async function updateWishlistStatus(formData: FormData) {
  const parsed = statusSchema.safeParse({
    id: formData.get('id'),
    status: formData.get('status'),
  })

  if (!parsed.success) redirect('/dashboard/wishlist?error=Estado%20inválido.')

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { error } = await supabase
    .from('wishlist_items')
    .update({ status: parsed.data.status })
    .eq('id', parsed.data.id)
    .eq('user_id', user.id)

  if (error)
    redirect(
      '/dashboard/wishlist?error=Não%20foi%20possível%20atualizar%20o%20item.',
    )
  redirect('/dashboard/wishlist')
}

export async function createGoalFromWishlist(formData: FormData) {
  const parsed = goalSchema.safeParse({ id: formData.get('id') })
  if (!parsed.success) redirect('/dashboard/wishlist?error=Item%20inválido.')

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: item } = await supabase
    .from('wishlist_items')
    .select('id, name, price, priority, desired_date')
    .eq('id', parsed.data.id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!item) redirect('/dashboard/wishlist?error=Item%20inválido.')

  const { data: existingGoal } = await supabase
    .from('goals')
    .select('id')
    .eq('wishlist_item_id', item.id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existingGoal) redirect(`/dashboard/goals/${existingGoal.id}`)

  const { data: goal, error } = await supabase
    .from('goals')
    .insert({
      user_id: user.id,
      wishlist_item_id: item.id,
      name: item.name,
      target_amount: item.price,
      priority: item.priority,
      target_date: item.desired_date,
    })
    .select('id')
    .single()

  if (error || !goal)
    redirect(
      '/dashboard/wishlist?error=Não%20foi%20possível%20criar%20o%20objetivo.',
    )

  await supabase
    .from('wishlist_items')
    .update({ status: 'saving' })
    .eq('id', item.id)
    .eq('user_id', user.id)

  redirect(`/dashboard/goals/${goal.id}`)
}
