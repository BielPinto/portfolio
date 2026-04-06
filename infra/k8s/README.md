# Kubernetes (base manifests)

Declarative manifests for the portfolio API (Go) and static web (nginx). Namespace: `portfolio`.

## Prerequisites

- A PostgreSQL instance reachable from the cluster (for example Amazon RDS in production). Set `DATABASE_URL` in the Secret.
- Container images built from `apps/api/Dockerfile` and `apps/web/Dockerfile`. Replace image names in the Deployments (or use Kustomize `images:`).
- An Ingress controller if you use `ingress.yaml` (for local clusters, [ingress-nginx](https://kubernetes.github.io/ingress-nginx/) is a common choice).

## Configuration

| Resource        | Purpose |
|----------------|---------|
| `configmap.yaml` | `LOG_LEVEL`, `RATE_LIMIT`, `CORS_ORIGINS` (comma-separated; empty allows any origin in the API). |
| `secret.yaml`    | `DATABASE_URL`, optional `ADMIN_API_KEY`. **Edit placeholders** before apply or create the Secret separately. |

The API runs migrations on startup; keep **one replica** for the API Deployment unless you introduce an init Job or leader election for migrations.

## Apply

```bash
kubectl apply -k infra/k8s
```

Or apply files individually. After changing images:

```bash
kubectl set image deployment/portfolio-api api=YOUR_ECR/portfolio-api:TAG -n portfolio
kubectl set image deployment/portfolio-web nginx=YOUR_ECR/portfolio-web:TAG -n portfolio
```

Set `CORS_ORIGINS` to the public browser origin of the SPA when the front and API are on different hosts.

## Ingress

- **kind/k3d + ingress-nginx:** set `ingress.spec.rules[0].host` to your choice and add a matching `/etc/hosts` entry to the node or use `kubectl port-forward` to the controller.
- **EKS:** prefer the [AWS Load Balancer Controller](https://kubernetes-sigs.github.io/aws-load-balancer-controller/) and ALB Ingress annotations instead of `ingressClassName: nginx`.

## Two-host variant

For separate `app.example.com` and `api.example.com`, split into two Ingress rules (or two Ingress objects): one pointing `/` to `portfolio-web`, the other pointing `/` to `portfolio-api`. Point `VITE_API_BASE_URL` at the API URL when building the web image.
