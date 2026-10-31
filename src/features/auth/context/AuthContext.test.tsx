import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { AuthProvider, useAuth } from './AuthContext'
import * as authApi from '../api/authApi'
import * as pkce from '../../../lib/auth/pkce'

vi.mock('../api/authApi')
vi.mock('../../../lib/auth/pkce', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../lib/auth/pkce')>()
  return { ...actual, consumePkceState: vi.fn() }
})

function createWrapper() {
  const queryClient = new QueryClient()
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  )
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('completeCallback autentica o usuário quando o state corresponde', async () => {
    vi.mocked(pkce.consumePkceState).mockReturnValue({
      codeVerifier: 'verifier',
      state: 'abc',
      returnTo: '/dashboard',
    })
    vi.mocked(authApi.exchangeCodeForToken).mockResolvedValue({
      access_token: 'token-123',
      token_type: 'Bearer',
      expires_in: 3600,
    })
    vi.mocked(authApi.fetchMe).mockResolvedValue({ id: '1', email: 'a@b.com', name: 'Ana' })

    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() })

    let returnTo: string | undefined
    await act(async () => {
      returnTo = await result.current.completeCallback('code-xyz', 'abc')
    })

    expect(returnTo).toBe('/dashboard')
    expect(result.current.status).toBe('authenticated')
    expect(result.current.user).toEqual({ id: '1', email: 'a@b.com', name: 'Ana' })
  })

  it('completeCallback rejeita quando o state não corresponde', async () => {
    vi.mocked(pkce.consumePkceState).mockReturnValue({
      codeVerifier: 'verifier',
      state: 'expected',
      returnTo: '/',
    })

    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() })

    await expect(result.current.completeCallback('code-xyz', 'different')).rejects.toThrow()
    expect(authApi.exchangeCodeForToken).not.toHaveBeenCalled()
  })

  it('logout limpa usuário, status e redireciona para o end-session', async () => {
    vi.mocked(pkce.consumePkceState).mockReturnValue({ codeVerifier: 'v', state: 's', returnTo: '/' })
    vi.mocked(authApi.exchangeCodeForToken).mockResolvedValue({
      access_token: 'token-123',
      token_type: 'Bearer',
      expires_in: 3600,
    })
    vi.mocked(authApi.fetchMe).mockResolvedValue({ id: '1', email: 'a@b.com', name: 'Ana' })
    vi.mocked(authApi.logoutRedirect).mockImplementation(() => {})

    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() })

    await act(async () => {
      await result.current.completeCallback('code', 's')
    })

    expect(result.current.status).toBe('authenticated')

    act(() => {
      result.current.logout()
    })

    await waitFor(() => expect(result.current.status).toBe('unauthenticated'))
    expect(result.current.user).toBeNull()
    expect(authApi.logoutRedirect).toHaveBeenCalledOnce()
  })
})
