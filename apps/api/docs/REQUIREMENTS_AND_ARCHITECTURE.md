# Requisitos, arquitetura e perfis de acesso — `portifolio_backend`

**English version:** [REQUIREMENTS_AND_ARCHITECTURE.en.md](./REQUIREMENTS_AND_ARCHITECTURE.en.md)

Documento derivado do código e da configuração atuais do serviço HTTP em Go (Gin + PostgreSQL). Descreve o que o sistema faz hoje, restrições de qualidade, organização técnica e **como o front-end [`portifolio_web`](../../portifolio_web/) consome a API** (URLs e CORS).

---

## 1. Visão geral do produto

API REST para um portfólio web: **verificação de saúde** (incluindo conectividade com o banco) e **recebimento de mensagens de formulário de contato** persistidas em PostgreSQL. Há um **namespace administrativo opcional** protegido por chave de API (sem cadastro de usuários no banco). Documentação interativa OpenAPI em `/swagger`.

---

## 2. Integração com `portifolio_web` (URLs e CORS)

O repositório irmão **`portifolio_web`** (Vite + React) está alinhado aos endpoints e ao payload `{ name, email, message }` da API. Referências: [`portifolio_web/README.md`](../../portifolio_web/README.md), [`portifolio_web/src/config/api.ts`](../../portifolio_web/src/config/api.ts), [`portifolio_web/vite.config.ts`](../../portifolio_web/vite.config.ts).

### 2.1 Desenvolvimento local

| Peça | Valor típico |
|------|----------------|
| Front (Vite) | `http://localhost:5173` (porta padrão do `npm run dev`) |
| API Go | `http://127.0.0.1:8080` (porta padrão `PORT` do backend) |

- O **proxy do Vite** encaminha para a API (`VITE_API_PROXY_TARGET`, padrão `http://127.0.0.1:8080`):
  - **`/api`** → backend (útil para rotas que começam com `/api` no mesmo host).
  - **`POST /contact`** → backend; **`GET` / `HEAD` em `/contact`** não passam pelo proxy (o Vite serve a página React da rota `/contact`).
- Com **`VITE_API_BASE_URL` vazio** (padrão), o formulário chama `fetch('/contact', …)` — mesma origem que o dev server — e o Vite redireciona só o **POST** ao Go.
- A rota versionada **`POST /api/v1/public/contact`** existe no backend com o mesmo contrato; o front usa hoje **`POST /contact`** (`CONTACT_SUBMIT_PATH`).

### 2.2 Produção — site e API em origens diferentes

Ex.: site estático na Vercel e API em outro domínio.

1. Build do front com **`VITE_API_BASE_URL`** apontando para a URL pública da API **sem barra no final** (ex.: `https://api.seudominio.com`).
2. No backend, definir **`CORS_ORIGINS`** com a **origem exata** do site (esquema + host + porta se houver), separada por vírgulas se forem várias — ex.: `https://www.seudominio.com,https://seudominio.com`.
3. O `fetch` do contato usa **`POST`**, cabeçalho **`Content-Type: application/json`** e corpo JSON; isso é compatível com a configuração CORS atual do Gin (`AllowMethods`: `GET`, `POST`, `OPTIONS`; `AllowHeaders`: `Origin`, `Content-Type`, `Accept`).

Se **`CORS_ORIGINS` estiver vazio**, o servidor permite **qualquer origem** (`AllowAllOrigins`), o que facilita o dev, mas em produção com API pública é preferível restringir às origens do front.

### 2.3 Produção — mesma origem (reverse proxy)

Se o HTML do SPA e a API forem servidos pelo **mesmo host** (ex.: nginx na frente dos dois), **`VITE_API_BASE_URL`** pode ficar vazio e o navegador chama caminhos relativos — **sem requisito extra de CORS** para esse fluxo.

### 2.4 Testes E2E contra a API

Os testes Playwright do front podem exercitar a API diretamente quando **`PLAYWRIGHT_API_URL`** está definida (ex.: `http://127.0.0.1:8080`): `GET /health`, `POST /contact`. Ver [`portifolio_web/e2e/api.spec.ts`](../../portifolio_web/e2e/api.spec.ts).

---

## 3. Tipos de usuários (atores)

O backend **não implementa contas de usuário** (sem tabela de `users`, login ou JWT de visitante). Os atores são:

| Ator | Descrição | Autenticação | Uso típico |
|------|-----------|--------------|------------|
| **Visitante / cliente público** | Quem acessa o site e envia o formulário de contato | Nenhuma | `GET` health, `POST` contact |
| **Operador / integração administrativa** | Ferramentas internas, scripts ou futuros painéis | Chave estática `ADMIN_API_KEY` (`X-Admin-Key` ou `Authorization: Bearer`) | `GET /api/v1/admin/*` (hoje apenas `status`) |
| **Infraestrutura** | Balanceadores, orquestradores, monitoramento | Nenhuma (apenas rede) | `GET` health para probes |

