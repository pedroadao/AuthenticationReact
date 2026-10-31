import { env } from '../../../config/env'
import { request } from '../../../lib/http/httpClient'
import { createPkceChallenge, savePkceState } from '../../../lib/auth/pkce'
import type { Me, TokenResponse, User } from '../types'

export interface RegisterInput {
  email: string
  displayName: string
  password: string
}

export function register(input: RegisterInput): Promise<User> {
  return request<User>('/api/accounts/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
}

export interface LoginInput {
  email: string
  password: string
}

/**
 * Autentica no backend via cookie de sessão (mesmo endpoint usado pelo fluxo
 * OAuth server-rendered, mas pedindo resposta JSON). O access token em si só
 * é obtido depois, completando o Authorization Code + PKCE em startAuthorize.
 */
export function login(input: LoginInput): Promise<{ succeeded: true }> {
  const body = new URLSearchParams({
    email: input.email,
    password: input.password,
    returnUrl: '/',
  })

  return request<{ succeeded: true }>('/account/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
    },
    body,
  })
}

/** Inicia o fluxo Authorization Code + PKCE navegando para /connect/authorize. */
export async function startAuthorize(returnTo: string): Promise<void> {
  const { codeVerifier, codeChallenge, state } = await createPkceChallenge()
  savePkceState({ codeVerifier, state, returnTo })

  const params = new URLSearchParams({
    client_id: env.VITE_OIDC_CLIENT_ID,
    response_type: 'code',
    redirect_uri: env.VITE_OIDC_REDIRECT_URI,
    scope: env.VITE_OIDC_SCOPE,
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  })

  window.location.href = `${env.VITE_API_BASE_URL}/connect/authorize?${params.toString()}`
}

export function exchangeCodeForToken(code: string, codeVerifier: string): Promise<TokenResponse> {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: env.VITE_OIDC_REDIRECT_URI,
    client_id: env.VITE_OIDC_CLIENT_ID,
    code_verifier: codeVerifier,
  })

  return request<TokenResponse>('/connect/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
}

export function refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: env.VITE_OIDC_CLIENT_ID,
  })

  return request<TokenResponse>('/connect/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
}

export function fetchMe(accessToken: string): Promise<Me> {
  return request<Me>('/api/me', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
}

/** Logout é um fluxo de navegação completa (end-session do OpenIddict), não uma chamada JSON. */
export function logoutRedirect(): void {
  window.location.href = `${env.VITE_API_BASE_URL}/connect/logout`
}
