# CLAUDE.md — Frontend React para autenticação

Este arquivo define as regras para desenvolver uma aplicação frontend em React que consome uma API de autenticação. Siga estas orientações em todas as alterações realizadas no projeto.

## 1. Objetivo do projeto

Construir uma aplicação web segura, acessível, testável e de fácil manutenção para autenticar usuários por meio de uma API externa.

A aplicação frontend é responsável por:
- Apresentar telas de login, logout e, quando suportado pela API, cadastro e recuperação de senha.
- Iniciar e concluir o fluxo de autenticação definido pelo backend.
- Manter o estado de autenticação da interface.
- Enviar credenciais de acesso nas requisições protegidas.
- Tratar expiração de sessão, erros de autenticação e ausência de autorização.
- Não implementar regras de autenticação que pertencem ao backend.

**Regra principal:** a API é a fonte de verdade para autenticação, autorização, usuários, permissões e validade dos tokens. Nunca simule uma autenticação bem-sucedida em produção.

## 2. Stack tecnológica

Utilize preferencialmente:

- React na versão estável compatível com o projeto.
- TypeScript com `strict: true`.
- Vite para desenvolvimento e build.
- React Router para navegação.
- TanStack Query para cache, sincronização e gerenciamento de requisições assíncronas, quando houver necessidade.
- React Hook Form para formulários.
- Zod para validação de dados no frontend.
- Fetch API ou Axios para comunicação HTTP. Escolha uma opção e mantenha consistência.
- Vitest e React Testing Library para testes unitários e de componentes.
- Playwright para testes ponta a ponta, quando aplicável.
- ESLint e Prettier para qualidade e padronização do código.

Não adicione bibliotecas sem necessidade. Antes de instalar uma dependência, verifique se a funcionalidade já pode ser atendida pelas ferramentas existentes.

## 3. Compatibilidade com a API de autenticação

O backend esperado utiliza .NET 10, ASP.NET Core Minimal APIs e OAuth 2.0 / OpenID Connect, preferencialmente com Authorization Code Flow + PKCE para clientes públicos.

Antes de implementar a integração:

1. Leia a documentação da API e confirme os endpoints disponíveis.
2. Verifique se existe documento OpenID Connect Discovery (`/.well-known/openid-configuration`).
3. Identifique `issuer`, `authorization_endpoint`, `token_endpoint`, `jwks_uri`, `userinfo_endpoint` e `end_session_endpoint`, quando publicados.
4. Confirme os escopos, parâmetros, formato das respostas e política de renovação de tokens.
5. Confirme com o backend se o frontend deve usar uma arquitetura SPA com PKCE ou um Backend for Frontend (BFF) com sessão por cookie.
6. Documente qualquer divergência entre o contrato real da API e as expectativas deste arquivo.

**Não invente endpoints, parâmetros, claims, escopos ou formatos de resposta.** Utilize exclusivamente o contrato documentado pelo backend. Não presuma que existem endpoints como `/login`, `/refresh` ou `/me` sem confirmação.

### Fluxo OAuth/OIDC

- Para uma SPA que conversa diretamente com o provedor, utilize Authorization Code Flow com PKCE (S256).
- Não utilize Implicit Flow nem Resource Owner Password Credentials Grant.
- Gere `code_verifier` e `code_challenge` conforme a especificação, utilizando biblioteca OIDC/OAuth consolidada sempre que possível.
- Valide `state` e `nonce` conforme o fluxo e a biblioteca adotados.
- Valide emissor, audiência, assinatura, validade e demais requisitos dos tokens no local apropriado. A validação definitiva de autorização deve permanecer no backend.
- Não implemente manualmente criptografia, assinatura ou validação JWT quando uma biblioteca confiável e mantida atender ao caso.
- Se o backend oferecer BFF, prefira avaliar essa arquitetura para aplicações de produção: o navegador mantém uma sessão por cookie `HttpOnly`, `Secure` e `SameSite` adequado, e os tokens ficam no servidor.
- Não misture estratégias de armazenamento de token. A arquitetura escolhida deve estar documentada.

## 4. Segurança e gerenciamento de tokens

Segurança é requisito obrigatório, não uma melhoria opcional.

### Armazenamento

