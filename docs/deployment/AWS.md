# Roteiro AWS 100% executavel (Docker -> Docker em cloud)

Runbook pratico para publicar o portfolio em AWS sem Kubernetes, usando:

- API em **`App Runner`** *ou* **`ECS Fargate` + ALB** (imagem no `ECR`)
- Front em `S3 + CloudFront`
- Banco em `RDS PostgreSQL`
- Segredos em `Secrets Manager`

**Escolha um runtime para a API:** use a **secao 5A (ECS Fargate)** *ou* as **secoes 5-6 (App Runner)** — nao as duas. Depois defina `API_PUBLIC_URL` e siga a partir da secao 7.

## 0) Pre-requisitos locais

- AWS CLI v2 configurado (`aws configure`)
- Docker
- `jq`
- Permissoes AWS para: ECR, RDS, S3, CloudFront, App Runner, ECS, ELB (ALB), EC2 (VPC/SG), CloudWatch Logs, Secrets Manager, IAM

Teste rapido:

```bash
aws sts get-caller-identity
docker --version
jq --version
```

## 1) Variaveis de ambiente (copiar e ajustar)

> Execute no root do repo.

```bash
export AWS_REGION=us-east-1
export AWS_ACCOUNT_ID="$(aws sts get-caller-identity --query Account --output text)"
export PROJECT=portfolio
export ENV=prod

export ECR_API_REPO=$PROJECT-api
export S3_BUCKET=$PROJECT-$ENV-web-$AWS_ACCOUNT_ID
export APP_RUNNER_SERVICE=$PROJECT-api-$ENV

export DB_ID=$PROJECT-$ENV-db
export DB_NAME=portifolio
export DB_USER=portifolio
export DB_PASSWORD='CHANGE_ME_STRONG_PASSWORD'
export DB_PORT=5432

export ADMIN_API_KEY='CHANGE_ME_ADMIN_KEY'
```

## 2) Criar ECR e enviar imagem da API

```bash
aws ecr create-repository --repository-name "$ECR_API_REPO" --region "$AWS_REGION" 2>/dev/null || true

aws ecr get-login-password --region "$AWS_REGION" \
| docker login --username AWS --password-stdin "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com"

IMAGE_TAG="$(git rev-parse --short HEAD)"
API_IMAGE_URI="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_API_REPO:$IMAGE_TAG"

docker build -t "$API_IMAGE_URI" -f apps/api/Dockerfile apps/api
docker push "$API_IMAGE_URI"
```

## 3) Criar RDS PostgreSQL (single-AZ, custo inicial baixo)

> Ajuste VPC/subnets/security groups conforme sua conta.  
> Abaixo vai a forma minima executavel; para producao, restrinja acesso ao SG da API.

### Conta AWS Free Tier e `FreeTierRestrictionError`

Se aparecer:

`The specified backup retention period exceeds the maximum available to free tier customers`

significa que a conta ainda esta no limite Free Tier do RDS: use **`--backup-retention-period 0`** (sem backups automaticos) **ou** aumente o plano da conta e volte a usar retenção (por exemplo 7 dias).

O comando `DB_HOST=...` deve ser **uma linha so** com `--query 'DBInstances[0].Endpoint.Address'`; se colar errado, o shell mistura linhas e quebra o `--query`.

### Variante A — Free Tier (recomendado se der erro acima)

```bash
aws rds create-db-instance \
  --region "$AWS_REGION" \
  --db-instance-identifier "$DB_ID" \
  --engine postgres \
  --engine-version 16.3 \
  --db-instance-class db.t4g.micro \
  --allocated-storage 20 \
  --master-username "$DB_USER" \
  --master-user-password "$DB_PASSWORD" \
  --db-name "$DB_NAME" \
  --port "$DB_PORT" \
  --backup-retention-period 0 \
  --no-multi-az \
  --publicly-accessible

aws rds wait db-instance-available \
  --region "$AWS_REGION" \
  --db-instance-identifier "$DB_ID"

DB_HOST="$(aws rds describe-db-instances \
  --region "$AWS_REGION" \
  --db-instance-identifier "$DB_ID" \
  --query 'DBInstances[0].Endpoint.Address' \
  --output text)"
```

### Variante B — Conta fora do limite Free Tier (backups 7 dias)

```bash
aws rds create-db-instance \
  --region "$AWS_REGION" \
  --db-instance-identifier "$DB_ID" \
  --engine postgres \
  --engine-version 16.3 \
  --db-instance-class db.t4g.micro \
  --allocated-storage 20 \
  --master-username "$DB_USER" \
  --master-user-password "$DB_PASSWORD" \
  --db-name "$DB_NAME" \
  --port "$DB_PORT" \
  --backup-retention-period 7 \
  --no-multi-az \
  --publicly-accessible

aws rds wait db-instance-available \
  --region "$AWS_REGION" \
  --db-instance-identifier "$DB_ID"

DB_HOST="$(aws rds describe-db-instances \
  --region "$AWS_REGION" \
  --db-instance-identifier "$DB_ID" \
  --query 'DBInstances[0].Endpoint.Address' \
  --output text)"
```

