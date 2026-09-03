'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const localeSchema = z.enum(['pt-PT', 'en'])

export async function updateLocale(formData: FormData) {
  const locale = localeSchema.safeParse(formData.get('locale'))
  if (!locale.success) {
    redirect('/dashboard/settings?error=Idioma%20inválido.')
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { error } = await supabase
    .from('profiles')
    .update({
      locale: locale.data,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  if (error) {
    redirect('/dashboard/settings?error=Não%20foi%20possível%20atualizar%20o%20idioma.')
  }

  redirect('/dashboard/settings?saved=1')
}
