# Requisitos, arquitetura e perfis de acesso — `portifolio_backend`

Documento derivado do código e da configuração atuais do serviço HTTP em Go (Gin + PostgreSQL). Descreve o que o sistema faz hoje, restrições de qualidade e a organização técnica.

---

## 1. Visão geral do produto

API REST para um portfólio web: **verificação de saúde** (incluindo conectividade com o banco) e **recebimento de mensagens de formulário de contato** persistidas em PostgreSQL. Há um **namespace administrativo opcional** protegido por chave de API (sem cadastro de usuários no banco). Documentação interativa OpenAPI em `/swagger`.

---

## 2. Tipos de usuários (atores)

O backend **não implementa contas de usuário** (sem tabela de `users`, login ou JWT de visitante). Os atores são:

| Ator | Descrição | Autenticação | Uso típico |
|------|-----------|--------------|------------|
| **Visitante / cliente público** | Quem acessa o site e envia o formulário de contato | Nenhuma | `GET` health, `POST` contact |
| **Operador / integração administrativa** | Ferramentas internas, scripts ou futuros painéis | Chave estática `ADMIN_API_KEY` (`X-Admin-Key` ou `Authorization: Bearer`) | `GET /api/v1/admin/*` (hoje apenas `status`) |
| **Infraestrutura** | Balanceadores, orquestradores, monitoramento | Nenhuma (apenas rede) | `GET` health para probes |

**Observação:** O “admin” é um **segredo compartilhado** configurado no ambiente, não um perfil com múltiplos usuários ou auditoria por identidade.

---

## 3. Requisitos funcionais

### 3.1 Saúde do serviço

| ID | Requisito |
|----|-----------|
| RF-01 | O sistema deve expor verificação de saúde em `GET /health` e `GET /api/v1/public/health`. |
| RF-02 | A resposta deve incluir `status`, `version` e, quando houver pool de banco, indicação de conectividade (`database`: `ok` ou indisponível). |
| RF-03 | Se o ping ao PostgreSQL falhar dentro do tempo limite, o endpoint deve responder com **503** e corpo indicando indisponibilidade. |

### 3.2 Contato (formulário)

| ID | Requisito |
|----|-----------|
| RF-04 | O sistema deve aceitar envio de contato em `POST /contact` e `POST /api/v1/public/contact` com corpo JSON: `name`, `email`, `message`. |
| RF-05 | Campos obrigatórios e limites: nome e mensagem com tamanho máximo alinhado ao modelo (nome até 255 runes, email até 320 caracteres, mensagem até 10000 runes); email deve ser endereço válido e “cru” (sem nome de exibição). |
| RF-06 | Em sucesso, responder **201** com `id` (UUID) e `created_at` do registro criado. |
| RF-07 | Em erro de validação, responder **400** com estrutura de erro (`validation_error` / detalhes por campo quando aplicável). |
| RF-08 | Persistir cada submissão na tabela `contacts` (PostgreSQL), com `id` gerado (extensão `pgcrypto` / `gen_random_uuid()` na migração). |
| RF-09 | Após persistir, o caso de uso pode publicar evento `ContactCreated` via porta `EventPublisher` (implementação atual: no-op; preparado para fila/e-mail/etc.). |

### 3.3 Administração (opcional)

| ID | Requisito |
|----|-----------|
| RF-10 | Se `ADMIN_API_KEY` estiver definida no ambiente, o sistema deve registrar o grupo de rotas `/api/v1/admin` com middleware de autenticação por chave. |
| RF-11 | Com chave válida em `X-Admin-Key` ou `Authorization: Bearer <chave>`, `GET /api/v1/admin/status` deve retornar **200** com `{"status":"ok"}`. |
| RF-12 | Sem chave ou com chave inválida, as rotas admin devem responder **401**. |
| RF-13 | Se `ADMIN_API_KEY` estiver vazia, o grupo admin **não** é registrado. |

### 3.4 Documentação da API

| ID | Requisito |
|----|-----------|
| RF-14 | Servir documentação Swagger em `/swagger/index.html` com especificação gerada a partir das anotações dos handlers. |

### 3.5 Compatibilidade de rotas

| ID | Requisito |
|----|-----------|
| RF-15 | Manter rotas “legadas” na raiz (`/health`, `/contact`) em paralelo ao prefixo versionado `/api/v1/public/...` para o mesmo comportamento. |

---

## 4. Requisitos não funcionais

### 4.1 Confiabilidade e dados

| ID | Requisito |
|----|-----------|
| RNF-01 | Usar PostgreSQL como fonte de verdade; conexão via pool (`pgxpool`). |
| RNF-02 | Aplicar migrações SQL embutidas na ordem lexicográfica na subida da aplicação. |
| RNF-03 | Encerramento gracioso do servidor HTTP ao receber `SIGINT`/`SIGTERM` (timeout de shutdown configurado no código). |