**Observação:** O “admin” é um **segredo compartilhado** configurado no ambiente, não um perfil com múltiplos usuários ou auditoria por identidade.

---

## 4. Requisitos funcionais

### 4.1 Saúde do serviço

| ID | Requisito |
|----|-----------|
| RF-01 | O sistema deve expor verificação de saúde em `GET /health` e `GET /api/v1/public/health`. |
| RF-02 | A resposta deve incluir `status`, `version` e, quando houver pool de banco, indicação de conectividade (`database`: `ok` ou indisponível). |
| RF-03 | Se o ping ao PostgreSQL falhar dentro do tempo limite, o endpoint deve responder com **503** e corpo indicando indisponibilidade. |

### 4.2 Contato (formulário)

| ID | Requisito |
|----|-----------|
| RF-04 | O sistema deve aceitar envio de contato em `POST /contact` e `POST /api/v1/public/contact` com corpo JSON: `name`, `email`, `message`. |
| RF-05 | Campos obrigatórios e limites: nome e mensagem com tamanho máximo alinhado ao modelo (nome até 255 runes, email até 320 caracteres, mensagem até 10000 runes); email deve ser endereço válido e “cru” (sem nome de exibição). |
| RF-06 | Em sucesso, responder **201** com `id` (UUID) e `created_at` do registro criado. |
| RF-07 | Em erro de validação, responder **400** com estrutura de erro (`validation_error` / detalhes por campo quando aplicável). |
| RF-08 | Persistir cada submissão na tabela `contacts` (PostgreSQL), com `id` gerado (extensão `pgcrypto` / `gen_random_uuid()` na migração). |
| RF-09 | Após persistir, o caso de uso pode publicar evento `ContactCreated` via porta `EventPublisher` (implementação atual: no-op; preparado para fila/e-mail/etc.). |

### 4.3 Administração (opcional)

| ID | Requisito |
|----|-----------|
| RF-10 | Se `ADMIN_API_KEY` estiver definida no ambiente, o sistema deve registrar o grupo de rotas `/api/v1/admin` com middleware de autenticação por chave. |
| RF-11 | Com chave válida em `X-Admin-Key` ou `Authorization: Bearer <chave>`, `GET /api/v1/admin/status` deve retornar **200** com `{"status":"ok"}`. |
| RF-12 | Sem chave ou com chave inválida, as rotas admin devem responder **401**. |
| RF-13 | Se `ADMIN_API_KEY` estiver vazia, o grupo admin **não** é registrado. |

### 4.4 Documentação da API

| ID | Requisito |
|----|-----------|
| RF-14 | Servir documentação Swagger em `/swagger/index.html` com especificação gerada a partir das anotações dos handlers. |

### 4.5 Compatibilidade de rotas

| ID | Requisito |
|----|-----------|
| RF-15 | Manter rotas “legadas” na raiz (`/health`, `/contact`) em paralelo ao prefixo versionado `/api/v1/public/...` para o mesmo comportamento. |

---

## 5. Requisitos não funcionais

### 5.1 Confiabilidade e dados

| ID | Requisito |
|----|-----------|
| RNF-01 | Usar PostgreSQL como fonte de verdade; conexão via pool (`pgxpool`). |
| RNF-02 | Aplicar migrações SQL embutidas na ordem lexicográfica na subida da aplicação. |
| RNF-03 | Encerramento gracioso do servidor HTTP ao receber `SIGINT`/`SIGTERM` (timeout de shutdown configurado no código). |

### 5.2 Desempenho e proteção

