# Kubernetes (base manifests)

Declarative manifests for the portfolio API (Go) and static web (nginx). Namespace: `portfolio`.

## Contents (Kustomize)

From the repository root, `kubectl apply -k infra/k8s` applies:

| Resource | File(s) |
| -------- | ------- |
| Namespace | `namespace.yaml` |
| ConfigMap | `configmap.yaml` — `LOG_LEVEL`, `RATE_LIMIT`, `CORS_ORIGINS` |
| Secret | `secret.yaml` — `DATABASE_URL`, optional `ADMIN_API_KEY` (placeholders) |
| API | `api-deployment.yaml`, `api-service.yaml` |
| Web | `web-deployment.yaml`, `web-service.yaml` |
| Ingress | `ingress.yaml` |

## Prerequisites

- A PostgreSQL instance reachable from the cluster (for example Amazon RDS in production). Set `DATABASE_URL` in the Secret.
- Container images built from `apps/api/Dockerfile` and `apps/web/Dockerfile`. Replace image names in the Deployments (or use Kustomize `images:`).
- An Ingress controller if you use `ingress.yaml` (for local clusters, [ingress-nginx](https://kubernetes.github.io/ingress-nginx/) is a common choice).

## Building images (local)

Examples from the **repository root** (adjust tags and registries):

```bash
# API
docker build -t portfolio-api:local -f apps/api/Dockerfile apps/api

# Web — context must be the repo root (monorepo pnpm); VITE_API_BASE_URL is baked into the bundle
docker build -t portfolio-web:local -f apps/web/Dockerfile \
  --build-arg VITE_API_BASE_URL=https://api.example.com \
  .
```

Load into kind/k3d if needed (`kind load docker-image …`, `k3d image import …`), or push to a registry (see AWS checklist below).

## Configuration

| Resource | Purpose |
| -------- | ------- |
| `configmap.yaml` | `LOG_LEVEL`, `RATE_LIMIT`, `CORS_ORIGINS` (comma-separated; empty allows any origin in the API). |
| `secret.yaml` | `DATABASE_URL`, optional `ADMIN_API_KEY`. **Edit placeholders** before apply or create the Secret separately (`kubectl create secret generic …`). |

The API runs migrations on startup; keep **one replica** for the API Deployment unless you introduce an init Job or leader election for migrations.

## Apply

```bash
kubectl apply -k infra/k8s
```

Or apply YAML files individually. After changing images:

```bash
kubectl set image deployment/portfolio-api api=YOUR_REGISTRY/portfolio-api:TAG -n portfolio
kubectl set image deployment/portfolio-web nginx=YOUR_REGISTRY/portfolio-web:TAG -n portfolio
```

Set `CORS_ORIGINS` in the ConfigMap to the public browser origin of the SPA when the front and API are on different hosts.

## Ingress

- **kind/k3d + ingress-nginx:** set `ingress.spec.rules[0].host` to your choice and add a matching `/etc/hosts` entry to the node or use `kubectl port-forward` to the controller.
- **EKS:** prefer the [AWS Load Balancer Controller](https://kubernetes-sigs.github.io/aws-load-balancer-controller/) and ALB Ingress annotations instead of `ingressClassName: nginx`.

## Two-host variant

For separate `app.example.com` and `api.example.com`, split into two Ingress rules (or two Ingress objects): one pointing `/` to `portfolio-web`, the other pointing `/` to `portfolio-api`. Point `VITE_API_BASE_URL` at the API URL when building the web image.

## AWS checklist (ECR, EKS, RDS)

Use this as a high-level sequence when moving from local Kubernetes to AWS. Nothing here provisions your account; it ties the manifests in this folder to typical AWS services.

### Amazon ECR

- [ ] Create repositories (for example `portfolio-api`, `portfolio-web`) in the target Region/account.
- [ ] Authenticate Docker to ECR (`aws ecr get-login-password` + `docker login`).
- [ ] Build and push images with immutable tags (commit SHA or semver); wire the same tags into Deployments or CI (for example GitHub Actions: `docker build` + `docker push` on merge or release).
- [ ] Restrict repository policies and IAM so only your CI and operators can push/pull.

### Amazon EKS

- [ ] Create the cluster and node groups (or Fargate profiles) in the same VPC strategy you will use for RDS.
- [ ] Install the **AWS Load Balancer Controller** if you use **ALB Ingress**; align `ingress.yaml` with ALB annotations and IngressClass.
- [ ] Ensure worker nodes (or Fargate) can pull from ECR and reach RDS on the database port (security groups / subnets).
- [ ] Use `kubectl set image` or GitOps to roll out new image tags after each successful push.

### Amazon RDS (PostgreSQL)

- [ ] Create a PostgreSQL instance (engine version compatible with what you run locally, for example 16.x).
- [ ] Place RDS in private subnets; allow inbound **only** from the EKS cluster (node security group or cluster security group), not from `0.0.0.0/0`.
- [ ] Store the connection string in **Secrets Manager** (or SSM Parameter Store) and inject into the cluster via **External Secrets Operator** or an equivalent pattern; avoid committing real `DATABASE_URL` values to git.
- [ ] Point the API Secret’s `DATABASE_URL` at the RDS endpoint (include `sslmode` appropriate for your RDS setup).

### Cross-cutting (CORS and front build)

- [ ] Set `CORS_ORIGINS` on the API to the exact public origin of the SPA (ALB hostname, CloudFront URL, or custom domain).
- [ ] Build the web image with `VITE_API_BASE_URL` set to the **browser-visible** API URL (for example `https://api.example.com`).

### Optional production variant: static front on S3 + CloudFront

Instead of running nginx in a Pod, you can serve the Vite `dist/` from **S3** behind **CloudFront** and keep only the API on EKS. That often reduces cost and simplifies scaling static assets; you still need `VITE_API_BASE_URL` pointing at the live API and `CORS_ORIGINS` matching the CloudFront (or custom) domain.
