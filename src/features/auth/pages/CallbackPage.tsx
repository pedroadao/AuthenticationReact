import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function CallbackPage() {
  const [searchParams] = useSearchParams()
  const { completeCallback } = useAuth()
  const [destination, setDestination] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const ranOnce = useRef(false)

  useEffect(() => {
    if (ranOnce.current) return
    ranOnce.current = true

    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const oauthError = searchParams.get('error_description') ?? searchParams.get('error')

    if (oauthError) {
      setError(oauthError)
      return
    }

    if (!code || !state) {
      setError('Retorno de autenticação inválido.')
      return
    }

    completeCallback(code, state)
      .then((returnTo) => setDestination(returnTo))
      .catch(() => setError('Não foi possível concluir o login. Tente novamente.'))
  }, [searchParams, completeCallback])

  if (destination) return <Navigate to={destination} replace />

  if (error) {
    return (
      <main style={{ maxWidth: 360, margin: '3rem auto' }}>
        <p role="alert" style={{ color: 'crimson' }}>
          {error}
        </p>
        <Link to="/login">Voltar para o login</Link>
      </main>
    )
  }

  return (
    <main style={{ maxWidth: 360, margin: '3rem auto' }}>
      <p>Concluindo login…</p>
    </main>
  )
}