| ID | Requisito |
|----|-----------|
| RNF-04 | Rate limiting **em memória** por IP (formato [ulule/limiter](https://github.com/ulule/limiter)), configurável por `RATE_LIMIT`; desligável com vazio, `0`, `off` ou `false`. |
| RNF-05 | Requisições `GET` em caminhos que terminam em `/health` **não** contam para o rate limit (tráfego de probe). |
| RNF-06 | Valor padrão de limite quando não configurado: `100-M` (100 requisições por minuto por IP), conforme `config.Load()`. |

### 5.3 Segurança

| ID | Requisito |
|----|-----------|
| RNF-07 | Comparação da chave admin com `subtle.ConstantTimeCompare` para reduzir vazamento por timing. |
| RNF-08 | CORS: métodos `GET`, `POST`, `OPTIONS`; cabeçalhos `Origin`, `Content-Type`, `Accept`; `AllowCredentials: false`. Origens permitidas via `CORS_ORIGINS` (lista separada por vírgula); se vazio, permite qualquer origem. Para o **`portifolio_web`** hospedado em domínio diferente da API, incluir a origem exata do front em `CORS_ORIGINS` (ver **§2.2**). |
| RNF-09 | Imagem Docker final **distroless**, usuário não root; binário estático (`CGO_ENABLED=0`). |

### 5.4 Observabilidade

| ID | Requisito |
|----|-----------|
| RNF-10 | Logging estruturado com `slog`, nível configurável (`LOG_LEVEL`: debug, info, warn, error). |
| RNF-11 | ID de requisição propagado no middleware; log por requisição com método, path, status, duração e `request_id`. |
| RNF-12 | Middleware de recuperação de pânico com resposta genérica de erro interno. |

### 5.5 Erros e contratos HTTP

| ID | Requisito |
|----|-----------|
| RNF-13 | Erros de validação e binding retornam JSON padronizado (`error`, `message`, `details` opcional). |
| RNF-14 | Erros internos não expõem detalhes sensíveis ao cliente (`internal_error` / mensagem genérica). |
| RNF-15 | Rate limit excedido: **429**; falha interna do store do limiter: **500**. |

### 5.6 Configuração e implantação

| ID | Requisito |
|----|-----------|
| RNF-16 | Configuração por variáveis de ambiente: `PORT`, `DATABASE_URL` ou `DB_*`, `LOG_LEVEL`, `RATE_LIMIT`, `ADMIN_API_KEY`, `CORS_ORIGINS`. |
| RNF-17 | `docker-compose` sobe PostgreSQL 16 com healthcheck; a API depende do Postgres saudável. |
| RNF-18 | Timeout de leitura de cabeçalhos HTTP do servidor: 10s; timeout de ping no health: 2s. |

### 5.7 Qualidade e extensibilidade

| ID | Requisito |
|----|-----------|
| RNF-19 | Arquitetura em camadas (handlers → services → repositories) com injeção de dependências em `main`. |
| RNF-20 | Portas (`internal/ports`) para eventos, e-mail, assistente e geo com implementações no-op até adapters reais. |
| RNF-21 | Testes de integração (build tag `integration`) com Postgres via Testcontainers cobrindo health, contact e admin. |

### 5.8 Stack (referência)

- **Go** 1.25+ (`go.mod`), **Gin**, **pgx/v5**, **validator/v10**, **swag**, **gin-cors**, **ulule/limiter**.

---

## 6. Arquitetura

### 6.1 Estilo e camadas

O projeto segue **Clean Architecture** em termos de separação de responsabilidades:

```
┌─────────────────────────────────────────────────────────────┐
│  cmd/api/main.go — composição: config, DB, migrate, DI, HTTP │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐    ┌─────────────────┐    ┌──────────────────┐
│ internal/     │    │ internal/       │    │ internal/        │
│ handlers      │───▶│ services        │───▶│ repositories     │
│ (HTTP, bind)  │    │ (validação,     │    │ (SQL PostgreSQL) │
│               │    │  orquestração)  │    │                  │
└───────────────┘    └────────┬────────┘    └────────┬─────────┘
        │                     │                      │
        │                     ▼                      ▼
        │            ┌─────────────────┐    ┌──────────────────┐
        │            │ internal/ports  │    │ PostgreSQL       │
        │            │ (interfaces)    │    │ (contacts)       │
        │            └─────────────────┘    └──────────────────┘
        ▼
┌───────────────┐
│ middleware    │  request id, recovery, log, CORS, rate limit, admin key
└───────────────┘
```

- **Handlers:** binding JSON, códigos HTTP, mapeamento de erros de validação.
- **Services:** regras de negócio e validação de domínio do contato; emissão de eventos via interface.
- **Repositories:** apenas acesso a dados (INSERT em `contacts`).
- **Ports:** contratos para integrações futuras (fila, e-mail, LLM, geolocalização).

### 6.2 Dados

- Tabela **`contacts`**: `id` (UUID PK), `name`, `email` (VARCHAR 320), `message`, `created_at` (TIMESTAMPTZ).
- Índice `idx_contacts_created_at` para consultas por data (ordem descendente).

### 6.3 Fluxo principal — envio de contato

1. Cliente envia `POST` com JSON.
2. Handler valida binding básico (Gin/validator).
3. Service normaliza (trim), valida email com `net/mail` e limites de tamanho.
4. Repository executa `INSERT ... RETURNING id, created_at`.
5. Service chama `EventPublisher.PublishContactCreated` (no-op hoje).
6. Resposta **201** com `id` e `created_at`.

### 6.4 Implantação (alto nível)

- **API:** container build multi-stage → imagem mínima distroless.
- **Banco:** PostgreSQL 16 (Compose local); URL única `DATABASE_URL` em produção típica.

### 6.5 Visão com o front-end

Em desenvolvimento, o **browser** fala só com o origin do Vite; o **servidor de dev** encaminha `POST /contact` (e `/api`) ao Go. Em produção cross-origin, o **browser** fala direto com a URL em `VITE_API_BASE_URL`, sujeito a **CORS** no backend (**§2**).

---

## 7. Escopo futuro (implícito no código/README)

- Rotas admin adicionais (listagem/estatísticas de contatos).
- Substituir `NoOpEventPublisher` por fila ou webhooks.
- Adapters reais para mailer, assistente e geo em `internal/ports`.

Este documento reflete o **estado atual do repositório**; evoluções devem atualizar esta página junto com o código.
