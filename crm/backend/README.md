# Aranax Lead, CRM and Revenue API

Backend REST API for Aranax Technologies: lead capture, pipeline, customers, referrals, revenue and analytics.
Node.js 22, TypeScript (strict), Fastify 5, PostgreSQL 16, Drizzle ORM, Zod, Pino, OpenAPI 3.1. No Docker.

## Quick start

```bash
pnpm install
cp .env.example .env          # then set DATABASE_URL, JWT_SECRET and the rest
pnpm db:migrate               # apply SQL migrations
pnpm db:seed                  # lead stages, opportunity stages, assessment catalog, optional admin
pnpm dev                      # HTTP server with reload
pnpm worker                   # (second terminal) outbox dispatcher and scheduler, after pnpm build
```

Health: `GET /health` (liveness), `GET /ready` (database check and outbox counts).
API: `/api/v1/...`. Interactive docs: `/docs` when `SWAGGER_ENABLED=true`. Export the OpenAPI document with `pnpm openapi:export` (writes `docs/openapi.json`).

## Scripts

| Script | Purpose |
| --- | --- |
| `pnpm typecheck` | Strict TypeScript check of src, tests and config |
| `pnpm build` | Compile to `dist/` |
| `pnpm test` | Unit tests (no database) |
| `pnpm test:integration` | Integration tests against `TEST_DATABASE_URL` (default `aranax_lead_api_test`) |
| `pnpm db:generate` | Generate a migration from schema changes |
| `pnpm db:migrate` / `pnpm db:seed` | Apply migrations / reference data |

## Production

`pm2 start ecosystem.config.cjs --env production` runs the API in cluster mode and one worker. Put Nginx in
front for TLS and set `TRUST_PROXY=true` only when the proxy is the sole route to the API.

## Current scope and deferrals

Implemented: authentication (JWT HS256), RBAC with ownership scoping, lead capture with spam protection and
consent, idempotent writes, the transactional outbox (email and CRM), opportunities with forward-only stages,
customers and contracts, revenue records with stored exchange rates, the funnel and revenue overview, CSV exports
with formula-injection protection, the booking webhook with HMAC verification, and the assessment flow.

Deferred and not implemented: Zoho CRM, nurture sequences, OpenTelemetry and Prometheus metrics, refresh tokens,
and an end-to-end test folder. CAC, LTV, sales velocity, retention and referral-conversion metrics are not yet
computed. Email delivery is recorded as "provider accepted", never "delivered", because SMTP provides no receipt.
