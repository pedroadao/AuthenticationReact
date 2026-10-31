# AuthenticationReact

Frontend React que consome a API [`Authentication`](../Authentication) (.NET 10 + ASP.NET Core Minimal APIs + OpenIddict + Identity), autenticando usuários via **OAuth 2.0 / OpenID Connect com Authorization Code Flow + PKCE**.

As regras de arquitetura e segurança deste projeto estão detalhadas em [`CLAUDE.md`](./CLAUDE.md). Este README resume o que foi implementado e como rodar o projeto.

## Stack

- React 19 + TypeScript (`strict: true`)
- Vite
- React Router
- TanStack Query (cache/sincronização de dados remotos)
- React Hook Form + Zod (formulários e validação)
- Vitest + React Testing Library (testes)
- Oxlint (lint)

## Pré-requisitos

- Node.js e npm
- A API `Authentication` rodando localmente (`dotnet run` no projeto `src/API`)

## Configuração

Copie o arquivo de exemplo e ajuste se necessário:

```bash
cp .env.example .env.local
```

Variáveis utilizadas (todas visíveis no bundle do navegador — nunca coloque segredos aqui):

```dotenv
VITE_API_BASE_URL=https://localhost:7179
VITE_OIDC_CLIENT_ID=spa-client
VITE_OIDC_REDIRECT_URI=https://localhost:5173/callback
VITE_OIDC_SCOPE=openid email profile offline_access
```

Esses valores correspondem ao client público `spa-client` pré-cadastrado no ambiente de desenvolvimento da API (`DevelopmentSeed.cs`).

## Executando

```bash
npm install
npm run dev
```

A aplicação sobe em `https://localhost:5173` — HTTPS é necessário porque o backend só aceita essa URL exata de redirect e o cookie de sessão exige conexão segura.

### Certificado HTTPS local

Você precisa de um certificado em `.certs/cert.pem` + `.certs/dev.pem` (pasta git-ignorada) antes do primeiro `npm run dev`. Duas formas de gerar, dependendo se você tem a senha do seu usuário no computador:

**Com a senha do seu usuário (certificado confiável, sem avisos no navegador):**

```bash
npm run dev
# na primeira vez, o vite-plugin-mkcert instala uma CA local e pode pedir sua senha
```

**Sem precisar de senha nenhuma** (gera um certificado autoassinado "simples" com OpenSSL; o navegador vai mostrar um aviso de site não seguro na primeira visita a cada origem — é só clicar em "Avançado" → "Continuar/Prosseguir", uma única vez por navegador, sem exigir senha do sistema):

```bash
mkdir -p .certs
openssl req -x509 -newkey rsa:2048 -keyout .certs/dev.pem -out .certs/cert.pem \
  -days 825 -nodes -subj "/CN=localhost" \
  -addext "subjectAltName=DNS:localhost,IP:127.0.0.1,IP:::1"
SKIP_MKCERT=1 npm run dev
```

Depois de gerado uma vez (por qualquer um dos dois métodos), `npm run dev` sempre reaproveita os arquivos existentes em `.certs/` e nunca tenta rodar o `mkcert` de novo.

Se você usou o método sem senha, visite uma vez cada uma destas URLs no navegador que for usar a aplicação e aceite o aviso de certificado ("Avançado" → "Continuar"):

- `https://localhost:5173` (este frontend)
- `https://localhost:8443` (a API, rodando localmente ou via Docker)

Isso não exige senha do sistema — é uma decisão só do navegador, válida para aquele perfil.

## Rodando com Docker

O `docker-compose.yml` que orquestra todo o ambiente (Postgres + API + este frontend) vive no repositório [`Authentication`](../Authentication), um nível acima deste projeto.

```bash
cd ../Authentication
docker compose up -d
```

Isso sobe três serviços:

- `postgres` — banco de dados da API.
- `api` — a API `.NET`, em modo `Development` (para que o client OAuth `spa-client` seja cadastrado automaticamente), publicada em `https://localhost:8443`.
- `web` — este projeto, rodando `npm run dev` com hot-reload dentro do container (`Dockerfile.dev`), publicado em `https://localhost:5173`. O código-fonte é montado como volume, então alterações no seu editor refletem imediatamente no container.

