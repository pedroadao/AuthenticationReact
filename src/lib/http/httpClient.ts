import { env } from '../../config/env'

export type HttpErrorKind =
  | 'validation'
  | 'unauthorized'
  | 'forbidden'
  | 'notFound'
  | 'rateLimited'
  | 'server'
  | 'network'
  | 'unknown'

export class HttpError extends Error {
  readonly kind: HttpErrorKind
  readonly status: number | null
  readonly body: unknown

  constructor(kind: HttpErrorKind, message: string, status: number | null, body: unknown) {
    super(message)
    this.name = 'HttpError'
    this.kind = kind
    this.status = status
    this.body = body
  }
}

function kindFromStatus(status: number): HttpErrorKind {
  if (status === 401) return 'unauthorized'
  if (status === 403) return 'forbidden'
  if (status === 404) return 'notFound'
  if (status === 429) return 'rateLimited'
  if (status === 400 || status === 422) return 'validation'
  if (status >= 500) return 'server'
  return 'unknown'
}

async function parseBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type') ?? ''

  if (!contentType.includes('application/json')) return null

  try {
    return await response.json()
  } catch {
    return null
  }
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  headers?: Record<string, string>
  body?: BodyInit
  signal?: AbortSignal
  credentials?: RequestCredentials
  /** Absolute URL to call instead of joining with the API base URL (e.g. OpenIddict /connect/* endpoints). */
  absoluteUrl?: string
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const url = options.absoluteUrl ?? `${env.VITE_API_BASE_URL}${path}`

  let response: Response
  try {
    response = await fetch(url, {
      method: options.method ?? 'GET',
      headers: options.headers,
      body: options.body,
      signal: options.signal,
      credentials: options.credentials ?? 'include',
    })
  } catch (error) {
    throw new HttpError('network', 'Não foi possível conectar ao servidor.', null, error)
  }

  const body = await parseBody(response)

  if (!response.ok) {
    const kind = kindFromStatus(response.status)
    const message =
      (typeof body === 'object' && body !== null && 'error' in body && typeof (body as Record<string, unknown>).error === 'string'
        ? ((body as Record<string, unknown>).error as string)
        : null) ?? defaultMessageFor(kind)

    throw new HttpError(kind, message, response.status, body)
  }

  return body as T
}

function defaultMessageFor(kind: HttpErrorKind): string {
  switch (kind) {
    case 'validation':
      return 'Os dados enviados são inválidos.'
    case 'unauthorized':
      return 'Sessão inválida ou expirada.'
    case 'forbidden':
      return 'Você não tem permissão para realizar esta ação.'
    case 'notFound':
      return 'Recurso não encontrado.'
    case 'rateLimited':
      return 'Muitas tentativas. Tente novamente em breve.'
    case 'server':
      return 'O servidor encontrou um erro. Tente novamente mais tarde.'
    default:
      return 'Ocorreu um erro inesperado.'
  }
}