## 4) Salvar segredos no Secrets Manager

```bash
DATABASE_URL="postgres://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME?sslmode=require"

aws secretsmanager create-secret \
  --region "$AWS_REGION" \
  --name "$PROJECT/$ENV/api" \
  --secret-string "{\"DATABASE_URL\":\"$DATABASE_URL\",\"ADMIN_API_KEY\":\"$ADMIN_API_KEY\"}" \
  2>/dev/null || \
aws secretsmanager put-secret-value \
  --region "$AWS_REGION" \
  --secret-id "$PROJECT/$ENV/api" \
  --secret-string "{\"DATABASE_URL\":\"$DATABASE_URL\",\"ADMIN_API_KEY\":\"$ADMIN_API_KEY\"}"
```

## 5A) API no ECS Fargate + ALB (alternativa ao App Runner)

Use esta secao **em vez** das secoes **5** e **6**. A API fica atras de um **Application Load Balancer** (HTTP na porta 80). Para HTTPS e dominio proprio, associe um certificado **ACM** ao listener (passo opcional, nao coberto aqui).

### 5A.1 Rede minima (VPC default, 2 subnets, security groups)

```bash
VPC_ID="$(aws ec2 describe-vpcs --filters Name=isDefault,Values=true \
  --query 'Vpcs[0].VpcId' --output text --region "$AWS_REGION")"

SUBNET_A="$(aws ec2 describe-subnets --filters "Name=vpc-id,Values=$VPC_ID" \
  --query 'Subnets[0].SubnetId' --output text --region "$AWS_REGION")"
SUBNET_B="$(aws ec2 describe-subnets --filters "Name=vpc-id,Values=$VPC_ID" \
  --query 'Subnets[1].SubnetId' --output text --region "$AWS_REGION")"

ALB_SG="$(aws ec2 describe-security-groups --region "$AWS_REGION" \
  --filters "Name=vpc-id,Values=$VPC_ID" "Name=group-name,Values=${PROJECT}-${ENV}-alb-sg" \
  --query 'SecurityGroups[0].GroupId' --output text)"
if [ "$ALB_SG" = "None" ] || [ -z "$ALB_SG" ]; then
  ALB_SG="$(aws ec2 create-security-group --region "$AWS_REGION" \
    --group-name "${PROJECT}-${ENV}-alb-sg" --description "ALB ${PROJECT}-${ENV}" \
    --vpc-id "$VPC_ID" --query 'GroupId' --output text)"
fi
aws ec2 authorize-security-group-ingress --region "$AWS_REGION" \
  --group-id "$ALB_SG" --protocol tcp --port 80 --cidr 0.0.0.0/0 2>/dev/null || true

ECS_SG="$(aws ec2 describe-security-groups --region "$AWS_REGION" \
  --filters "Name=vpc-id,Values=$VPC_ID" "Name=group-name,Values=${PROJECT}-${ENV}-ecs-sg" \
  --query 'SecurityGroups[0].GroupId' --output text)"
if [ "$ECS_SG" = "None" ] || [ -z "$ECS_SG" ]; then
  ECS_SG="$(aws ec2 create-security-group --region "$AWS_REGION" \
    --group-name "${PROJECT}-${ENV}-ecs-sg" --description "ECS tasks ${PROJECT}-${ENV}" \
    --vpc-id "$VPC_ID" --query 'GroupId' --output text)"
fi
aws ec2 authorize-security-group-ingress --region "$AWS_REGION" \
  --group-id "$ECS_SG" --protocol tcp --port 8080 --source-group "$ALB_SG" 2>/dev/null || true
aws ec2 authorize-security-group-egress --region "$AWS_REGION" \
  --group-id "$ECS_SG" --protocol -1 --cidr 0.0.0.0/0 2>/dev/null || true

# RDS deve aceitar PostgreSQL a partir das tasks ECS (mesma VPC que o default).
RDS_SG_ID="$(aws rds describe-db-instances --region "$AWS_REGION" --db-instance-identifier "$DB_ID" \
  --query 'DBInstances[0].VpcSecurityGroups[0].VpcSecurityGroupId' --output text)"
aws ec2 authorize-security-group-ingress --region "$AWS_REGION" \
  --group-id "$RDS_SG_ID" --protocol tcp --port "$DB_PORT" --source-group "$ECS_SG" 2>/dev/null || true
```

### 5A.2 Target Group + ALB + listener HTTP

> Nomes de Target Group e ALB devem ser **unicos** na conta. Se `create-target-group` ou `create-load-balancer` falhar por duplicado, apague o recurso antigo ou altere o nome.

