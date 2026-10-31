import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../features/auth/context/AuthContext'

/** Impede acesso a telas como login/registro quando já há sessão ativa. */
export function PublicRoute() {
  const { status } = useAuth()

  if (status === 'authenticated') {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
