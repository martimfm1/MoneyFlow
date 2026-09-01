import { z } from 'zod'

export const signInSchema = z.object({
  email: z.string().trim().email('Introduz um email válido.'),
  password: z
    .string()
    .min(8, 'A palavra-passe deve ter pelo menos 8 caracteres.'),
})

export const signUpSchema = signInSchema.extend({
  displayName: z
    .string()
    .trim()
    .min(1, 'Indica o teu nome.')
    .max(80, 'O nome é demasiado longo.'),
})

export type SignInInput = z.infer<typeof signInSchema>
export type SignUpInput = z.infer<typeof signUpSchema>