```bash
TG_ARN="$(aws elbv2 create-target-group --region "$AWS_REGION" \
  --name "$(echo "${PROJECT}-${ENV}-api" | cut -c1-32)" \
  --protocol HTTP --port 8080 --vpc-id "$VPC_ID" --target-type ip \
  --health-check-path /health --health-check-interval-seconds 30 \
  --query 'TargetGroups[0].TargetGroupArn' --output text)"

ALB_ARN="$(aws elbv2 create-load-balancer --region "$AWS_REGION" \
  --name "$(echo "${PROJECT}-${ENV}-alb" | cut -c1-32)" \
  --subnets "$SUBNET_A" "$SUBNET_B" --security-groups "$ALB_SG" \
  --scheme internet-facing --type application \
  --query 'LoadBalancers[0].LoadBalancerArn' --output text)"

aws elbv2 wait load-balancer-available --region "$AWS_REGION" --load-balancer-arns "$ALB_ARN"

ALB_DNS="$(aws elbv2 describe-load-balancers --region "$AWS_REGION" \
  --load-balancer-arns "$ALB_ARN" \
  --query 'LoadBalancers[0].DNSName' --output text)"

aws elbv2 create-listener --region "$AWS_REGION" \
  --load-balancer-arn "$ALB_ARN" --protocol HTTP --port 80 \
  --default-actions "Type=forward,TargetGroupArn=$TG_ARN"
```

### 5A.3 Cluster, logs e role de execucao (ECR + Secrets)

```bash
aws ecs create-cluster --region "$AWS_REGION" --cluster-name "${PROJECT}-${ENV}-cluster" 2>/dev/null || true

aws logs create-log-group --region "$AWS_REGION" --log-group-name "/ecs/${PROJECT}-${ENV}-api" 2>/dev/null || true

aws iam create-role --role-name "${PROJECT}-${ENV}-ecs-exec" \
  --assume-role-policy-document '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"ecs-tasks.amazonaws.com"},"Action":"sts:AssumeRole"}]}' \
  2>/dev/null || true

aws iam attach-role-policy --role-name "${PROJECT}-${ENV}-ecs-exec" \
  --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy

SECRET_ARN="$(aws secretsmanager describe-secret --region "$AWS_REGION" \
  --secret-id "$PROJECT/$ENV/api" --query ARN --output text)"

cat > /tmp/ecs-secrets-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["secretsmanager:GetSecretValue"],
      "Resource": "${SECRET_ARN}"
    }
  ]
}
EOF

aws iam put-role-policy --role-name "${PROJECT}-${ENV}-ecs-exec" \
  --policy-name "${PROJECT}-${ENV}-ecs-secrets-read" \
  --policy-document file:///tmp/ecs-secrets-policy.json

EXEC_ROLE_ARN="$(aws iam get-role --role-name "${PROJECT}-${ENV}-ecs-exec" \
  --query 'Role.Arn' --output text)"
```

### 5A.4 Task definition e servico Fargate

> `API_IMAGE_URI` vem da secao 2. `EXEC_ROLE_ARN` vem da secao 5A.3 (execute **5A.1 a 5A.4** na **mesma shell**).  
> O segredo em JSON (secao 4) e injetado por chave: `ARN:DATABASE_URL::` e `ARN:ADMIN_API_KEY::` — os nomes das chaves tem de coincidir com o JSON guardado no Secrets Manager.  
> Ajuste `CORS_ORIGINS` depois do CloudFront, se a API exigir origem fixa.

Ordem do bloco: (1) ler ARN do segredo, (2) gerar task definition e registar, (3) rede `awsvpc` em ficheiro, (4) criar servico Fargate ligado ao ALB, (5) esperar estabilizar, (6) exportar URL publica.

O servico usa **`--health-check-grace-period-seconds 120`** para o ALB nao marcar targets como unhealthy durante o arranque (ex.: migrações no boot). Ajuste se precisar de mais ou menos tempo.

