# syntax=docker/dockerfile:1

# Monorepo: build from the repository root, for example:
#   docker build -f apps/web/Dockerfile --build-arg VITE_API_BASE_URL=https://api.example.com -t portfolio-web .

FROM node:22-alpine AS builder

RUN corepack enable && corepack prepare pnpm@9.15.9 --activate

WORKDIR /app

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/web/package.json ./apps/web/

RUN pnpm install --frozen-lockfile --filter @portfolio/web

COPY apps/web/index.html apps/web/tsconfig.json apps/web/tsconfig.app.json apps/web/tsconfig.node.json apps/web/vite.config.ts ./apps/web/
COPY apps/web/src ./apps/web/src
COPY apps/web/public ./apps/web/public

ARG VITE_API_BASE_URL=
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

RUN pnpm --filter @portfolio/web run build

FROM nginx:1.27-alpine AS runner

COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

RUN rm /etc/nginx/conf.d/default.conf && \
    printf '%s\n' \
      'server {' \
      '    listen 80;' \
      '    server_name localhost;' \
      '    root /usr/share/nginx/html;' \
      '    index index.html;' \
      '    location / {' \
      '        try_files $uri $uri/ /index.html;' \
      '    }' \
      '    gzip on;' \
      '    gzip_types text/css application/javascript application/json text/plain;' \
      '}' \
      > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