### Certificado HTTPS no container

O container do frontend roda com `SKIP_MKCERT=1` e **não** tenta instalar certificado nenhum — ele só reaproveita, via bind mount read-only, os arquivos que já existem em `.certs/` no host (ver seção "Certificado HTTPS local" acima e `vite.config.ts`). Gere esses arquivos (com ou sem senha, como descrito acima) **antes** de subir o Docker pela primeira vez; sem eles, o container ainda sobe, mas serve em HTTP simples, e o fluxo OAuth completo (que exige `https://localhost:5173/callback`) falha.

### Certificado HTTPS da API

A API também espera um certificado Kestrel em `./certs/https-dev.pfx` (dentro do repositório `Authentication`) e as variáveis de ambiente descritas no topo do `docker-compose.yml` dele. Para gerar um sem precisar de senha nenhuma do sistema, dentro do repositório `Authentication`:

```bash
openssl req -x509 -newkey rsa:2048 -keyout /tmp/https-dev.key -out /tmp/https-dev.crt \
  -days 825 -nodes -subj "/CN=localhost" \
  -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"
openssl pkcs12 -export -out certs/https-dev.pfx -inkey /tmp/https-dev.key -in /tmp/https-dev.crt \
  -passout "pass:$ASPNETCORE_Kestrel__Certificates__Default__Password"
rm /tmp/https-dev.key /tmp/https-dev.crt
```

Use a mesma senha definida no `.env` do backend. Esse certificado é independente do do frontend — por isso é preciso aceitar o aviso do navegador separadamente em `https://localhost:8443` (ver acima).

## Scripts disponíveis

| Comando | Descrição |
| --- | --- |
| `npm run dev` | Inicia o servidor de desenvolvimento (HTTPS). |
| `npm run build` | Verifica tipos (`tsc -b`) e gera o build de produção. |
| `npm run typecheck` | Verifica tipos sem gerar build. |
| `npm run lint` | Executa o Oxlint. |
| `npm run test` | Executa os testes (Vitest). |
| `npm run preview` | Serve o build de produção localmente. |

## Fluxo de autenticação

1. **Login** (`/login`): o formulário envia e-mail/senha para `POST /account/login` (com `Accept: application/json`), que autentica via cookie de sessão no backend.
2. Em caso de sucesso, o navegador é redirecionado para `/connect/authorize` com os parâmetros PKCE (`code_challenge`, `state` etc.) — como já existe sessão, o backend redireciona direto para `/callback` com o `code`.
3. **Callback** (`/callback`): troca o `code` por tokens em `POST /connect/token`. O `access_token`/`refresh_token` ficam **apenas em memória** (nunca em `localStorage`/`sessionStorage`); somente os parâmetros transitórios do PKCE (`code_verifier`, `state`) passam por `sessionStorage` durante a navegação.
4. **Área autenticada** (`/`): busca os dados do usuário em `GET /api/me` com o `access_token` no cabeçalho `Authorization`.
5. **Logout**: navega para `/connect/logout` (end-session do OpenIddict), limpando o estado local e o cache do TanStack Query antes.
6. **Cadastro** (`/register`): formulário para `POST /api/accounts/register`.

Nenhum endpoint, escopo ou formato de resposta foi inventado — o contrato segue exatamente o que a API `Authentication` expõe.

## Estrutura de pastas

```text
src/
├── app/            # App.tsx, router.tsx, providers.tsx
├── components/ui/  # componentes de apresentação reutilizáveis
├── config/         # validação de variáveis de ambiente
├── features/
│   ├── auth/       # login, registro, callback, contexto de autenticação
│   └── home/       # área autenticada (/api/me)
├── lib/
│   ├── http/       # cliente HTTP central com erros tipados
│   └── auth/       # geração e validação do PKCE
├── routes/         # ProtectedRoute / PublicRoute
└── test/           # setup do Vitest
```

## Testes

```bash
npm run test
```

Cobertura atual: validação do formulário de login, geração/consumo do estado PKCE, redirecionamento de rotas protegidas e o ciclo de autenticação/logout no `AuthContext`.
