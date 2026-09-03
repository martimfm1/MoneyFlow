'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'
import { z } from 'zod'

const itemSchema = z.object({
  id: z.uuid().optional(),
  name: z.string().trim().min(1).max(120),
  price: z.coerce.number().finite().nonnegative(),
  category: z.string().trim().max(50).optional().or(z.literal('')),
  priority: z.enum(['high', 'medium', 'low']),
  url: z.string().trim().url().max(2048).optional().or(z.literal('')),
  imageUrl: z.string().trim().url().max(2048).optional().or(z.literal('')),
  desiredDate: z.string().date().optional().or(z.literal('')),
  notes: z.string().trim().max(1000).optional().or(z.literal('')),
})

const statusSchema = z.object({
  id: z.uuid(),
  status: z.enum(['want', 'saving', 'ready', 'purchased']),
})
const goalSchema = z.object({ id: z.uuid() })

async function getUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return { supabase, user }
}

function normalizeNumber(value: FormDataEntryValue | null) {
  if (typeof value !== 'string') return value
  const normalized = value.trim()
  if (normalized.includes(',')) {
    return normalized.replace(/\./g, '').replace(',', '.')
  }
  return normalized
}

function errorRedirect(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`)
}

function itemInput(formData: FormData) {
  return {
    id: formData.get('id') || undefined,
    name: formData.get('name'),
    price: normalizeNumber(formData.get('price')),
    category: formData.get('category') || '',
    priority: formData.get('priority'),
    url: formData.get('url') || '',
    imageUrl: formData.get('imageUrl') || '',
    desiredDate: formData.get('desiredDate') || '',
    notes: formData.get('notes') || '',
  }
}

export async function createWishlistItem(formData: FormData) {
  const parsed = itemSchema.safeParse(itemInput(formData))
  if (!parsed.success) {
    logger.error('wishlist_create_validation_failed', {
      fields: parsed.error.issues.map((issue) => issue.path.join('.')),
      issueCodes: parsed.error.issues.map((issue) => issue.code),
    })
    errorRedirect('/dashboard/wishlist/new', 'Confirma os dados.')
  }
  const { supabase, user } = await getUser()
  const { error } = await supabase.from('wishlist_items').insert({
    user_id: user.id,
    name: parsed.data.name,
    price: parsed.data.price,
    category: parsed.data.category || null,
    priority: parsed.data.priority,
    url: parsed.data.url || null,
    image_url: parsed.data.imageUrl || null,
    desired_date: parsed.data.desiredDate || null,
    notes: parsed.data.notes || null,
  })
  if (error) {
    logger.error('wishlist_create_db_failed', {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    })
    errorRedirect('/dashboard/wishlist/new', 'Não foi possível guardar o item.')
  }
  revalidatePath('/dashboard/wishlist')
  revalidatePath('/dashboard')
  redirect('/dashboard/wishlist')
}

export async function updateWishlistItem(formData: FormData) {
  const parsed = itemSchema.safeParse(itemInput(formData))
  if (!parsed.success || !parsed.data.id) {
    logger.error('wishlist_update_validation_failed', {
      fields: parsed.success
        ? ['id']
        : parsed.error.issues.map((issue) => issue.path.join('.')),
      issueCodes: parsed.success
        ? ['custom']
        : parsed.error.issues.map((issue) => issue.code),
    })
    errorRedirect('/dashboard/wishlist', 'Confirma os dados.')
  }
  const { supabase, user } = await getUser()
  const { error } = await supabase
    .from('wishlist_items')
    .update({
      name: parsed.data.name,
      price: parsed.data.price,
      category: parsed.data.category || null,
      priority: parsed.data.priority,
      url: parsed.data.url || null,
      image_url: parsed.data.imageUrl || null,
      desired_date: parsed.data.desiredDate || null,
      notes: parsed.data.notes || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', parsed.data.id)
    .eq('user_id', user.id)
  if (error) {
    logger.error('wishlist_update_db_failed', {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    })
    errorRedirect(
      `/dashboard/wishlist/${parsed.data.id}/edit`,
      'Não foi possível atualizar o item.',
    )
  }
  revalidatePath('/dashboard/wishlist')
  revalidatePath(`/dashboard/wishlist/${parsed.data.id}/edit`)
  revalidatePath('/dashboard')
  redirect('/dashboard/wishlist')
}

export async function deleteWishlistItem(formData: FormData) {
  const parsed = goalSchema.safeParse({ id: formData.get('id') })
  if (!parsed.success) errorRedirect('/dashboard/wishlist', 'Item inválido.')
  const { supabase, user } = await getUser()
  const { data: linkedGoal } = await supabase
    .from('goals')
    .select('id')
    .eq('wishlist_item_id', parsed.data.id)
    .eq('user_id', user.id)
    .maybeSingle()
  if (linkedGoal)
    errorRedirect(
      '/dashboard/wishlist',
      'Este item já está ligado a um objetivo. Apaga o objetivo primeiro.',
    )
  const { error } = await supabase
    .from('wishlist_items')
    .delete()
    .eq('id', parsed.data.id)
    .eq('user_id', user.id)
  if (error)
    errorRedirect('/dashboard/wishlist', 'Não foi possível apagar o item.')
  revalidatePath('/dashboard/wishlist')
  revalidatePath('/dashboard')
  redirect('/dashboard/wishlist')
}

export async function updateWishlistStatus(formData: FormData) {
  const parsed = statusSchema.safeParse({
    id: formData.get('id'),
    status: formData.get('status'),
  })
  if (!parsed.success) errorRedirect('/dashboard/wishlist', 'Estado inválido.')
  const { supabase, user } = await getUser()
  const { error } = await supabase
    .from('wishlist_items')
    .update({
      status: parsed.data.status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', parsed.data.id)
    .eq('user_id', user.id)
  if (error)
    errorRedirect('/dashboard/wishlist', 'Não foi possível atualizar o item.')
  revalidatePath('/dashboard/wishlist')
  revalidatePath('/dashboard')
  redirect('/dashboard/wishlist')
}

export async function createGoalFromWishlist(formData: FormData) {
  const parsed = goalSchema.safeParse({ id: formData.get('id') })
  if (!parsed.success) errorRedirect('/dashboard/wishlist', 'Item inválido.')
  const { supabase, user } = await getUser()
  const { data: item } = await supabase
    .from('wishlist_items')
    .select('id, name, price, priority, desired_date')
    .eq('id', parsed.data.id)
    .eq('user_id', user.id)
    .maybeSingle()
  if (!item) errorRedirect('/dashboard/wishlist', 'Item inválido.')
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
  if (error || !goal) {
    logger.error('wishlist_goal_create_db_failed', {
      code: error?.code,
      message: error?.message,
      details: error?.details,
      hint: error?.hint,
    })
    errorRedirect('/dashboard/wishlist', 'Não foi possível criar o objetivo.')
  }
  const { error: statusError } = await supabase
    .from('wishlist_items')
    .update({ status: 'saving' })
    .eq('id', item.id)
    .eq('user_id', user.id)
  if (statusError) {
    logger.error('wishlist_status_sync_db_failed', {
      code: statusError.code,
      message: statusError.message,
      details: statusError.details,
      hint: statusError.hint,
    })
  }
  revalidatePath('/dashboard/wishlist')
  revalidatePath('/dashboard')
  redirect(`/dashboard/goals/${goal.id}`)
}
