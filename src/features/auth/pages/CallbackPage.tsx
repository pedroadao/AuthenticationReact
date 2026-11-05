import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { Alert, Container, Link as MuiLink, Typography } from '@mui/material'
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
      <Container maxWidth="xs" sx={{ mt: 8 }}>
        <Alert severity="error" role="alert" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <MuiLink component={Link} to="/login">Voltar para o login</MuiLink>
      </Container>
    )
  }

  return (
    <Container maxWidth="xs" sx={{ mt: 8 }}>
      <Typography>Concluindo login…</Typography>
    </Container>
  )
}
