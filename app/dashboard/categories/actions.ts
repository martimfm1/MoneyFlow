'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const createSchema = z.object({
  name: z.string().trim().min(1).max(50),
})
const idSchema = z.uuid()
const updateSchema = z.object({
  id: z.uuid(),
  name: z.string().trim().min(1).max(50),
})
const moveSchema = z.object({ id: z.uuid(), direction: z.enum(['up', 'down']) })

async function getUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return { supabase, user }
}

export async function createCategory(formData: FormData) {
  const parsed = createSchema.safeParse({ name: formData.get('name') })
  if (!parsed.success)
    redirect('/dashboard/categories?error=Nome%20de%20categoria%20inválido.')
  const { supabase, user } = await getUser()
  const { data: existing } = await supabase
    .from('categories')
    .select('id')
    .eq('user_id', user.id)
    .eq('name', parsed.data.name)
    .maybeSingle()
  if (existing)
    redirect('/dashboard/categories?error=Essa%20categoria%20já%20existe.')
  const { data: lastCategory } = await supabase
    .from('categories')
    .select('sort_order')
    .eq('user_id', user.id)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle()
  const { error } = await supabase
    .from('categories')
    .insert({
      user_id: user.id,
      name: parsed.data.name,
      sort_order: (lastCategory?.sort_order ?? -1) + 1,
    })
  if (error)
    redirect(
      '/dashboard/categories?error=Não%20foi%20possível%20criar%20a%20categoria.',
    )
  redirect('/dashboard/categories')
}

export async function updateCategory(formData: FormData) {
  const parsed = updateSchema.safeParse({
    id: formData.get('id'),
    name: formData.get('name'),
  })
  if (!parsed.success)
    redirect('/dashboard/categories?error=Dados%20inválidos.')
  const { supabase, user } = await getUser()
  const { data: duplicate } = await supabase
    .from('categories')
    .select('id')
    .eq('user_id', user.id)
    .eq('name', parsed.data.name)
    .neq('id', parsed.data.id)
    .maybeSingle()
  if (duplicate)
    redirect('/dashboard/categories?error=Essa%20categoria%20já%20existe.')
  const { error } = await supabase
    .from('categories')
    .update({ name: parsed.data.name })
    .eq('id', parsed.data.id)
    .eq('user_id', user.id)
  if (error)
    redirect(
      '/dashboard/categories?error=Não%20foi%20possível%20editar%20a%20categoria.',
    )
  redirect('/dashboard/categories')
}

export async function deleteCategory(formData: FormData) {
  const parsed = idSchema.safeParse(formData.get('id'))
  if (!parsed.success)
    redirect('/dashboard/categories?error=Categoria%20inválida.')
  const { supabase, user } = await getUser()
  const { count } = await supabase
    .from('transactions')
    .select('id', { count: 'exact', head: true })
    .eq('category_id', parsed.data)
    .eq('user_id', user.id)
  if ((count ?? 0) > 0)
    redirect(
      '/dashboard/categories?error=Não%20podes%20apagar%20uma%20categoria%20com%20movimentos.%20Reatribui-os%20primeiro.',
    )
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', parsed.data)
    .eq('user_id', user.id)
  if (error)
    redirect(
      '/dashboard/categories?error=Não%20foi%20possível%20apagar%20a%20categoria.',
    )
  redirect('/dashboard/categories')
}

export async function moveCategory(formData: FormData) {
  const parsed = moveSchema.safeParse({
    id: formData.get('id'),
    direction: formData.get('direction'),
  })
  if (!parsed.success)
    redirect('/dashboard/categories?error=Categoria%20inválida.')
  const { supabase, user } = await getUser()
  const { data: categories } = await supabase
    .from('categories')
    .select('id, sort_order')
    .eq('user_id', user.id)
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true })
  const list = categories ?? []
  const index = list.findIndex((item) => item.id === parsed.data.id)
  const targetIndex = parsed.data.direction === 'up' ? index - 1 : index + 1
  if (index < 0 || targetIndex < 0 || targetIndex >= list.length)
    redirect('/dashboard/categories')
  const current = list[index]
  const target = list[targetIndex]
  const { error } = await supabase.from('categories').upsert([
    {
      id: current.id,
      user_id: user.id,
      name:
        list[index].id === current.id
          ? ((
              await supabase
                .from('categories')
                .select('name')
                .eq('id', current.id)
                .single()
            ).data?.name ?? '')
          : '',
      sort_order: target.sort_order,
    },
    {
      id: target.id,
      user_id: user.id,
      name:
        list[targetIndex].id === target.id
          ? ((
              await supabase
                .from('categories')
                .select('name')
                .eq('id', target.id)
                .single()
            ).data?.name ?? '')
          : '',
      sort_order: current.sort_order,
    },
  ])
  if (error)
    redirect(
      '/dashboard/categories?error=Não%20foi%20possível%20reordenar%20as%20categorias.',
    )
  redirect('/dashboard/categories')
}
