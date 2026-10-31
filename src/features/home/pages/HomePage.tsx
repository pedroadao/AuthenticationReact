import { useAuth } from '../../auth/context/AuthContext'
import { useMe } from '../../auth/hooks/useMe'

export function HomePage() {
  const { logout } = useAuth()
  const { data: me, isLoading, isError } = useMe()

  return (
    <main style={{ maxWidth: 480, margin: '3rem auto' }}>
      <h1>Área autenticada</h1>

      {isLoading && <p>Carregando dados do usuário…</p>}
      {isError && <p role="alert">Não foi possível carregar seus dados.</p>}
      {me && (
        <ul>
          <li>ID: {me.id}</li>
          <li>Nome: {me.name}</li>
          <li>E-mail: {me.email}</li>
        </ul>
      )}

      <button type="button" onClick={logout}>
        Sair
      </button>
    </main>
  )
}
