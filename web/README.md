# Aranax frontend

Next.js renders the site from Strapi content through a server-only Axios client.

## Content delivery

```text
Strapi -> Axios (Next.js server) -> server render -> browser
```

No Strapi content request is made from the browser. The homepage and shared
site content are fetched from Strapi on each page request, so a browser refresh
shows the latest published content. React request caching only deduplicates
the fetch between metadata and page rendering in the same request.

The public contact form posts to `/api/contact`. That Next.js route proxies the
submission to Strapi, where it is validated and stored as a **Contact Submission**.
The browser never receives the internal Strapi URL or an API token.

## Local setup

1. Copy `.env.example` to `.env.local` and set `STRAPI_URL` to your local Strapi server. Media URLs use that address by default in development.
2. Start Strapi, then run `pnpm dev` here.

Use a long random value for both `CMS_REVALIDATE_SECRET` and
`NEXT_REVALIDATION_SECRET`. If Strapi read permissions are private, create a
read-only Strapi API token and set `STRAPI_API_TOKEN` only in the Next.js server
environment.

## Production notes

- Deploy Strapi and Next.js behind HTTPS. `STRAPI_URL` can use the private
  service address; media URLs default to `https://cms.aranax.tech` in production.
  Set `STRAPI_PUBLIC_URL` only when the public media origin differs.
- Run `pnpm build` and deploy the generated standalone Next.js server.
- Keep the revalidation secret and Strapi API token in the deployment secret
  manager, never in `NEXT_PUBLIC_*` variables.
- The optional authenticated revalidation endpoint remains available if other
  cached content is introduced. The homepage does not depend on it.
- Contact and revalidation API responses explicitly use `Cache-Control: no-store`.

## Key files

- `src/lib/api/endpoints.ts`: central Strapi endpoint and cache-tag registry
- `src/lib/api/axios.server.ts`: private Axios client and request wrappers
- `src/lib/cms/content.server.ts`: Strapi response mapping
- `src/lib/cms/cache.server.ts`: request-scoped fetch deduplication
- `src/app/api/revalidate/route.ts`: authenticated on-demand invalidation
- `src/app/api/contact/route.ts`: server-side contact submission proxy

## Verification

```bash
pnpm typecheck
pnpm build
```
