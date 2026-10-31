import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
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
      <main style={{ maxWidth: 360, margin: '3rem auto' }}>
        <h1>Cadastro concluído</h1>
        <p>Sua conta foi criada com sucesso.</p>
        <button type="button" onClick={() => navigate('/login')}>
          Ir para o login
        </button>
      </main>
    )
  }

  return (
    <main style={{ maxWidth: 360, margin: '3rem auto' }}>
      <h1>Criar conta</h1>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div>
          <label htmlFor="displayName">Nome</label>
          <input id="displayName" type="text" autoComplete="name" {...register('displayName')} />
          {errors.displayName && (
            <p role="alert" style={{ color: 'crimson' }}>
              {errors.displayName.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="email">E-mail</label>
          <input id="email" type="email" autoComplete="email" {...register('email')} />
          {errors.email && <p role="alert" style={{ color: 'crimson' }}>{errors.email.message}</p>}
        </div>

        <PasswordField
          label="Senha"
          autoComplete="new-password"
          register={register('password')}
          error={errors.password?.message}
        />

        {formError && (
          <p role="alert" style={{ color: 'crimson' }}>
            {formError}
          </p>
        )}

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Enviando…' : 'Cadastrar'}
        </button>
      </form>

      <p>
        Já tem conta? <Link to="/login">Entrar</Link>
      </p>
    </main>
  )
}