- Nunca armazene access tokens, refresh tokens, senhas ou segredos em `localStorage`, `sessionStorage`, IndexedDB ou cookies acessíveis por JavaScript.
- Em uma SPA com tokens, mantenha-os preferencialmente apenas em memória e aceite que uma atualização completa da página poderá exigir nova autenticação, salvo se houver mecanismo seguro definido pelo provedor.
- Em arquitetura BFF, utilize cookies de sessão `HttpOnly`, `Secure` e `SameSite` conforme a necessidade do fluxo.
- Nunca exponha `client_secret` em código frontend, variáveis `VITE_*`, arquivos de configuração ou bundles. Um frontend distribuído ao navegador é um cliente público.
- Não registre tokens, senhas, códigos de autorização, cookies ou dados pessoais em logs, mensagens de erro ou ferramentas de analytics.

### Renovação e expiração

- Siga o mecanismo oficial de renovação definido pelo provedor.
- Se houver refresh token em SPA, exija suporte explícito do provedor a clientes públicos, rotação e detecção de reutilização, conforme aplicável.
- Evite múltiplas renovações simultâneas: implemente coordenação de refresh para que requisições concorrentes compartilhem a mesma operação.
- Ao receber `401`, tente renovar a sessão somente quando o contrato permitir e no máximo conforme a política definida; se falhar, limpe o estado local e direcione o usuário ao fluxo de autenticação.
- Não faça loop infinito de renovação ou repetição de requisições.
- Diferencie `401 Unauthorized` de `403 Forbidden`: o primeiro indica ausência de autenticação válida; o segundo indica falta de permissão.

### XSS, CSRF e transporte

- Não utilize `dangerouslySetInnerHTML`, salvo necessidade justificada e com sanitização robusta.
- Não renderize HTML recebido da API sem sanitização.
- Não desabilite mecanismos de segurança do navegador.
- Utilize HTTPS em todos os ambientes, exceto desenvolvimento local controlado.
- Se a autenticação usar cookies, avalie e implemente proteção CSRF conforme a arquitetura do backend. `SameSite` isoladamente não deve ser tratado como solução universal.
- Configure CORS no backend com origens explícitas. Nunca recomende liberar `*` com credenciais.
- Não coloque informações sensíveis em query strings ou fragmentos de URL.

## 5. Estrutura de pastas

Organize o código por funcionalidade, mantendo responsabilidades separadas. Uma estrutura inicial sugerida:

```text
src/
├── app/
│   ├── App.tsx
│   ├── router.tsx
│   └── providers.tsx
├── assets/
├── components/
│   ├── layout/
│   └── ui/
├── config/
│   └── env.ts
├── features/
│   └── auth/
│       ├── api/
│       │   └── authApi.ts
│       ├── components/
│       ├── hooks/
│       ├── pages/
│       │   ├── LoginPage.tsx
│       │   └── CallbackPage.tsx
│       ├── schemas/
│       ├── types/
│       └── utils/
├── lib/
│   ├── http/
│   │   └── httpClient.ts
│   └── auth/
├── routes/
│   ├── ProtectedRoute.tsx
│   └── PublicRoute.tsx
├── styles/
├── test/
└── main.tsx
```

Ajuste a estrutura conforme o tamanho real da aplicação. Evite criar abstrações ou diretórios vazios sem uso concreto.

## 6. TypeScript e qualidade do código

- Utilize TypeScript em todos os componentes e módulos novos.
- Mantenha `strict: true` e corrija erros de tipagem; não use `any` para contornar problemas.
- Prefira `unknown` quando o tipo de um dado externo não for conhecido e valide-o antes do uso.
- Defina tipos para requests, responses, erros e modelos utilizados pela interface.
- Não duplique tipos desnecessariamente.
- Evite componentes extensos. Extraia componentes, hooks e funções quando houver responsabilidade clara.
- Mantenha componentes de apresentação separados de regras de integração quando isso melhorar a clareza.
- Prefira componentes funcionais e hooks.
- Evite estado global. Use estado local por padrão e Context apenas para estado realmente compartilhado, como a sessão do usuário.
- Não armazene no frontend dados que podem ser derivados de outros estados.
- Não suprima regras do ESLint sem justificativa.

## 7. Comunicação HTTP

Centralize a comunicação com a API em um cliente HTTP.

O cliente deve:
- Utilizar a URL base definida por configuração de ambiente.
- Definir headers comuns de forma consistente.
- Incluir credenciais ou access token conforme a arquitetura escolhida.
- Tratar respostas não-2xx de maneira padronizada.
- Converter erros de rede e respostas inesperadas em erros tipados.
- Aplicar timeout quando apropriado.
- Permitir cancelamento de requisições com `AbortController` quando fizer sentido.
- Evitar repetição automática de operações não idempotentes.
- Não incluir tokens ou dados sensíveis em mensagens de erro.