```bash
# 1) ARN completo do segredo (necessario para valueFrom por chave JSON)
SECRET_ARN="$(aws secretsmanager describe-secret --region "$AWS_REGION" \
  --secret-id "$PROJECT/$ENV/api" --query ARN --output text)"

# 2) Task definition: imagem no ECR + secrets como variaveis de ambiente injectadas pela execution role
cat > /tmp/ecs-task-def.json <<EOF
{
  "family": "${PROJECT}-${ENV}-api",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "executionRoleArn": "${EXEC_ROLE_ARN}",
  "containerDefinitions": [
    {
      "name": "api",
      "image": "${API_IMAGE_URI}",
      "essential": true,
      "portMappings": [{ "containerPort": 8080, "protocol": "tcp" }],
      "environment": [
        { "name": "PORT", "value": "8080" },
        { "name": "LOG_LEVEL", "value": "info" },
        { "name": "RATE_LIMIT", "value": "100-M" }
      ],
      "secrets": [
        { "name": "DATABASE_URL", "valueFrom": "${SECRET_ARN}:DATABASE_URL::" },
        { "name": "ADMIN_API_KEY", "valueFrom": "${SECRET_ARN}:ADMIN_API_KEY::" }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/${PROJECT}-${ENV}-api",
          "awslogs-region": "${AWS_REGION}",
          "awslogs-stream-prefix": "ecs",
          "awslogs-create-group": "true"
        }
      }
    }
  ]
}
EOF

aws ecs register-task-definition --region "$AWS_REGION" --cli-input-json file:///tmp/ecs-task-def.json

# 3) Fargate na VPC default: IP publico para pull do ECR e saida ate ao RDS (sem NAT)
cat > /tmp/ecs-net.json <<EOF
{
  "awsvpcConfiguration": {
    "subnets": ["$SUBNET_A", "$SUBNET_B"],
    "securityGroups": ["$ECS_SG"],
    "assignPublicIp": "ENABLED"
  }
}
EOF

# 4) Criar servico so se ainda nao existir (length(services) e mais fiavel que services[0] quando vazio)
SVC_COUNT="$(aws ecs describe-services --region "$AWS_REGION" \
  --cluster "${PROJECT}-${ENV}-cluster" \
  --services "${PROJECT}-${ENV}-api" \
  --query 'length(services)' --output text 2>/dev/null)"

if [ "$SVC_COUNT" != "1" ]; then
  aws ecs create-service --region "$AWS_REGION" \
    --cluster "${PROJECT}-${ENV}-cluster" \
    --service-name "${PROJECT}-${ENV}-api" \
    --task-definition "${PROJECT}-${ENV}-api" \
    --desired-count 1 \
    --launch-type FARGATE \
    --platform-version LATEST \
    --network-configuration file:///tmp/ecs-net.json \
    --load-balancers "targetGroupArn=$TG_ARN,containerName=api,containerPort=8080" \
    --health-check-grace-period-seconds 120
else
  # Servico ja existe: nao repetir --load-balancers (pode falhar); so alinhar rede/task e novo deploy
  aws ecs update-service --region "$AWS_REGION" \
    --cluster "${PROJECT}-${ENV}-cluster" \
    --service "${PROJECT}-${ENV}-api" \
    --task-definition "${PROJECT}-${ENV}-api" \
    --network-configuration file:///tmp/ecs-net.json \
    --health-check-grace-period-seconds 120 \
    --force-new-deployment
fi

aws ecs wait services-stable --region "$AWS_REGION" \
  --cluster "${PROJECT}-${ENV}-cluster" \
  --services "${PROJECT}-${ENV}-api"

export API_PUBLIC_URL="http://${ALB_DNS}"
echo "API public URL (use no VITE_API_BASE_URL e em CORS depois do front): $API_PUBLIC_URL"
```

### Verificar se o passo 4 funcionou (servico ECS)

Com as mesmas variaveis `AWS_REGION`, `PROJECT`, `ENV` da secao 1:

1. **O servico existe e esta activo**

```bash
aws ecs describe-services --region "$AWS_REGION" \
  --cluster "${PROJECT}-${ENV}-cluster" \
  --services "${PROJECT}-${ENV}-api" \
  --query 'services[0].{status:status,running:runningCount,desired:desiredCount,deployments:deployments[*].{status:status,rollout:rolloutState}}' \
  --output json
```

Esperado: `status` = `ACTIVE`, `runningCount` = `desiredCount` (ex.: 1), e o deployment com `rolloutState` = `COMPLETED` (ou em progresso pouco tempo apos criar).

2. **Ha pelo menos uma task em execucao**

```bash
aws ecs list-tasks --region "$AWS_REGION" \
  --cluster "${PROJECT}-${ENV}-cluster" \
  --service-name "${PROJECT}-${ENV}-api" \
  --desired-status RUNNING
```

Esperado: um ou mais ARNs de task (lista nao vazia).

3. **Detalhe da task (se falhar, ver motivo)**

Sem tasks em `RUNNING`, `taskArns[0]` vem vazio ou `None` e `describe-tasks` falha — por isso o bloco abaixo trata os dois casos.

```bash
TASK_ARN="$(aws ecs list-tasks --region "$AWS_REGION" \
  --cluster "${PROJECT}-${ENV}-cluster" \
  --service-name "${PROJECT}-${ENV}-api" \
  --desired-status RUNNING \
  --query 'taskArns[0]' --output text)"

if [ -z "$TASK_ARN" ] || [ "$TASK_ARN" = "None" ]; then
  echo "Nenhuma task RUNNING; a ultima parada (se houver) ajuda a ver o erro:"
  LAST_STOPPED="$(aws ecs list-tasks --region "$AWS_REGION" \
    --cluster "${PROJECT}-${ENV}-cluster" \
    --service-name "${PROJECT}-${ENV}-api" \
    --desired-status STOPPED \
    --query 'taskArns[0]' --output text)"
  if [ -n "$LAST_STOPPED" ] && [ "$LAST_STOPPED" != "None" ]; then
    aws ecs describe-tasks --region "$AWS_REGION" \
      --cluster "${PROJECT}-${ENV}-cluster" \
      --tasks "$LAST_STOPPED" \
      --query 'tasks[0].{stoppedReason:stoppedReason,stopCode:stopCode,containers:containers[*].{name:name,reason:reason,exitCode:exitCode}}' \
      --output json
  else
    echo "Sem tasks STOPPED listadas ainda; veja eventos: describe-services ... events"
  fi
else
  aws ecs describe-tasks --region "$AWS_REGION" \
    --cluster "${PROJECT}-${ENV}-cluster" \
    --tasks "$TASK_ARN" \
    --query 'tasks[0].{lastStatus:lastStatus,health:healthStatus,stoppedReason:stoppedReason,containers:containers[*].{name:name,reason:reason,exitCode:exitCode}}' \
    --output json
fi
```

