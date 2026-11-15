'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const contextSchema = z.enum(['personal', 'silentra', 'general'])

export async function setFinanceContext(value: string) {
  const parsed = contextSchema.safeParse(value)
  if (!parsed.success) return { error: 'Contexto inválido.' }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'A sessão expirou. Inicia sessão novamente.' }

  const { error } = await supabase
    .from('profiles')
    .update({
      active_finance_context: parsed.data,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  if (error) return { error: 'Não foi possível alterar o contexto financeiro.' }

  revalidatePath('/dashboard')
  return { ok: true }
}
