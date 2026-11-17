Restructure the existing Aranax Lead, CRM and Revenue API into a pnpm monorepo under a `crm/` folder, then build a production-grade React + TypeScript frontend alongside it. In production both are served from one host: the app at https://crm.aranax.tech and the API at https://crm.aranax.tech/api/v1.

## Critical context before you start

The backend already exists and works. It currently sits at the repository root (src/, tests/, docs/, drizzle.config.ts, ecosystem.config.cjs, vitest.config.ts, package.json). Its state: `pnpm typecheck`, `pnpm build`, 42 unit tests and 19 integration tests all pass against PostgreSQL 16. Migrations are applied to the dev and test databases.

Do not change any backend behaviour, API shape, database schema or migration. This task moves files and extracts shared constants; it does not redesign the backend. Any ignored instruction here that silently alters an endpoint is a failure even if everything compiles.

Work in three phases and do not start a phase until the previous one's verification passes. Report real command output at each gate.

## Target layout

crm/
├── backend/ # the existing Fastify API, moved here unchanged
│ ├── src/
│ ├── tests/
│ ├── docs/ # includes generated openapi.json
│ ├── drizzle.config.ts
│ ├── vitest.config.ts
│ ├── tsconfig.json
│ ├── tsconfig.build.json
│ ├── package.json # name: @aranax/backend
│ ├── .env.example
│ └── README.md
├── frontend/ # new React app
│ ├── src/
│ ├── public/
│ ├── index.html
│ ├── vite.config.ts
│ ├── tsconfig.json
│ ├── tsconfig.app.json
│ ├── eslint.config.js
│ ├── package.json # name: @aranax/frontend
│ ├── .env.example
│ └── README.md
├── shared/ # types and enums both sides need
│ ├── src/
│ ├── tsconfig.json
│ └── package.json # name: @aranax/contracts
├── package.json # workspace root, private
├── pnpm-workspace.yaml
├── ecosystem.config.cjs # PM2, both API and worker
├── .gitignore
├── .npmrc
└── README.md

## PHASE 1 — Move the backend into the monorepo

1. Create crm/backend and move the existing backend into it: src, tests, docs, drizzle.config.ts, vitest.config.ts, tsconfig.json, tsconfig.build.json, package.json, .env.example, README.md, ecosystem.config.cjs (which then moves again to the crm/ root in step 6). If the repository is under git, use `git mv` so history is preserved; otherwise plain moves.
2. Do not move: node_modules, dist, logs, pnpm-lock.yaml, .env. Delete the empty `deploy/` folder. Reinstall from the workspace root instead of moving node_modules, and recreate .env from .env.example inside crm/backend.
3. Every path inside the backend is already relative (drizzle.config.ts uses ./src/db/schema/index.ts and ./src/db/migrations; scripts use src/... and dist/...), so no path edits should be needed. Verify rather than assume: if any absolute or parent-relative path exists, fix it and say which.
4. Rename the backend package to @aranax/backend. Keep its scripts, "type": "module", engines (node >=22) and all dependencies exactly as they are, including typescript pinned to ^5.9.3. Do not upgrade TypeScript to 7: it caused module-resolution failures in this project.
5. Create the workspace root:
    - pnpm-workspace.yaml listing: backend, frontend, shared
    - package.json: private true, name @aranax/crm, packageManager pnpm@10.28.0, engines node >=22, and delegating scripts:
      dev:api, dev:web, build (shared then backend then frontend, in that order), typecheck, lint, test, test:integration — each using `pnpm --filter` so a single root command covers the workspace. Add `dev` running the API and web dev servers together.
    - .npmrc with strict-peer-dependencies=false only if an install genuinely requires it; otherwise leave it out and report the conflict instead of silencing it.
    - .gitignore covering node*modules/, dist/, logs/, .env, .env.* (allowing .env.example), coverage/, \_.log
    - Do not add Turborepo. Plain pnpm filters are enough here; if you believe build caching is needed, say why instead of adding it.
