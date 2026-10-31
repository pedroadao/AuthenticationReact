import { useId, useState } from 'react'
import type { UseFormRegisterReturn } from 'react-hook-form'

interface PasswordFieldProps {
  label: string
  autoComplete: 'current-password' | 'new-password'
  register: UseFormRegisterReturn
  error?: string
}

export function PasswordField({ label, autoComplete, register, error }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false)
  const inputId = useId()
  const errorId = useId()

  return (
    <div>
      <label htmlFor={inputId}>{label}</label>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <input
          id={inputId}
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          {...register}
        />
        <button type="button" onClick={() => setVisible((current) => !current)} aria-pressed={visible}>
          {visible ? 'Ocultar' : 'Mostrar'}
        </button>
      </div>
      {error && (
        <p id={errorId} role="alert" style={{ color: 'crimson' }}>
          {error}
        </p>
      )}
    </div>
  )
}