Esperado com API saudavel: `lastStatus` = `RUNNING`, `healthStatus` = `HEALTHY` ou `UNKNOWN` (sem health check de contentor no task definition).

4. **ALB: target group com target healthy** (se o passo 4 correu com `--load-balancers`)

```bash
TG_FROM_SVC="$(aws ecs describe-services --region "$AWS_REGION" \
  --cluster "${PROJECT}-${ENV}-cluster" \
  --services "${PROJECT}-${ENV}-api" \
  --query 'services[0].loadBalancers[0].targetGroupArn' --output text)"

aws elbv2 describe-target-health --region "$AWS_REGION" --target-group-arn "$TG_FROM_SVC"
```

Esperado: pelo menos um target com `State` = `healthy` (apos o grace period; no arranque pode aparecer `initial` ou `unhealthy` durante ~2 min). Se `TG_FROM_SVC` for `None`, o servico nao ficou ligado ao ALB (rever `create-service` e `--load-balancers`).

5. **HTTP no endpoint publico**

```bash
curl -sS -o /dev/null -w "%{http_code}\n" "${API_PUBLIC_URL}/health"
```

Esperado: `200`. Se vier **503**, veja a secao **Depuracao: HTTP 503 em /health** abaixo (muitas vezes e a propria API a responder 503 porque a BD nao responde ao ping).

Se `describe-services` devolver `length(services) == 0` ou erro de cluster, o passo 4 **nao** criou o servico (cluster inexistente, nome errado, ou comando falhou — ver stderr do `create-service`).

### Depuracao: HTTP 503 em `/health`

O handler [`apps/api/internal/handlers/health.go`](../../apps/api/internal/handlers/health.go) devolve **503** quando o **ping ao Postgres falha** (corpo JSON tipico: `"status":"unhealthy"`, `"database":"down"`). O ALB **encaminha** esse 503; nao confundir apenas com “falha do load balancer” sem ver o corpo.

**1) Ver se o 503 vem da API (BD) ou se nao ha target saudavel**

```bash
curl -sS "${API_PUBLIC_URL}/health"
```

- Se aparecer JSON com `"database":"down"` → a task **esta a correr**; corrija **ligacao ECS → RDS** (`DATABASE_URL`, security groups, VPC, `sslmode`).
- Se aparecer **HTML** “503 Service Temporarily Unavailable” (pagina minima do **ALB**) → normalmente **nao ha nenhum target saudavel** a receber trafego. Isso inclui dois casos:
  - **lista de targets vazia** (ECS nao registou IPs no TG, ou servico sem tasks); ou
  - **ha targets mas todos `unhealthy`** — muito frequente quando o health check do TG chama `/health` e a API responde **503** (BD em baixo); o ALB deixa de encaminhar e mostra este HTML em vez do JSON.

Por isso, **sempre** corra o passo 2 abaixo; nao conclua só pelo corpo ser HTML.

**2) Estado dos targets no ALB**

```bash
TG_FROM_SVC="$(aws ecs describe-services --region "$AWS_REGION" \
  --cluster "${PROJECT}-${ENV}-cluster" \
  --services "${PROJECT}-${ENV}-api" \
  --query 'services[0].loadBalancers[0].targetGroupArn' --output text)"

aws elbv2 describe-target-health --region "$AWS_REGION" --target-group-arn "$TG_FROM_SVC"
```

- **Nenhum target** (`TargetHealthDescriptions` vazio) → ver **eventos do servico ECS** (erros de attach ao load balancer, VPC/subnets erradas, servico sem `RUNNING` tasks):

```bash
aws ecs describe-services --region "$AWS_REGION" \
  --cluster "${PROJECT}-${ENV}-cluster" \
  --services "${PROJECT}-${ENV}-api" \
  --query 'services[0].events[:15]' --output table
```

- `unhealthy` com `Health checks failed with these codes: [503]` → o TG esta a fazer check em `/health` e a API devolve 503 (**quase sempre ping a BD a falhar**). Corrija RDS/SG/`DATABASE_URL` (tabela abaixo).
- `unhealthy` com **timeout** / **connection refused** / **5xx** sem 503 → rede ou SG (**ALB → porta 8080** na task), ou contentor a nao escutar em `0.0.0.0:8080`.
- `draining` / `initial` → aguardar ou rever deploy; se ficar preso, ver logs da task.

**3) Checklist RDS + ECS (causa mais comum do 503 neste projeto)**

| Verificacao | Accao |
| ----------- | ----- |
| SG do RDS | Inbound TCP **5432** com **source** = security group das tasks (`${PROJECT}-${ENV}-ecs-sg`), nao apenas `0.0.0.0/0` se a task estiver noutra VPC. |
| Mesma VPC | RDS criado na **default VPC** do runbook e subnets ECS tambem na default (secao 5A.1). |
| `DATABASE_URL` | Host = **endpoint** do RDS (nao `localhost`); password com caracteres especiais **URL-encoded**; `sslmode=require` (ou o modo que o RDS exige). |
| Segredo na task | `valueFrom` `ARN:DATABASE_URL::` coincide com as chaves do JSON no Secrets Manager. |

