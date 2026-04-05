# Portfolio — front-end (`apps/web`)

SPA em React + TypeScript + Vite. **Arquitetura e convenções**: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md). **Testes E2E**: [docs/E2E.md](docs/E2E.md).

Este pacote faz parte do monorepo: instalação e scripts via **pnpm** na **raiz** do repositório (`portfolio/`). Nome do pacote: `@portfolio/web`.

## Pré-requisitos

- **Node.js** 22+ (recomendado: LTS)
- **pnpm** 9+ (o monorepo fixa a versão em `packageManager` na raiz)

## Instalação

Na raiz do monorepo:

```bash
pnpm install
```

## Como rodar

Na raiz do monorepo, ou com filtro:

| Comando | Uso |
|--------|-----|
| `pnpm dev` | Turbo: API + web em paralelo (se ambos tiverem script `dev`). |
| `pnpm --filter @portfolio/web dev` | Servidor de desenvolvimento (HMR). Por padrão `http://localhost:5173`. |
| `pnpm --filter @portfolio/web build` | Build de produção (`dist/`). |
| `pnpm --filter @portfolio/web preview` | Servir o build localmente. |
| `pnpm --filter @portfolio/web lint` | ESLint. |
| `pnpm --filter @portfolio/web test:e2e` | Playwright (ver [docs/E2E.md](docs/E2E.md)). |

### Desenvolvimento com a API Go

1. Suba o backend (`pnpm --filter @portfolio/api dev`, ou `docker compose -f infra/docker/docker-compose.yml up --build` a partir da raiz do monorepo) na porta **8080** por padrão.
2. Rode `pnpm --filter @portfolio/web dev` (ou `pnpm dev`).
3. O Vite encaminha para o Go:
   - tudo sob **`/api`** → `http://127.0.0.1:8080` (ou `VITE_API_PROXY_TARGET`);
   - **`POST /contact`** → mesma API (o `GET /contact` continua no Vite para servir a página React).
4. O formulário usa **`POST /contact`** com `{ name, email, message }`, alinhado ao que o backend expõe hoje. A rota versionada **`POST /api/v1/public/contact`** existe no código-fonte da API; se o `curl` para essa URL retornar 404, **reconstrua a imagem** (`docker compose up --build`) — imagens antigas só tinham `/contact` na raiz.

Com isso, **não é obrigatório** definir `VITE_API_BASE_URL` no dev.

Se a API estiver em outro host/porta no dev, use `VITE_API_PROXY_TARGET` (só o servidor Vite lê isso; não vai para o bundle do browser).

### Build de produção

Se o site estático e a API estiverem em **origens diferentes** (ex.: site na Vercel, API em outro domínio), defina **`VITE_API_BASE_URL`** no momento do build com a URL pública da API (sem barra no final). O backend precisa permitir a origem do front em **CORS** (`CORS_ORIGINS` no serviço Go).

Exemplo:

```bash
VITE_API_BASE_URL=https://api.seudominio.com npm run build
```

## Variáveis de ambiente (`.env`)

O Vite só expõe ao código do cliente variáveis cujo nome começa com **`VITE_`**. Crie um arquivo **`.env`** em `apps/web` (ao lado do `package.json`). Não commite segredos; o `.env` costuma estar no `.gitignore`.

Exemplo típico para **desenvolvimento local** com proxy (a maioria das linhas pode ficar comentada ou omitida):

```env
# Opcional: URL absoluta da API no bundle (produção ou quando não usa o proxy do Vite).
# Vazio = mesma origem do site; em dev, use o proxy /api → backend.
# VITE_API_BASE_URL=

# Só desenvolvimento: para onde o Vite encaminha /api (default: http://127.0.0.1:8080)
# VITE_API_PROXY_TARGET=http://127.0.0.1:8080
```

Exemplo para **build apontando para uma API em outro domínio**:

```env
VITE_API_BASE_URL=https://api.seudominio.com
```

Após alterar `.env`, reinicie `npm run dev` ou rode o build de novo — o Vite lê essas variáveis na subida.

## Resumo dos scripts npm

- `npm run dev` — desenvolvimento
- `npm run build` — produção
- `npm run preview` — pré-visualizar `dist/`
- `npm run lint` — lint
- `npm run test:e2e` / `test:e2e:ui` / `test:e2e:headed` — Playwright
