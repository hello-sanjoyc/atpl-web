# Aranax CRM Monorepo

A pnpm workspace containing the Fastify API, React frontend, and shared contracts.

## Workspace layout

```
crm/
├── backend/   @aranax/backend   — Fastify REST API
├── frontend/  @aranax/frontend  — React + TypeScript SPA
├── shared/    @aranax/contracts — Types and enums shared by both
├── package.json                 — Workspace root
├── pnpm-workspace.yaml
└── ecosystem.config.cjs         — PM2 process definitions
```

## Install and run

```bash
# Install all workspace dependencies
pnpm install

# Build shared contracts first, then backend, then frontend
pnpm build

# Type-check all packages
pnpm typecheck

# Lint frontend
pnpm lint

# Run all tests
pnpm test

# Run integration tests (requires PostgreSQL test database)
pnpm test:integration

# Development — start API and frontend dev servers
pnpm dev:api        # Fastify on http://localhost:4000
pnpm dev:web        # Vite on http://localhost:5173
```

## Regenerating API types

After any backend change, regenerate the OpenAPI schema and frontend types:

```bash
pnpm --filter @aranax/backend openapi:export
pnpm --filter @aranax/frontend types:api
```

The generated `frontend/src/api/schema.d.ts` is committed so a frontend build never requires a running backend.

## Production deployment

### Environment files

Copy `.env.example` to `.env` in both `backend/` and configure all required variables. Never put secrets in `VITE_*` frontend variables — they are public in the bundle.

Backend `.env` required keys: `DATABASE_URL`, `JWT_SECRET`, `NODE_ENV=production`, `HOST=127.0.0.1`, `TRUST_PROXY=true`, `SWAGGER_ENABLED=false`.

### Build and start with PM2

```bash
pnpm build
pm2 start ecosystem.config.cjs --env production
pm2 save
```

The worker (`aranax-worker`) must remain at exactly one instance to maintain the PostgreSQL advisory lock for scheduled jobs.

### Nginx server block for crm.aranax.tech

```nginx
server {
    listen 443 ssl http2;
    server_name crm.aranax.tech;

    root /var/www/crm/frontend/dist;
    index index.html;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Content Security Policy — widen connect-src if the API moves to its own subdomain
    add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self'; img-src 'self' data:; font-src 'self';" always;

    # Proxy API requests to the Fastify backend
    location /api/ {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Health and readiness — restrict to internal network only
    location ~ ^/(health|ready)$ {
        allow 127.0.0.1;
        allow 10.0.0.0/8;
        deny all;
        proxy_pass http://127.0.0.1:4000;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # SPA fallback — required for client-side routing
    # Without this, a hard reload on /leads/:id returns 404
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### Staging

A staging host needs its own PostgreSQL database and a separate `JWT_SECRET`. The staging frontend must never point at the production API — the lead endpoints write real records and will queue real email once SMTP is configured.

Set `VITE_API_BASE_URL=` (empty, same-origin) in both environments. For a split deployment where the API is on a different subdomain, set `VITE_API_BASE_URL=https://api.crm.aranax.tech` and add that origin to Nginx's `connect-src` CSP directive.