**4) Health check “so app” (opcional, melhoria futura)**

Se quiser que o ALB marque o target como saudavel mesmo quando a BD esta em manutencao, seria preciso outro path so de liveness **sem** ping a BD, ou health check do TG noutro path — isso implica alteracao de codigo; o comportamento actual e **proposital** (health inclui BD).

### Depuracao: `EssentialContainerExited` com `exitCode: 1`

Significa que o processo dentro da imagem **terminou com erro** (nao e um crash do ECS em si). O campo `containers[].reason` costuma vir `null` nestes casos; a causa real esta nos **logs da aplicacao** (CloudWatch).

**1) Ver a ultima mensagem de erro nos logs**

```bash
aws logs tail "/ecs/${PROJECT}-${ENV}-api" --region "$AWS_REGION" --since 30m --format short
```

Procure linhas como `failed to load config`, `database connection failed`, `migrations failed` ou `invalid RATE_LIMIT` — o arranque em [`apps/api/cmd/api/main.go`](../../apps/api/cmd/api/main.go) faz `os.Exit(1)` nesses pontos.

**2) Checklist rapido (ordem frequente)**

| Sintoma nos logs | O que rever |
| ---------------- | ----------- |
| `database connection failed` | `DATABASE_URL` no Secrets Manager; RDS a aceitar trafego do security group das tasks ECS (porta 5432); mesma VPC que o default usado no runbook; `sslmode=require` coerente com o RDS. |
| erro com `/tmp/.s.PGSQL.5432` ou `dial unix` | **`DATABASE_URL` ausente ou com host `localhost`**: no Fargate/Linux o cliente Postgres tenta **socket Unix**, nao TCP. O URL tem de usar o **endpoint DNS do RDS** (`*.rds.amazonaws.com`). Confirme injecao do segredo (`valueFrom` `...:DATABASE_URL::`) e `put-secret-value` com JSON valido. |
| `migrations failed` | Utilizador da BD com permissoes; BD acessiveis; versao Postgres compativel. |
| `failed to load config` | `DATABASE_URL` vazio ou mal formado; caracteres especiais na password **tem de estar URL-encoded** na connection string. |
| `invalid RATE_LIMIT` | Variavel `RATE_LIMIT` invalida (o runbook usa `100-M`, que e valida). |

**3) Confirmar o segredo que a task ve**

```bash
aws secretsmanager get-secret-value --region "$AWS_REGION" \
  --secret-id "$PROJECT/$ENV/api" \
  --query SecretString --output text | jq .
```

(Nao partilhe o output em publico; confirme localmente que existem as chaves `DATABASE_URL` e `ADMIN_API_KEY`.)

**4) Testar a BD a partir de uma maquina com rede semelhante**

Se tiver bastion ou RDS publico, `psql` ou um `curl` nao aplica — o mais fiavel e corrigir SG/URL e reler os logs apos novo deploy.

### 5A.5 Novo deploy da API (ECS)

```bash
IMAGE_TAG="$(git rev-parse --short HEAD)"
API_IMAGE_URI="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_API_REPO:$IMAGE_TAG"
docker build -t "$API_IMAGE_URI" -f apps/api/Dockerfile apps/api
docker push "$API_IMAGE_URI"

jq --arg img "$API_IMAGE_URI" '.containerDefinitions[0].image=$img' /tmp/ecs-task-def.json > /tmp/ecs-task-def-new.json \
  && mv /tmp/ecs-task-def-new.json /tmp/ecs-task-def.json

aws ecs register-task-definition --region "$AWS_REGION" --cli-input-json file:///tmp/ecs-task-def.json

aws ecs update-service --region "$AWS_REGION" \
  --cluster "${PROJECT}-${ENV}-cluster" \
  --service "${PROJECT}-${ENV}-api" \
  --task-definition "${PROJECT}-${ENV}-api" \
  --force-new-deployment
```

---

## 5) Criar role do App Runner para ler segredo

> **Somente se usar App Runner.** Se usou a secao **5A (ECS)**, ignore esta secao e a secao **6**.

Crie o arquivo `tmp-apprunner-trust.json`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": { "Service": "build.apprunner.amazonaws.com" },
      "Action": "sts:AssumeRole"
    }
  ]
}
```

Crie o arquivo `tmp-apprunner-secrets-policy.json`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue"
      ],
      "Resource": "arn:aws:secretsmanager:*:*:secret:portfolio/prod/api*"
    }
  ]
}
```

Comandos:

```bash
aws iam create-role \
  --role-name "$PROJECT-$ENV-apprunner-secrets-role" \
  --assume-role-policy-document file://tmp-apprunner-trust.json \
  2>/dev/null || true

aws iam put-role-policy \
  --role-name "$PROJECT-$ENV-apprunner-secrets-role" \
  --policy-name "$PROJECT-$ENV-apprunner-secrets-policy" \
  --policy-document file://tmp-apprunner-secrets-policy.json

SECRETS_ROLE_ARN="$(aws iam get-role \
  --role-name "$PROJECT-$ENV-apprunner-secrets-role" \
  --query 'Role.Arn' --output text)"
```

