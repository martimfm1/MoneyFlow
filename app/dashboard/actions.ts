'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { REMEMBER_COOKIE } from '@/lib/supabase/session'
import {
  FINANCIAL_CONTEXT_COOKIE,
  FINANCIAL_CONTEXT_MAX_AGE,
  type FinancialContextSlug,
} from '@/lib/financial-context'

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  const cookieStore = await cookies()
  cookieStore.set(REMEMBER_COOKIE, '', {
    httpOnly: true,
    maxAge: 0,
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  })
  redirect('/login')
}


export async function switchFinancialContext(formData: FormData) {
  const value = formData.get('slug')
  if (value !== 'personal' && value !== 'silentra') {
    redirect('/dashboard?error=Espaço%20financeiro%20inválido.')
  }

  const slug: FinancialContextSlug = value
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: context } = await supabase
    .from('financial_contexts')
    .select('id')
    .eq('user_id', user.id)
    .eq('slug', slug)
    .maybeSingle()

  if (!context) {
    redirect('/dashboard?error=Não%20foi%20possível%20abrir%20esse%20espaço.')
  }

  const cookieStore = await cookies()
  cookieStore.set(FINANCIAL_CONTEXT_COOKIE, slug, {
    httpOnly: true,
    maxAge: FINANCIAL_CONTEXT_MAX_AGE,
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  })

  redirect('/dashboard')
}
