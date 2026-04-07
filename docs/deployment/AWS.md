# Roteiro AWS 100% executavel (Docker -> Docker em cloud)

Runbook pratico para publicar o portfolio em AWS sem Kubernetes, usando:

- API em `App Runner` (container da API no `ECR`)
- Front em `S3 + CloudFront`
- Banco em `RDS PostgreSQL`
- Segredos em `Secrets Manager`

Se preferir ECS no lugar de App Runner, mantenha este fluxo como base e troque apenas a etapa de runtime da API.

## 0) Pre-requisitos locais

- AWS CLI v2 configurado (`aws configure`)
- Docker
- `jq`
- Permissoes AWS para: ECR, RDS, S3, CloudFront, App Runner, Secrets Manager, IAM

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

## 5) Criar role do App Runner para ler segredo

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
```

## 7) Publicar frontend no S3 + CloudFront

Criar bucket:

```bash
aws s3 mb "s3://$S3_BUCKET" --region "$AWS_REGION" 2>/dev/null || true
```

Build do frontend com URL final da API:

```bash
cd apps/web
VITE_API_BASE_URL="https://$APP_RUNNER_URL" pnpm install --frozen-lockfile
VITE_API_BASE_URL="https://$APP_RUNNER_URL" pnpm build
cd ../..
```

Upload:

```bash
aws s3 sync apps/web/dist "s3://$S3_BUCKET" --delete
```

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
curl -i "https://$APP_RUNNER_URL/health"
```

Depois, abra o dominio CloudFront retornado pelo comando de create-distribution e teste o formulario de contato.

## 9) Deploy de nova versao (executavel)

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

Frontend:

```bash
cd apps/web
VITE_API_BASE_URL="https://$APP_RUNNER_URL" pnpm build
cd ../..
aws s3 sync apps/web/dist "s3://$S3_BUCKET" --delete
```

## 10) Rollback basico

API:

```bash
# Re-tag para uma imagem antiga e novo deploy
OLD_TAG="<tag_antiga>"
API_IMAGE_URI="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_API_REPO:$OLD_TAG"
# Atualize a configuracao do service para usar OLD_TAG e rode start-deployment
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
