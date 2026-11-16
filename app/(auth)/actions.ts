'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { REMEMBER_COOKIE, SESSION_MAX_AGE } from '@/lib/supabase/session'
import { signInSchema, signUpSchema } from '@/lib/validations/auth'

export type AuthState = { error?: string }

export async function signIn(
  _state: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = signInSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!parsed.success)
    return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }

  const supabase = await createClient({ remember: true })
  const { error } = await supabase.auth.signInWithPassword(parsed.data)

  if (!error) {
    const cookieStore = await cookies()
    cookieStore.set(REMEMBER_COOKIE, '1', {
      httpOnly: true,
      maxAge: SESSION_MAX_AGE,
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    })
  }

  if (error)
    return {
      error: 'Não foi possível entrar. Confirma o email e a palavra-passe.',
    }

  const userId = (await supabase.auth.getUser()).data.user?.id ?? ''
  const { data: personalContext } = await supabase
    .from('financial_contexts')
    .select('id')
    .eq('user_id', userId)
    .eq('slug', 'personal')
    .maybeSingle()

  const { count } = await supabase
    .from('accounts')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('context_id', personalContext?.id ?? '')

  redirect(count ? '/dashboard' : '/onboarding')
}

export async function signUp(
  _state: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = signUpSchema.safeParse({
    displayName: formData.get('displayName'),
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!parsed.success)
    return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { data: { display_name: parsed.data.displayName } },
  })

  if (error)
    return { error: 'Não foi possível criar a conta. Tenta novamente.' }

  if (data.session) {
    const cookieStore = await cookies()
    cookieStore.set(REMEMBER_COOKIE, '1', {
      httpOnly: true,
      maxAge: SESSION_MAX_AGE,
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    })
    redirect('/onboarding')
  }
  redirect('/login?message=Confirma%20o%20teu%20email%20para%20continuar.')
}