6. Move ecosystem.config.cjs to the crm/ root and update it: both apps get `cwd: './backend'` with scripts dist/server.js and dist/worker.js, keeping the existing cluster/fork split (aranax-api in cluster mode via API_INSTANCES default 2, aranax-worker as a single fork instance holding the scheduler advisory lock), restart limits, memory thresholds and log file paths.
7. Delete any leftover "src/frontend" exclusion if one exists in the backend tsconfig files. The frontend is now a sibling package, not a folder inside the backend, so no exclusion is needed.

### Phase 1 verification gate

From crm/: `pnpm install`, then `pnpm --filter @aranax/backend typecheck`, `build`, `test`, and `test:integration`. All must pass with the same results as before the move: 42 unit tests and 19 integration tests. Then run `pnpm --filter @aranax/backend openapi:export` and confirm docs/openapi.json still generates 45 paths. If any count differs, stop and report the difference before continuing.

## PHASE 2 — Shared contracts package

The frontend needs the same role, permission and enum values the backend enforces. Mirroring them by hand guarantees drift, so extract them once.

1. Create crm/shared as @aranax/contracts: a small TypeScript package with no runtime dependencies, built with tsc to dist with declaration files, and package.json exports/main/types pointing at the build. Give it a `build` and `typecheck` script. The root `build` script must build it before the backend and frontend.
2. Move these from crm/backend/src/config/constants.ts into the shared package, values unchanged: ROLES, Role, PERMISSIONS, Permission, ROLE_PERMISSIONS, OWNER_ROLES, LEAD_STAGES, LeadStageKey, OPPORTUNITY_STAGES, OpportunityStageKey, LOST_REASONS, SERVICE_INTERESTS, BUDGET_RANGES, TIMELINES, OPPORTUNITY_TYPES, CONTRACT_KINDS, LEAD_PRIORITIES, LEAD_QUALIFICATION, ACTIVITY_TYPES, QUALIFICATION_THRESHOLD, EXPORT_ROW_LIMIT.
3. Keep these backend-only, do not move them: LEAD_STAGE_FOR_OPPORTUNITY, PUBLIC_SPAM_URL_LIMIT, IDEMPOTENCY_TTL_HOURS, RENEWAL_REMINDER_WINDOW_DAYS, LOGIN_MAX_FAILURES, LOGIN_LOCK_MINUTES, ACKNOWLEDGEMENT_TEMPLATES, EVENT_TYPES. These are server policy and internal wiring; the client has no business knowing them.
4. So that no backend file needs rewriting, have src/config/constants.ts re-export everything it moved: `export { ROLES, ... } from '@aranax/contracts';`. Existing backend imports keep working untouched. Add @aranax/contracts as a workspace dependency of both backend and frontend.
5. The permissions model is now single-source. The frontend must import ROLE_PERMISSIONS from @aranax/contracts and never redefine it.

### Phase 2 verification gate

Re-run the full backend suite: typecheck, build, test, test:integration. Identical results required. A changed permission string or stage key would silently break authorization, so if anything fails, revert the extraction rather than patching around it.

## PHASE 3 — Frontend

### Tooling and dependencies

From crm/frontend, with these version constraints. Pin TypeScript to ~5.9 (7 is published but unverified here and broke the backend). Pin eslint to ^9 and vitest to ^4, because the plugins below are not verified against eslint 10 or vitest 5. Report any peer-dependency warning instead of forcing past it.

pnpm add react@^19 react-dom@^19 react-router@^8 @tanstack/react-query@^5 axios@^1 zod@^4 react-hook-form@^7 @hookform/resolvers@^7
pnpm add -D vite@^8 @vitejs/plugin-react@^6 typescript@~5.9 @types/react@^19 @types/react-dom@^19 eslint@^9 typescript-eslint eslint-plugin-react-hooks eslint-plugin-react-refresh vitest@^4 jsdom @testing-library/react@^16 @testing-library/jest-dom @testing-library/user-event msw openapi-typescript@^7