### 4.2 Desempenho e proteção

| ID | Requisito |
|----|-----------|
| RNF-04 | Rate limiting **em memória** por IP (formato [ulule/limiter](https://github.com/ulule/limiter)), configurável por `RATE_LIMIT`; desligável com vazio, `0`, `off` ou `false`. |
| RNF-05 | Requisições `GET` em caminhos que terminam em `/health` **não** contam para o rate limit (tráfego de probe). |
| RNF-06 | Valor padrão de limite quando não configurado: `100-M` (100 requisições por minuto por IP), conforme `config.Load()`. |

### 4.3 Segurança

| ID | Requisito |
|----|-----------|
| RNF-07 | Comparação da chave admin com `subtle.ConstantTimeCompare` para reduzir vazamento por timing. |
| RNF-08 | CORS: métodos `GET`, `POST`, `OPTIONS`; cabeçalhos `Origin`, `Content-Type`, `Accept`; `AllowCredentials: false`. Origens permitidas via `CORS_ORIGINS` (lista separada por vírgula); se vazio, permite qualquer origem. |
| RNF-09 | Imagem Docker final **distroless**, usuário não root; binário estático (`CGO_ENABLED=0`). |

### 4.4 Observabilidade

| ID | Requisito |
|----|-----------|
| RNF-10 | Logging estruturado com `slog`, nível configurável (`LOG_LEVEL`: debug, info, warn, error). |
| RNF-11 | ID de requisição propagado no middleware; log por requisição com método, path, status, duração e `request_id`. |
| RNF-12 | Middleware de recuperação de pânico com resposta genérica de erro interno. |

### 4.5 Erros e contratos HTTP

| ID | Requisito |
|----|-----------|
| RNF-13 | Erros de validação e binding retornam JSON padronizado (`error`, `message`, `details` opcional). |
| RNF-14 | Erros internos não expõem detalhes sensíveis ao cliente (`internal_error` / mensagem genérica). |
| RNF-15 | Rate limit excedido: **429**; falha interna do store do limiter: **500**. |

### 4.6 Configuração e implantação

| ID | Requisito |
|----|-----------|
| RNF-16 | Configuração por variáveis de ambiente: `PORT`, `DATABASE_URL` ou `DB_*`, `LOG_LEVEL`, `RATE_LIMIT`, `ADMIN_API_KEY`, `CORS_ORIGINS`. |
| RNF-17 | `docker-compose` sobe PostgreSQL 16 com healthcheck; a API depende do Postgres saudável. |
| RNF-18 | Timeout de leitura de cabeçalhos HTTP do servidor: 10s; timeout de ping no health: 2s. |

### 4.7 Qualidade e extensibilidade

| ID | Requisito |
|----|-----------|
| RNF-19 | Arquitetura em camadas (handlers → services → repositories) com injeção de dependências em `main`. |
| RNF-20 | Portas (`internal/ports`) para eventos, e-mail, assistente e geo com implementações no-op até adapters reais. |
| RNF-21 | Testes de integração (build tag `integration`) com Postgres via Testcontainers cobrindo health, contact e admin. |

### 4.8 Stack (referência)

- **Go** 1.25+ (`go.mod`), **Gin**, **pgx/v5**, **validator/v10**, **swag**, **gin-cors**, **ulule/limiter**.

---

## 5. Arquitetura

### 5.1 Estilo e camadas

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

### 5.2 Dados

- Tabela **`contacts`**: `id` (UUID PK), `name`, `email` (VARCHAR 320), `message`, `created_at` (TIMESTAMPTZ).
- Índice `idx_contacts_created_at` para consultas por data (ordem descendente).

### 5.3 Fluxo principal — envio de contato

1. Cliente envia `POST` com JSON.
2. Handler valida binding básico (Gin/validator).
3. Service normaliza (trim), valida email com `net/mail` e limites de tamanho.
4. Repository executa `INSERT ... RETURNING id, created_at`.
5. Service chama `EventPublisher.PublishContactCreated` (no-op hoje).
6. Resposta **201** com `id` e `created_at`.

### 5.4 Implantação (alto nível)

- **API:** container build multi-stage → imagem mínima distroless.
- **Banco:** PostgreSQL 16 (Compose local); URL única `DATABASE_URL` em produção típica.

---

## 6. Escopo futuro (implícito no código/README)

- Rotas admin adicionais (listagem/estatísticas de contatos).
- Substituir `NoOpEventPublisher` por fila ou webhooks.
- Adapters reais para mailer, assistente e geo em `internal/ports`.

Este documento reflete o **estado atual do repositório**; evoluções devem atualizar esta página junto com o código.
