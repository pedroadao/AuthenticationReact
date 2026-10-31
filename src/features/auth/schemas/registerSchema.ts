import { z } from 'zod'

export const registerSchema = z.object({
  displayName: z.string().min(1, 'Informe o nome.'),
  email: z.string().min(1, 'Informe o e-mail.').email('E-mail inválido.'),
  password: z.string().min(8, 'A senha deve ter ao menos 8 caracteres.'),
})

export type RegisterFormValues = z.infer<typeof registerSchema>