Scripts: dev, build, preview, typecheck, lint, test, test:watch, and types:api which runs openapi-typescript against ../backend/docs/openapi.json and writes src/api/schema.d.ts.

Do not add a UI component library unless genuinely needed. Write CSS in a small set of files using custom properties. Use accessible, semantic HTML. No `any`. No disabled lint or type rule without a comment explaining why.

### API contract

- Generate src/api/schema.d.ts from ../backend/docs/openapi.json with openapi-typescript and commit it, so a frontend build never requires a running backend. Document that it is regenerated with `pnpm types:api` whenever the API changes.
- Derive request and response types from that generated schema. Do not hand-write field names; the generated types are the contract.
- Every JSON response uses an envelope: success is { success: true, data, meta }, error is { success: false, error: { code, message }, meta: { requestId } }. Write typed helpers for both.
- Lists are paginated; read the pagination field names from the generated schema.
- Money arrives as decimal strings. Never convert to float for display or arithmetic. Format with Intl.NumberFormat using the currency code, keeping the value a string.
- Dates are UTC. Display in the user's locale without shifting the stored date.
- Public lead POST accepts an Idempotency-Key header: generate one UUID per form session and reuse it on retry.
- Creates return 201. Public lead submission returns { status: "received", reference }.

### URLs and origin configuration

Production is single-origin: the app at https://crm.aranax.tech, the API at https://crm.aranax.tech/api/v1. Build for that, but keep the API origin configurable so a split-subdomain deployment needs no code change.

Development: frontend http://localhost:5173, backend http://localhost:4000. The frontend requests /api/v1/... with no host and Vite proxies to the backend.

The Axios base URL must be derived, never hardcoded:

const base = import.meta.env.VITE_API_BASE_URL ?? '';
// baseURL: `${base}/api/v1`

Empty resolves to /api/v1 on the current origin, correct for both development (through the proxy) and same-origin production. Setting it to https://api.crm.aranax.tech switches the same build to a split deployment.

vite.config.ts: base '/', build output to dist, server port 5173 with proxy '/api' to process.env.VITE_DEV_API_PROXY ?? 'http://localhost:4000' and changeOrigin true.

