import { useState } from 'react'
import type { UseFormRegisterReturn } from 'react-hook-form'
import { IconButton, InputAdornment, TextField } from '@mui/material'
import { Visibility, VisibilityOff } from '@mui/icons-material'

interface PasswordFieldProps {
  label: string
  autoComplete: 'current-password' | 'new-password'
  register: UseFormRegisterReturn
  error?: string
}

export function PasswordField({ label, autoComplete, register, error }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false)

  return (
    <TextField
      label={label}
      type={visible ? 'text' : 'password'}
      autoComplete={autoComplete}
      error={Boolean(error)}
      helperText={error}
      fullWidth
      margin="normal"
      slotProps={{
        formHelperText: { role: 'alert' },
        input: {
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                type="button"
                aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
                aria-pressed={visible}
                onClick={() => setVisible((current) => !current)}
                edge="end"
              >
                {visible ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          ),
        },
      }}
      {...register}
    />
  )
}
