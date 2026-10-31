import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  exchangeCodeForToken,
  fetchMe,
  login as loginRequest,
  logoutRedirect,
  refreshAccessToken,
  startAuthorize,
} from '../api/authApi'
import { consumePkceState } from '../../../lib/auth/pkce'
import { HttpError } from '../../../lib/http/httpClient'
import type { Me } from '../types'

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'

interface Tokens {
  accessToken: string
  refreshToken?: string
  expiresAt: number
}

interface AuthContextValue {
  status: AuthStatus
  user: Me | null
  /** Autentica a sessão por cookie e inicia o Authorization Code + PKCE. */
  login: (email: string, password: string, returnTo?: string) => Promise<void>
  /** Conclui o fluxo a partir do retorno de /connect/authorize em /callback. */
  completeCallback: (code: string, state: string) => Promise<string>
  logout: () => void
  /** Retorna um access token válido, renovando-o via refresh token se necessário. */
  getAccessToken: () => Promise<string | null>
}

const AuthContext = createContext<AuthContextValue | null>(null)

const EXPIRY_SAFETY_MARGIN_MS = 10_000

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('unauthenticated')
  const [user, setUser] = useState<Me | null>(null)
  const tokensRef = useRef<Tokens | null>(null)
  const refreshInFlightRef = useRef<Promise<string | null> | null>(null)
  const queryClient = useQueryClient()

  const login = useCallback(async (email: string, password: string, returnTo = '/') => {
    await loginRequest({ email, password })
    await startAuthorize(returnTo)
  }, [])

  const completeCallback = useCallback(async (code: string, state: string) => {
    const pkce = consumePkceState()

    if (!pkce || pkce.state !== state) {
      throw new Error('Estado de autenticação inválido ou expirado. Tente fazer login novamente.')
    }

    const token = await exchangeCodeForToken(code, pkce.codeVerifier)
    tokensRef.current = {
      accessToken: token.access_token,
      refreshToken: token.refresh_token,
      expiresAt: Date.now() + token.expires_in * 1000,
    }

    const me = await fetchMe(token.access_token)
    setUser(me)
    setStatus('authenticated')

    return pkce.returnTo
  }, [])

  const logout = useCallback(() => {
    tokensRef.current = null
    refreshInFlightRef.current = null
    setUser(null)
    setStatus('unauthenticated')
    queryClient.clear()
    logoutRedirect()
  }, [queryClient])

  const refreshTokens = useCallback(async (): Promise<string | null> => {
    const current = tokensRef.current

    if (!current?.refreshToken) {
      tokensRef.current = null
      setUser(null)
      setStatus('unauthenticated')
      return null
    }

    try {
      const token = await refreshAccessToken(current.refreshToken)
      tokensRef.current = {
        accessToken: token.access_token,
        refreshToken: token.refresh_token ?? current.refreshToken,
        expiresAt: Date.now() + token.expires_in * 1000,
      }
      return token.access_token
    } catch (error) {
      tokensRef.current = null
      setUser(null)
      setStatus('unauthenticated')
      if (error instanceof HttpError) return null
      throw error
    }
  }, [])

  const getAccessToken = useCallback(async (): Promise<string | null> => {
    const current = tokensRef.current
    if (!current) return null

    if (current.expiresAt - EXPIRY_SAFETY_MARGIN_MS > Date.now()) {
      return current.accessToken
    }

    if (!refreshInFlightRef.current) {
      refreshInFlightRef.current = refreshTokens().finally(() => {
        refreshInFlightRef.current = null
      })
    }

    return refreshInFlightRef.current
  }, [refreshTokens])

  const value = useMemo<AuthContextValue>(
    () => ({ status, user, login, completeCallback, logout, getAccessToken }),
    [status, user, login, completeCallback, logout, getAccessToken],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider.')
  }

  return context
}
