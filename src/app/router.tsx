import { Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from '../routes/ProtectedRoute'
import { PublicRoute } from '../routes/PublicRoute'
import { LoginPage } from '../features/auth/pages/LoginPage'
import { RegisterPage } from '../features/auth/pages/RegisterPage'
import { CallbackPage } from '../features/auth/pages/CallbackPage'
import { HomePage } from '../features/home/pages/HomePage'

export function AppRouter() {
  return (
    <Routes>
      <Route element={<PublicRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      <Route path="/callback" element={<CallbackPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<HomePage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
