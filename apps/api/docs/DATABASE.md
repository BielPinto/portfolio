# PostgreSQL — acesso e comandos básicos (`psql`)

Este projeto usa **PostgreSQL**. No terminal interativo **`psql`**, comandos que começam com **`\`** são *meta-comandos* do cliente; o resto é **SQL** padrão.

> **Importante:** o **nome do banco** (ex.: `portifolio` no `docker-compose.yml`) **não é uma tabela**. Consultas do tipo `SELECT * FROM nome_do_banco` falham. Use **`\dt`** para listar tabelas e depois `SELECT` no **nome da tabela**.

---

## 1. Entrar no banco (Docker Compose)

Execute a partir da pasta que contém o `docker-compose.yml` (ex.: `portifolio_backend`):

```bash
cd caminho/do/portifolio_backend
docker compose exec postgres psql -U portifolio -d portifolio
```

Credenciais padrão deste repositório (serviço `postgres` no compose):

| Campo    | Valor        |
|----------|--------------|
| Usuário  | `portifolio` |
| Senha    | `portifolio` |
| Banco    | `portifolio` |

Se o seu ambiente usar outros nomes (ex.: `portfolio`), ajuste `-U` e `-d`.

**Alternativa** (sem depender do diretório do compose), usando o nome do container:

```bash
docker exec -it NOME_DO_CONTAINER_POSTGRES psql -U portifolio -d portifolio
```

Descubra o nome com: `docker ps`.

---

## 2. Sair e cancelar

| Ação | Comando |
|------|---------|
| Sair do `psql` | `\q` ou `Ctrl+D` |
| Cancelar linha atual / sair de prompt incompleto | `Ctrl+C` |

Se o prompt aparecer como `nome-#` (com hífen), o `psql` está esperando mais linhas até você fechar o SQL com **`;`**. Para desistir, use **`Ctrl+C`**.

---

## 3. Comandos úteis do cliente (`\`)

| Comando | O que faz |
|---------|-----------|
| `\l` ou `\list` | Lista **bancos de dados** |
| `\c nome_do_banco` | Conecta a outro banco |
| `\dt` | Lista **tabelas** do schema `public` |
| `\dt *.*` | Lista tabelas de todos os schemas visíveis |
| `\d nome_tabela` | Descreve colunas, índices e constraints de uma tabela |
| `\dn` | Lista **schemas** |
| `\?` | Ajuda dos comandos `\` |

---

## 4. Contar quantas tabelas existem (SQL)

No schema **`public`**:

```sql
SELECT COUNT(*) AS total_tabelas
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE';
```

Contando também **views** (se houver):

```sql
SELECT table_type, COUNT(*)
FROM information_schema.tables
WHERE table_schema = 'public'
GROUP BY table_type;
```

---

## 5. Listar tabelas e colunas via SQL (opcional)

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

---

## 6. Tabela deste projeto: `contacts`

A migração inicial cria a tabela **`contacts`** (`migrations/001_init.sql`).

**Contar registros:**

```sql
SELECT COUNT(*) FROM contacts;
```

**Ver alguns registros (cuidado com dados sensíveis em ambientes reais):**

```sql
SELECT id, name, email, created_at
FROM contacts
ORDER BY created_at DESC
LIMIT 10;
```

**Estrutura da tabela:**

```sql
\d contacts
```

(ou, em SQL puro:)

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'contacts'
ORDER BY ordinal_position;
```

---

## 7. Erros comuns

| Erro / situação | Causa provável |
|-----------------|----------------|
| `no configuration file provided` | `docker compose` rodado fora da pasta do `docker-compose.yml` — use `cd` para a pasta correta. |
| `SHOW DATABASES` / sintaxe MySQL | No PostgreSQL use **`\l`** ou `SELECT datname FROM pg_database;`. |
| `SELECT * FROM portifolio` com erro | `portifolio` é o **banco**, não uma tabela. Use **`\dt`** e depois `SELECT * FROM nome_da_tabela`. |
| Prompt `nome-#` | SQL incompleto; termine com `;` ou cancele com `Ctrl+C`. |

---

## 8. Uma linha só (sem modo interativo)

```bash
docker compose exec postgres psql -U portifolio -d portifolio -c "SELECT COUNT(*) FROM contacts;"
```

Substitua o SQL pelo que precisar.