Não espalhe chamadas `fetch` ou `axios` diretamente pelos componentes. A camada de API deve concentrar os detalhes de integração.

### Configuração de ambiente

Utilize variáveis de ambiente para configurações públicas, por exemplo:

```dotenv
VITE_API_BASE_URL=https://localhost:7001
VITE_OIDC_AUTHORITY=https://identity.example.com
VITE_OIDC_CLIENT_ID=react-client
```

Os nomes acima são exemplos e devem ser ajustados ao ambiente real.

- Variáveis `VITE_*` são incorporadas ao bundle e ficam visíveis no navegador. Nunca coloque segredos nelas.
- Valide as variáveis obrigatórias na inicialização da aplicação.
- Mantenha um `.env.example` sem credenciais reais.
- Adicione `.env`, `.env.local` e arquivos com segredos ao `.gitignore`.
- Não utilize valores de produção como fallback silencioso em desenvolvimento.

## 8. Autenticação e autorização na interface

- Centralize o estado de autenticação em um contexto ou solução equivalente.
- Exponha operações claras, como `login`, `logout` e `getCurrentUser`, somente quando suportadas pela integração.
- Modele estados como `loading`, `authenticated` e `unauthenticated`.
- Não considere o usuário autenticado apenas porque existe um token armazenado; siga o estado validado pelo fluxo de autenticação.
- Proteja rotas privadas na interface, preservando a URL de destino quando apropriado.
- Rotas protegidas no frontend melhoram a experiência, mas **não substituem autorização no backend**.
- O backend deve validar permissões em todas as operações protegidas.
- Não confie em roles, claims, IDs ou permissões enviados pelo cliente sem validação no servidor.
- Não exiba telas protegidas enquanto a aplicação ainda estiver verificando a sessão.
- Ao sair, limpe os dados privados em memória e o cache de consultas associado ao usuário.
- Evite que dados de um usuário permaneçam visíveis após troca de sessão.

## 9. Formulários e experiência do usuário

- Utilize React Hook Form e Zod quando a complexidade do formulário justificar.
- Valide os campos no frontend para melhorar a experiência, mas considere o backend como validador definitivo.
- Nunca armazene senha em estado global, logs ou cache persistente.
- Utilize `type="password"` nos campos de senha e permita exibir/ocultar a senha de forma acessível.
- Utilize `autocomplete` apropriado, como `username`, `email` e `current-password`.
- Exiba mensagens de erro claras, sem revelar detalhes internos da API.
- Preserve os dados não sensíveis do formulário quando ocorrer erro, quando isso for seguro.
- Desabilite o botão de envio durante o processamento para evitar submissões duplicadas.
- Apresente estados de carregamento, sucesso e falha.
- Não informe se um e-mail está cadastrado em fluxos de recuperação de senha, a menos que a política de segurança da API permita explicitamente.

## 10. Acessibilidade e interface

- Utilize HTML semântico.
- Associe cada campo a um `label`.
- Garanta navegação por teclado e foco visível.
- Não dependa apenas de cor para comunicar erros ou estados.
- Exponha mensagens dinâmicas com atributos ARIA adequados, como `aria-live`, quando necessário.
- Mantenha contraste adequado e suporte a zoom.
- Garanta que diálogos, menus e componentes interativos sejam acessíveis.
- Não implemente componentes visuais complexos quando um elemento HTML nativo resolver o problema.

## 11. Tratamento de erros

Crie uma estratégia consistente para:
- Erros de validação (`400` ou `422`, conforme o contrato).
- Falha de autenticação (`401`).
- Falta de permissão (`403`).
- Recurso inexistente (`404`).
- Limite de requisições (`429`).
- Indisponibilidade ou erro interno do servidor (`5xx`).
- Falhas de rede, timeout e respostas inválidas.

Regras:
- Mostre mensagens úteis e compreensíveis ao usuário.
- Não mostre stack traces, detalhes internos, connection strings ou informações sensíveis.
- Preserve detalhes técnicos apenas em logs seguros de desenvolvimento, sem credenciais ou tokens.
- Não trate qualquer erro como falha de autenticação.
- Não redirecione para login em erros `403`, `404` ou `5xx` sem uma razão específica.

## 12. Testes

Todo comportamento relevante deve possuir testes.

### Testes unitários e de componentes

