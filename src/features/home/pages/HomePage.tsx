import { Alert, Button, Container, List, ListItem, ListItemText, Typography } from '@mui/material'
import { useAuth } from '../../auth/context/AuthContext'
import { useMe } from '../../auth/hooks/useMe'

export function HomePage() {
  const { logout } = useAuth()
  const { data: me, isLoading, isError } = useMe()

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Typography component="h1" variant="h5" gutterBottom>
        Área autenticada
      </Typography>

      {isLoading && <Typography>Carregando dados do usuário…</Typography>}
      {isError && (
        <Alert severity="error" role="alert">
          Não foi possível carregar seus dados.
        </Alert>
      )}
      {me && (
        <List>
          <ListItem>
            <ListItemText primary={`ID: ${me.id}`} />
          </ListItem>
          <ListItem>
            <ListItemText primary={`Nome: ${me.name}`} />
          </ListItem>
          <ListItem>
            <ListItemText primary={`E-mail: ${me.email}`} />
          </ListItem>
        </List>
      )}

      <Button type="button" variant="outlined" onClick={logout} sx={{ mt: 2 }}>
        Sair
      </Button>
    </Container>
  )
}
