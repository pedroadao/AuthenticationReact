import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import mkcert from 'vite-plugin-mkcert'
import { defineConfig } from 'vitest/config'

// Pasta onde o certificado HTTPS local é lido/gerado (git-ignorada). Mantida
// dentro do projeto (em vez de ~/.vite-plugin-mkcert) para poder ser montada
// dentro do container Docker do frontend (ver docker-compose.yml em ../Authentication).
const certsDir = resolve(import.meta.dirname, '.certs')
const certFile = resolve(certsDir, 'cert.pem')
const keyFile = resolve(certsDir, 'dev.pem')

const skipMkcert = Boolean(process.env.SKIP_MKCERT)
const hasExistingCerts = existsSync(certFile) && existsSync(keyFile)

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  // Se já existe um certificado em .certs/ (gerado via mkcert com sudo, ou via
  // openssl sem sudo — ver README), reaproveitamos esses arquivos e nunca
  // chamamos o mkcert de novo. Só tentamos o plugin mkcert (que instala uma CA
  // local e precisa de sudo) quando ainda não há nenhum certificado e o usuário
  // não pediu para pular esse passo (SKIP_MKCERT).
  plugins: [
    react(),
    ...(command === 'serve' && !process.env.VITEST && !skipMkcert && !hasExistingCerts
      ? [mkcert({ savePath: certsDir })]
      : []),
  ],
  server: {
    port: 5173,
    strictPort: true,
    host: skipMkcert ? true : undefined,
    https: hasExistingCerts ? { cert: readFileSync(certFile), key: readFileSync(keyFile) } : undefined,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
}))