.env.example documents exactly two variables: VITE*API_BASE_URL (empty for same-origin, the default) and VITE_DEV_API_PROXY (http://localhost:4000, dev server only). No secrets in any VITE* variable — everything so prefixed is public in the bundle.

The backend needs no CORS for this model: CORS_ORIGINS stays empty. Behind Nginx it needs TRUST_PROXY=true and HOST=127.0.0.1. SWAGGER_ENABLED must be false in production because /docs publishes the whole API surface.

### Content Security Policy

Do not put a CSP meta tag in index.html: it would apply in development too and break Vite's HMR websocket and inline injection. Document the production CSP as Nginx response headers instead, defaulting to 'self' for script, style, connect and img (plus data: for images), and note that connect-src is the directive to widen if the API moves to its own subdomain.

### Architecture

crm/frontend/src/
app/ providers, router, error boundary
api/ axios instance, interceptors, generated schema.d.ts, typed endpoint modules (auth, leads, opportunities, follow-ups, customers, revenue, analytics, exports, users, public), error normaliser
features/ one folder per domain with its components, query hooks, Zod schemas and tests
components/ shared UI: DataTable, Pagination, StatusBadge, EmptyState, ErrorState, Spinner, ConfirmDialog, FormField
lib/ formatting (money, dates), permission helpers over @aranax/contracts, constants
test/ MSW handlers, render helpers

A feature may import from components/, lib/ and api/, never from another feature's internals. Route-level code splitting with React.lazy and Suspense.

### Authentication and authorization

- Login posts to /api/v1/auth/login. Hold the access token in memory only, never localStorage or sessionStorage. Document in the frontend README that users re-login after a reload, because the backend has no refresh tokens yet.
- Attach `Authorization: Bearer <token>` in a request interceptor. On 401, clear the session and redirect to /login preserving the intended route.
- Load the current user from /api/v1/auth/me. Inspect that response's real shape before using it. Permissions come from the backend response; where only a role is returned, resolve permissions through ROLE_PERMISSIONS from @aranax/contracts.
- Hide navigation and actions the user cannot use, but treat the backend as the authority: render a clear "not permitted" state when a 403 arrives.

### Screens

1. Login.
2. Dashboard: /api/v1/analytics/overview with date-range and base-currency controls. Funnel counts plus invoiced and collected revenue. Render insufficient_data as an explicit labelled state, never as zero — the API returns it when no exchange rate is stored, and showing zero would misstate revenue.
3. Leads: paginated, searchable, filterable list; create; detail with tabs for activities, stage history and assignment; stage change, assign, qualify, soft delete with confirmation.
4. Opportunities: list, create, detail, stage change surfacing the forward-only rule, proposal history, close as won or lost with the required fields.
5. Follow-ups: list with status and due-date filters, complete action.
6. Customers: list, detail with contacts, contracts and history; renewals view.
7. Revenue: records list and create form (must link to a customer, opportunity or contract); exchange rates list and create form (source is required).
8. Campaigns with acquisition costs; referrals.
9. Exports: leads and revenue CSV via Axios responseType 'blob', then trigger the download. Surface the x-export-row-count and x-export-truncated response headers.
10. Users (admin only).
11. Public, no auth: project enquiry form, discovery request form, AI/SaaS readiness assessment (list, take, evaluate anonymously, submit with contact details).

### Forms

React Hook Form with a Zod schema per form, matching the backend rules in the generated schema. Map VALIDATION_ERROR field errors onto the matching fields. Disable submit while pending and prevent double submission.

### Errors, loading and states

Every query has loading, empty, error and success states. Errors show the safe envelope message plus the requestId so support can trace it. Never surface stack traces or raw error objects. Top-level error boundary plus one per route. TanStack Query: sensible staleTime, retry network and 5xx only, never 4xx.

### Security and privacy

No secrets in the client. Do not log personal data to the console; no console.log in production code. Escape all rendered user content; no dangerouslySetInnerHTML.

### Accessibility

Labels on all inputs, focus management in dialogs, keyboard-operable tables, sufficient colour contrast, aria-live for async status messages.

### Testing

- Unit: money and date formatters, error normaliser, Zod schemas, permission helpers.
- Component: login form, lead create form, revenue form validation.
- Integration with MSW: login success and failure, 401 redirect, leads list paging, a 403 state, insufficient_data rendering, CSV export headers.
- Also assert the Axios base URL resolves to /api/v1 when VITE_API_BASE_URL is empty and to an absolute URL when set.
- Run the tests. Do not claim they pass without running them.

## Deployment documentation

Write crm/README.md covering the workspace layout, install and run commands, and production deployment. Include the Nginx server block for crm.aranax.tech showing: static root at crm/frontend/dist; `location /api/ { proxy_pass http://127.0.0.1:4000; }` with X-Forwarded-\* headers; `location / { try_files $uri $uri/ /index.html; }`; /health and /ready restricted to the internal network; and the CSP response headers. State plainly that without the try_files fallback a reload on a nested route such as /leads/:id returns 404. Document `pm2 start ecosystem.config.cjs --env production` from crm/, and that the worker must stay at one instance.

Note that a staging host needs its own database and JWT_SECRET, and that a staging frontend must never point at the production API, because the lead endpoints write real records and will queue real email once SMTP is configured.

## Definition of done

From crm/, run and fix every failure before reporting:

1. pnpm install
2. pnpm typecheck (shared, backend, frontend)
3. pnpm lint
4. pnpm build (shared, then backend, then frontend)
5. pnpm test
6. pnpm test:integration (backend, against the test database)

Then start the API and the frontend, log in with a seeded user, and verify the dashboard, one lead detail page, and a CSV download. Under `pnpm --filter @aranax/frontend preview`, confirm a hard reload on a nested route works.

Report what you actually ran and the real results, including the backend test counts before and after the restructure. List everything not done. Do not describe untested behaviour as working.
