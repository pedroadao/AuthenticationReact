import { z } from 'zod'

const envSchema = z.object({
  VITE_API_BASE_URL: z.string().url(),
  VITE_OIDC_CLIENT_ID: z.string().min(1),
  VITE_OIDC_REDIRECT_URI: z.string().url(),
  VITE_OIDC_SCOPE: z.string().min(1),
})

function loadEnv() {
  const result = envSchema.safeParse(import.meta.env)

  if (!result.success) {
    throw new Error(
      `Variáveis de ambiente inválidas ou ausentes: ${result.error.issues
        .map((issue) => issue.path.join('.'))
        .join(', ')}`,
    )
  }

  return result.data
}

export const env = loadEnv()
