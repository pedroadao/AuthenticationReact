import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import { fetchMe } from '../api/authApi'
import { HttpError } from '../../../lib/http/httpClient'

export function useMe() {
  const { getAccessToken, logout } = useAuth()

  return useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const accessToken = await getAccessToken()

      if (!accessToken) {
        throw new HttpError('unauthorized', 'Sessão inválida ou expirada.', 401, null)
      }

      try {
        return await fetchMe(accessToken)
      } catch (error) {
        if (error instanceof HttpError && error.kind === 'unauthorized') {
          logout()
        }
        throw error
      }
    },
    retry: false,
  })
}
