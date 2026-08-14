# Aranax frontend

Next.js renders the site from Strapi content through a server-only Axios client.

## Content delivery

```text
Strapi -> Axios (Next.js server) -> tagged Next.js data cache -> server render -> browser
```

No Strapi content request is made from the browser. The persistent Next.js cache is
shared across requests and deployments that share the same Next.js cache backend.
`CMS_CACHE_TTL_SECONDS` is a safety net; normal CMS writes invalidate the content
immediately through the authenticated `/api/revalidate` endpoint.

The public contact form posts to `/api/contact`. That Next.js route proxies the
submission to Strapi, where it is validated and stored as a **Contact Submission**.
The browser never receives the internal Strapi URL or an API token.

## Local setup

1. Copy `.env.example` to `.env.local` and use the same revalidation secret in
   `cms/.env`.
2. Set `NEXT_REVALIDATION_URL=http://localhost:3000/api/revalidate` in `cms/.env`.
3. Start Strapi, then run `pnpm dev` here.

Use a long random value for both `CMS_REVALIDATE_SECRET` and
`NEXT_REVALIDATION_SECRET`. If Strapi read permissions are private, create a
read-only Strapi API token and set `STRAPI_API_TOKEN` only in the Next.js server
environment.

## Production notes

- Deploy Strapi and Next.js behind HTTPS. `STRAPI_URL` should use the private
  service address where the platform supports one; `STRAPI_PUBLIC_URL` must be the
  public media origin.
- Run `pnpm build` and deploy the generated standalone Next.js server.
- Keep the revalidation secret and Strapi API token in the deployment secret
  manager, never in `NEXT_PUBLIC_*` variables.
- For multiple Next.js replicas, use a platform-supported shared incremental cache
  or route invalidation to every replica. A single standalone instance needs no
  Redis. Vercel's Data Cache is shared automatically.
- Cache invalidation is debounced in Strapi so one editor action that touches
  several database records produces a single purge request.
- Contact and revalidation API responses explicitly use `Cache-Control: no-store`.

## Key files

- `src/lib/api/endpoints.ts`: central Strapi endpoint and cache-tag registry
- `src/lib/api/axios.server.ts`: private Axios client and request wrappers
- `src/lib/cms/content.server.ts`: Strapi response mapping
- `src/lib/cms/cache.server.ts`: persistent tagged Next.js cache
- `src/app/api/revalidate/route.ts`: authenticated on-demand invalidation
- `src/app/api/contact/route.ts`: server-side contact submission proxy

## Verification

```bash
pnpm typecheck
pnpm build
```