## 6) Criar API no App Runner

> **Somente se usar App Runner.** Se usou a secao **5A (ECS)**, ignore esta secao.

Crie o arquivo `tmp-apprunner-config.json`:

```json
{
  "ServiceName": "portfolio-api-prod",
  "SourceConfiguration": {
    "AuthenticationConfiguration": {
      "AccessRoleArn": "REPLACE_WITH_SECRETS_ROLE_ARN"
    },
    "AutoDeploymentsEnabled": false,
    "ImageRepository": {
      "ImageIdentifier": "REPLACE_WITH_API_IMAGE_URI",
      "ImageRepositoryType": "ECR",
      "ImageConfiguration": {
        "Port": "8080",
        "RuntimeEnvironmentVariables": {
          "PORT": "8080",
          "LOG_LEVEL": "info",
          "RATE_LIMIT": "100-M",
          "CORS_ORIGINS": "https://REPLACE_FRONT_DOMAIN"
        },
        "RuntimeEnvironmentSecrets": {
          "DATABASE_URL": "arn:aws:secretsmanager:REPLACE_REGION:REPLACE_ACCOUNT:secret:portfolio/prod/api",
          "ADMIN_API_KEY": "arn:aws:secretsmanager:REPLACE_REGION:REPLACE_ACCOUNT:secret:portfolio/prod/api"
        }
      }
    }
  },
  "InstanceConfiguration": {
    "Cpu": "1 vCPU",
    "Memory": "2 GB"
  },
  "HealthCheckConfiguration": {
    "Protocol": "HTTP",
    "Path": "/health",
    "HealthyThreshold": 1,
    "UnhealthyThreshold": 5,
    "Interval": 10,
    "Timeout": 5
  }
}
```

Substituicoes:

```bash
sed -i "s|REPLACE_WITH_SECRETS_ROLE_ARN|$SECRETS_ROLE_ARN|g" tmp-apprunner-config.json
sed -i "s|REPLACE_WITH_API_IMAGE_URI|$API_IMAGE_URI|g" tmp-apprunner-config.json
sed -i "s|REPLACE_REGION|$AWS_REGION|g" tmp-apprunner-config.json
sed -i "s|REPLACE_ACCOUNT|$AWS_ACCOUNT_ID|g" tmp-apprunner-config.json
```

Criar servico:

```bash
aws apprunner create-service \
  --region "$AWS_REGION" \
  --cli-input-json file://tmp-apprunner-config.json

APP_RUNNER_URL="$(aws apprunner list-services \
  --region "$AWS_REGION" \
  --query "ServiceSummaryList[?ServiceName=='$PROJECT-api-$ENV'].ServiceUrl | [0]" \
  --output text)"

echo "API URL: https://$APP_RUNNER_URL"

export API_PUBLIC_URL="https://$APP_RUNNER_URL"
echo "Use API_PUBLIC_URL no build do front (secao 7): $API_PUBLIC_URL"
```

## 7) Publicar frontend no S3 + CloudFront

Criar bucket:

```bash
aws s3 mb "s3://$S3_BUCKET" --region "$AWS_REGION" 2>/dev/null || true
```

Build do frontend com URL final da API (`API_PUBLIC_URL` vem da secao **5A** ou **6**):

```bash
cd apps/web
VITE_API_BASE_URL="$API_PUBLIC_URL" pnpm install --frozen-lockfile
VITE_API_BASE_URL="$API_PUBLIC_URL" pnpm build
cd ../..
```

Upload:

```bash
aws s3 sync apps/web/dist "s3://$S3_BUCKET" --delete
```

### AccessDenied ao abrir o URL do S3 no browser

O hostname **`$S3_BUCKET.s3.$AWS_REGION.amazonaws.com`** e o **endpoint REST** do S3, nao o “website”. Na **raiz** `/` o pedido anonimo costuma falhar com `AccessDenied` porque:

1. exige `s3:ListBucket` (nao concedido por defeito), ou
2. os objetos sao **privados** (sem politica de leitura publica `s3:GetObject`).

**O URL publico para utilizadores finais** deve ser o **dominio CloudFront** (secao abaixo), nao o S3 direto.

**Teste rapido sem politica:** `https://$S3_BUCKET.s3.$AWS_REGION.amazonaws.com/index.html` — se tambem der `AccessDenied`, falta politica de leitura nos objetos.

**404 “Unexpected Application Error” no `/index.html`:** O React Router usa rotas em `/`, `/projects`, etc.; o pathname `/index.html` **nao** e a home. A app redireciona `/index.html` → `/`. Em producao use a **raiz** do CloudFront (`https://xxxx.cloudfront.net/`), nao o URL do objecto S3 com sufixo `index.html`, para evitar confusao.

**Opcional — bucket legivel publicamente (so objetos, SPA estatico):** primeiro permitir politicas no bucket (ajuste conforme a politica da tua org):

```bash
aws s3api put-public-access-block --bucket "$S3_BUCKET" \
  --public-access-block-configuration \
  "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=false,RestrictPublicBuckets=false"
```

Depois politica apenas para `GetObject` em `/*`:

