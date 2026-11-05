import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link, useLocation } from 'react-router-dom'
import { Alert, Box, Button, Container, Link as MuiLink, TextField, Typography } from '@mui/material'
import { useAuth } from '../context/AuthContext'
import { HttpError } from '../../../lib/http/httpClient'
import { loginSchema, type LoginFormValues } from '../schemas/loginSchema'
import { PasswordField } from '../../../components/ui/PasswordField'

export function LoginPage() {
  const { login } = useAuth()
  const location = useLocation()
  const returnTo = (location.state as { from?: string } | null)?.from ?? '/'
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) })

  const onSubmit = async (values: LoginFormValues) => {
    setFormError(null)

    try {
      // Navega para o fluxo OAuth em caso de sucesso; a página é substituída,
      // então não há necessidade de tratar um "retorno" aqui.
      await login(values.email, values.password, returnTo)
    } catch (error) {
      if (error instanceof HttpError && (error.kind === 'unauthorized' || error.kind === 'validation')) {
        setFormError(error.message)
        return
      }

      setFormError('Não foi possível entrar agora. Tente novamente em alguns instantes.')
    }
  }

  return (
    <Container maxWidth="xs" sx={{ mt: 8 }}>
      <Typography component="h1" variant="h5" gutterBottom>
        Entrar
      </Typography>
      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <TextField
          id="email"
          label="E-mail"
          type="email"
          autoComplete="username"
          fullWidth
          margin="normal"
          error={Boolean(errors.email)}
          helperText={errors.email?.message}
          slotProps={{ formHelperText: { role: 'alert' } }}
          {...register('email')}
        />

        <PasswordField
          label="Senha"
          autoComplete="current-password"
          register={register('password')}
          error={errors.password?.message}
        />

        {formError && (
          <Alert severity="error" role="alert" sx={{ mt: 2 }}>
            {formError}
          </Alert>
        )}

        <Button type="submit" variant="contained" fullWidth disabled={isSubmitting} sx={{ mt: 3 }}>
          {isSubmitting ? 'Entrando…' : 'Entrar'}
        </Button>
      </Box>

      <Typography sx={{ mt: 2 }}>
        Não tem conta? <MuiLink component={Link} to="/register">Cadastre-se</MuiLink>
      </Typography>
    </Container>
  )
}
