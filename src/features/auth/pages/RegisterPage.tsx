import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { Alert, Box, Button, Container, Link as MuiLink, TextField, Typography } from '@mui/material'
import { register as registerUser } from '../api/authApi'
import { HttpError } from '../../../lib/http/httpClient'
import { registerSchema, type RegisterFormValues } from '../schemas/registerSchema'
import { PasswordField } from '../../../components/ui/PasswordField'

export function RegisterPage() {
  const navigate = useNavigate()
  const [formError, setFormError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({ resolver: zodResolver(registerSchema) })

  const onSubmit = async (values: RegisterFormValues) => {
    setFormError(null)

    try {
      await registerUser(values)
      setSuccess(true)
    } catch (error) {
      if (error instanceof HttpError) {
        if (error.status === 409) {
          setFormError('Este e-mail já está cadastrado.')
          return
        }
        if (error.kind === 'validation') {
          setFormError(error.message)
          return
        }
      }

      setFormError('Não foi possível concluir o cadastro agora. Tente novamente em alguns instantes.')
    }
  }

  if (success) {
    return (
      <Container maxWidth="xs" sx={{ mt: 8 }}>
        <Typography component="h1" variant="h5" gutterBottom>
          Cadastro concluído
        </Typography>
        <Typography>Sua conta foi criada com sucesso.</Typography>
        <Button type="button" variant="contained" onClick={() => navigate('/login')} sx={{ mt: 3 }}>
          Ir para o login
        </Button>
      </Container>
    )
  }

  return (
    <Container maxWidth="xs" sx={{ mt: 8 }}>
      <Typography component="h1" variant="h5" gutterBottom>
        Criar conta
      </Typography>
      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <TextField
          id="displayName"
          label="Nome"
          type="text"
          autoComplete="name"
          fullWidth
          margin="normal"
          error={Boolean(errors.displayName)}
          helperText={errors.displayName?.message}
          slotProps={{ formHelperText: { role: 'alert' } }}
          {...register('displayName')}
        />

        <TextField
          id="email"
          label="E-mail"
          type="email"
          autoComplete="email"
          fullWidth
          margin="normal"
          error={Boolean(errors.email)}
          helperText={errors.email?.message}
          slotProps={{ formHelperText: { role: 'alert' } }}
          {...register('email')}
        />

        <PasswordField
          label="Senha"
          autoComplete="new-password"
          register={register('password')}
          error={errors.password?.message}
        />

        {formError && (
          <Alert severity="error" role="alert" sx={{ mt: 2 }}>
            {formError}
          </Alert>
        )}

        <Button type="submit" variant="contained" fullWidth disabled={isSubmitting} sx={{ mt: 3 }}>
          {isSubmitting ? 'Enviando…' : 'Cadastrar'}
        </Button>
      </Box>

      <Typography sx={{ mt: 2 }}>
        Já tem conta? <MuiLink component={Link} to="/login">Entrar</MuiLink>
      </Typography>
    </Container>
  )
}
