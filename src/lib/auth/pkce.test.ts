import { beforeEach, describe, expect, it } from 'vitest'
import { consumePkceState, createPkceChallenge, savePkceState } from './pkce'

describe('pkce', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  it('gera code_verifier, code_challenge e state distintos', async () => {
    const a = await createPkceChallenge()
    const b = await createPkceChallenge()

    expect(a.codeVerifier).not.toBe(b.codeVerifier)
    expect(a.state).not.toBe(b.state)
    expect(a.codeChallenge).not.toBe(a.codeVerifier)
  })

  it('salva e consome o estado transitório uma única vez', () => {
    savePkceState({ codeVerifier: 'verifier', state: 'state-123', returnTo: '/dashboard' })

    const first = consumePkceState()
    expect(first).toEqual({ codeVerifier: 'verifier', state: 'state-123', returnTo: '/dashboard' })

    const second = consumePkceState()
    expect(second).toBeNull()
  })

  it('retorna null quando não há estado salvo', () => {
    expect(consumePkceState()).toBeNull()
  })
})