```bash
cat > /tmp/s3-bucket-policy.json <<POL
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadObjects",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::${S3_BUCKET}/*"
    }
  ]
}
POL

aws s3api put-bucket-policy --bucket "$S3_BUCKET" --policy file:///tmp/s3-bucket-policy.json
```

Em producao e mais seguro **manter o bucket privado** e usar **CloudFront com Origin Access Control (OAC)**; o runbook abaixo usa origem S3 “classica” — se o CF nao conseguir ir buscar ficheiros, passe a OAC ou garanta leitura compativel com a origem escolhida.

Criar distribuicao CloudFront (simples, sem custom domain):

```bash
cat > tmp-cloudfront-config.json <<EOF
{
  "CallerReference": "$(date +%s)",
  "Comment": "$PROJECT-$ENV-web",
  "Enabled": true,
  "Origins": {
    "Quantity": 1,
    "Items": [
      {
        "Id": "s3-origin",
        "DomainName": "$S3_BUCKET.s3.$AWS_REGION.amazonaws.com",
        "S3OriginConfig": { "OriginAccessIdentity": "" }
      }
    ]
  },
  "DefaultCacheBehavior": {
    "TargetOriginId": "s3-origin",
    "ViewerProtocolPolicy": "redirect-to-https",
    "TrustedSigners": { "Enabled": false, "Quantity": 0 },
    "AllowedMethods": { "Quantity": 2, "Items": ["GET","HEAD"], "CachedMethods": { "Quantity": 2, "Items": ["GET","HEAD"] } },
    "Compress": true,
    "ForwardedValues": { "QueryString": false, "Cookies": { "Forward": "none" } },
    "MinTTL": 0
  },
  "DefaultRootObject": "index.html",
  "PriceClass": "PriceClass_100"
}
EOF

aws cloudfront create-distribution \
  --distribution-config file://tmp-cloudfront-config.json
```

## 8) Validacao de ponta a ponta

```bash
curl -i "${API_PUBLIC_URL}/health"
```

Depois, abra o dominio CloudFront retornado pelo comando de create-distribution e teste o formulario de contato.  
Se usar **ECS**, atualize `CORS_ORIGINS` na task (ou ConfigMap futuro) para a origem exata do CloudFront quando o front estiver no ar.

## 9) Deploy de nova versao (executavel)

### API — App Runner

```bash
IMAGE_TAG="$(git rev-parse --short HEAD)"
API_IMAGE_URI="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_API_REPO:$IMAGE_TAG"

docker build -t "$API_IMAGE_URI" -f apps/api/Dockerfile apps/api
docker push "$API_IMAGE_URI"

SERVICE_ARN="$(aws apprunner list-services --region "$AWS_REGION" \
  --query "ServiceSummaryList[?ServiceName=='$PROJECT-api-$ENV'].ServiceArn | [0]" \
  --output text)"

aws apprunner start-deployment --region "$AWS_REGION" --service-arn "$SERVICE_ARN"
```

### API — ECS Fargate

Use a secao **5A.5** (build, `jq` no JSON, `register-task-definition`, `update-service`).

Frontend:

```bash
cd apps/web
VITE_API_BASE_URL="$API_PUBLIC_URL" pnpm build
cd ../..
aws s3 sync apps/web/dist "s3://$S3_BUCKET" --delete
```

## 10) Rollback basico

API — App Runner:

```bash
# Re-tag para uma imagem antiga e novo deploy
OLD_TAG="<tag_antiga>"
API_IMAGE_URI="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_API_REPO:$OLD_TAG"
# Atualize a configuracao do service para usar OLD_TAG e rode start-deployment
```

API — ECS Fargate:

```bash
OLD_TAG="<tag_antiga>"
API_IMAGE_URI="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_API_REPO:$OLD_TAG"
jq --arg img "$API_IMAGE_URI" '.containerDefinitions[0].image=$img' /tmp/ecs-task-def.json > /tmp/ecs-task-def-new.json \
  && mv /tmp/ecs-task-def-new.json /tmp/ecs-task-def.json
aws ecs register-task-definition --region "$AWS_REGION" --cli-input-json file:///tmp/ecs-task-def.json
aws ecs update-service --region "$AWS_REGION" \
  --cluster "${PROJECT}-${ENV}-cluster" \
  --service "${PROJECT}-${ENV}-api" \
  --task-definition "${PROJECT}-${ENV}-api" \
  --force-new-deployment
```

Frontend:

```bash
# Reenvie um dist anterior (artefato salvo no CI) para o mesmo bucket S3
aws s3 sync <path_dist_antigo> "s3://$S3_BUCKET" --delete
```

## 11) Checklist de producao minima

- `CORS_ORIGINS` com dominio exato do frontend
- segredo so em Secrets Manager
- RDS com backup ativo
- logs e alarmes CloudWatch
- budget AWS (50/80/100%)

## 12) Quando considerar Kubernetes

Considere EKS apenas quando houver 2+ sinais:

- multiplos servicos e governanca de plataforma
- necessidade forte de rollout canary/blue-green
- alta demanda com autoscaling horizontal frequente
- equipe pronta para operar cluster 24x7
