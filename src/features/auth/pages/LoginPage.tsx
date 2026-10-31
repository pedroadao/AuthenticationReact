import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link, useLocation } from 'react-router-dom'
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
    <main style={{ maxWidth: 360, margin: '3rem auto' }}>
      <h1>Entrar</h1>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div>
          <label htmlFor="email">E-mail</label>
          <input id="email" type="email" autoComplete="username" {...register('email')} />
          {errors.email && <p role="alert" style={{ color: 'crimson' }}>{errors.email.message}</p>}
        </div>

        <PasswordField
          label="Senha"
          autoComplete="current-password"
          register={register('password')}
          error={errors.password?.message}
        />

        {formError && (
          <p role="alert" style={{ color: 'crimson' }}>
            {formError}
          </p>
        )}

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Entrando…' : 'Entrar'}
        </button>
      </form>

      <p>
        Não tem conta? <Link to="/register">Cadastre-se</Link>
      </p>
    </main>
  )
}
