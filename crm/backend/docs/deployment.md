# Deployment

1. Provision PostgreSQL 16 and (optionally) Redis 7. Create a database and a role with its own password.
2. On the host: `pnpm install --frozen-lockfile`, then `pnpm build`.
3. Create `.env` with production values. Required in production: `LOG_REDACTION=true`, `LOG_PRETTY=false`,
   a 32+ character `JWT_SECRET`, and the matching SMTP, CRM and booking settings for any provider you enable.
4. Run `pnpm db:migrate` and, once, `pnpm db:seed`. Migrations are forward-only.
5. Start with `pm2 start ecosystem.config.cjs --env production` and `pm2 save`.
6. Put Nginx in front of the API for TLS, request size limits and HSTS. Proxy only `/api/` and `/health`.
7. Verify with `curl https://<host>/ready`, which returns the database state and outbox counts.

Rollback: stop the API and worker, redeploy the previous build, and keep the database. Migrations here do not
drop data, so the previous build can run against the newer schema.

Not yet covered: Zoho, nurture sequences, OpenTelemetry and Prometheus, and refresh tokens.