Utilize Vitest e React Testing Library para testar:
- Validação dos formulários.
- Estados de carregamento, sucesso e erro.
- Comportamento dos componentes de autenticação.
- Proteção e redirecionamento de rotas.
- Tratamento de respostas `401` e `403`.
- Limpeza de estado e cache no logout.
- Cenários de sessão expirada.

### Testes de integração e ponta a ponta

Quando aplicável, utilize Playwright para cobrir:
- Acesso a páginas públicas e privadas.
- Fluxo de login com ambiente de teste.
- Callback de autenticação.
- Logout.
- Sessão expirada.
- Falhas de rede e indisponibilidade da API.

Não utilize credenciais reais em testes. Não faça testes contra o provedor de produção. Prefira mocks controlados para testes automatizados e um ambiente de identidade isolado para validar o fluxo OAuth/OIDC real.

## 13. Desempenho

- Evite renderizações desnecessárias e otimizações prematuras.
- Utilize lazy loading para rotas ou módulos grandes quando trouxer benefício.
- Evite carregar bibliotecas pesadas sem necessidade.
- Configure cache de dados remotos com política coerente com a sessão.
- Limpe ou invalide dados em cache quando o usuário sair ou mudar.
- Não armazene respostas privadas em cache compartilhado entre usuários.
- Utilize paginação ou carregamento incremental quando a API disponibilizar grandes volumes de dados.

## 14. Padrões de nomenclatura

- Componentes React: `PascalCase` (ex.: `LoginPage.tsx`).
- Hooks: prefixo `use` (ex.: `useAuth.ts`).
- Funções e variáveis: `camelCase`.
- Constantes: `UPPER_SNAKE_CASE` quando representarem valores constantes globais.
- Tipos e interfaces: `PascalCase`.
- Arquivos de API: nome da funcionalidade seguido de `Api` (ex.: `authApi.ts`).
- Prefira nomes claros e relacionados ao domínio.

## 15. Git e versionamento

- Utilize commits pequenos e com mensagens descritivas.
- Não versione `.env`, tokens, certificados privados, senhas ou arquivos de configuração com segredos.
- Mantenha `.env.example` atualizado.
- Não inclua `node_modules`, `dist`, relatórios temporários ou arquivos de IDE no Git.
- Não faça alterações em arquivos fora do escopo solicitado.
- Antes de concluir uma tarefa, verifique `git diff` para identificar alterações acidentais.

## 16. Comandos e validações

Adapte os scripts ao `package.json` real. Antes de finalizar uma alteração, execute os comandos disponíveis equivalentes a:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

Se algum script não existir, não afirme que ele foi executado. Informe a limitação e, quando apropriado, proponha a inclusão do script.

A entrega deve:
- Compilar sem erros.
- Não introduzir erros de TypeScript.
- Passar pelo lint.
- Passar pelos testes relevantes.
- Não conter segredos ou tokens.
- Manter o contrato da API.
- Ter comportamento de erro e carregamento tratado.

## 17. Regras para o Claude Code

Ao trabalhar neste repositório:

1. Primeiro inspecione a estrutura, o `package.json`, as configurações e a documentação existente.
2. Identifique o padrão já adotado antes de propor mudanças estruturais.
3. Não reescreva arquivos ou módulos inteiros sem necessidade.
4. Não altere contratos da API nem invente endpoints.
5. Não instale dependências sem explicar a necessidade.
6. Não remova testes existentes para fazer a suíte passar.
7. Não desative TypeScript strict, ESLint ou verificações de segurança para contornar erros.
8. Faça alterações pequenas, coesas e compatíveis com o restante do projeto.
9. Crie ou atualize testes para cada comportamento novo ou alterado.
10. Ao concluir, apresente um resumo das mudanças, arquivos afetados, comandos executados e eventuais pendências.

## 18. Critérios de aceite

Uma funcionalidade está concluída quando:
- Atende ao requisito solicitado.
- Consome a API conforme o contrato documentado.
- Trata carregamento, sucesso e falha.
- Não expõe credenciais, tokens ou informações sensíveis.
- Possui testes proporcionais ao risco e à complexidade.
- É acessível e responsiva.
- Passa pelas validações disponíveis de lint, TypeScript, testes e build.
- Está documentada quando introduz configuração ou comportamento relevante.

---

**Princípio final:** mantenha o frontend simples e previsível. A aplicação deve cuidar da experiência do usuário e da integração, enquanto a API permanece responsável por autenticação, emissão e validação de tokens, identidade e autorização.
