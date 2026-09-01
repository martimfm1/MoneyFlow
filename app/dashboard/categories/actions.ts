'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const schema = z.object({
  name: z.string().trim().min(1).max(50),
})

export async function createCategory(formData: FormData) {
  const parsed = schema.safeParse({ name: formData.get('name') })
  if (!parsed.success)
    redirect('/dashboard/categories?error=Nome%20de%20categoria%20inválido.')

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

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

  const { error } = await supabase.from('categories').insert({
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
