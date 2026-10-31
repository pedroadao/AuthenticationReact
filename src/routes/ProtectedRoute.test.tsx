import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from './ProtectedRoute'
import { useAuth } from '../features/auth/context/AuthContext'

vi.mock('../features/auth/context/AuthContext', () => ({
  useAuth: vi.fn(),
}))

function renderWithStatus(status: 'loading' | 'authenticated' | 'unauthenticated') {
  vi.mocked(useAuth).mockReturnValue({
    status,
    user: null,
    login: vi.fn(),
    completeCallback: vi.fn(),
    logout: vi.fn(),
    getAccessToken: vi.fn(),
  })

  return render(
    <MemoryRouter initialEntries={['/private']}>
      <Routes>
        <Route path="/login" element={<p>tela de login</p>} />
        <Route element={<ProtectedRoute />}>
          <Route path="/private" element={<p>conteúdo privado</p>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

describe('ProtectedRoute', () => {
  it('redireciona para /login quando não autenticado', () => {
    renderWithStatus('unauthenticated')
    expect(screen.getByText('tela de login')).toBeInTheDocument()
  })

  it('não renderiza nada enquanto o status ainda está carregando', () => {
    renderWithStatus('loading')
    expect(screen.queryByText('tela de login')).not.toBeInTheDocument()
    expect(screen.queryByText('conteúdo privado')).not.toBeInTheDocument()
  })

  it('renderiza o conteúdo protegido quando autenticado', () => {
    renderWithStatus('authenticated')
    expect(screen.getByText('conteúdo privado')).toBeInTheDocument()
  })
})
