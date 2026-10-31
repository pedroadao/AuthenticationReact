export interface User {
  id: string
  email: string
  displayName: string
}

export interface Me {
  id: string
  email: string
  name: string
}

export interface TokenResponse {
  access_token: string
  token_type: string
  expires_in: number
  refresh_token?: string
  id_token?: string
}
