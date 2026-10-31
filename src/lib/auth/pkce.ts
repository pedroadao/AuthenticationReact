const PKCE_STORAGE_KEY = 'oauth.pkce'

export interface PkceState {
  codeVerifier: string
  state: string
  returnTo: string
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)

  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function randomBase64Url(byteLength: number): string {
  const bytes = new Uint8Array(byteLength)
  crypto.getRandomValues(bytes)
  return toBase64Url(bytes)
}

async function sha256(value: string): Promise<Uint8Array> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  return new Uint8Array(digest)
}

export async function createPkceChallenge() {
  const codeVerifier = randomBase64Url(32)
  const codeChallenge = toBase64Url(await sha256(codeVerifier))
  const state = randomBase64Url(16)

  return { codeVerifier, codeChallenge, state }
}

/**
 * code_verifier e state são parâmetros transitórios do protocolo OAuth, não
 * tokens: precisam sobreviver à navegação completa até /connect/authorize e
 * de volta, por isso usamos sessionStorage em vez de memória.
 */
export function savePkceState(state: PkceState): void {
  sessionStorage.setItem(PKCE_STORAGE_KEY, JSON.stringify(state))
}

export function consumePkceState(): PkceState | null {
  const raw = sessionStorage.getItem(PKCE_STORAGE_KEY)
  sessionStorage.removeItem(PKCE_STORAGE_KEY)

  if (!raw) return null

  try {
    return JSON.parse(raw) as PkceState
  } catch {
    return null
  }
}
