# Module Inventory

Generated from the actual backend source (`crm/backend/src/modules/`), not invented. Each module is a Fastify plugin registered in `crm/backend/src/app.ts`.

| Module | Purpose | DB table(s) | Key routes |
|---|---|---|---|
| `ai` | AI features: lead scoring/enrichment/dedup, conversation extraction, follow-up drafting, proposal generation, revenue forecasting, sales copilot chat, smart lead-assignment suggestions, LLM provider config | `conversations`, `proposal_versions`, `forecast_snapshots`, `rep_skills`, `llm_provider_configs`, `ai_query_audit_logs` | `/leads/:id/conversations`, `/leads/:id/follow-up-draft`, `/leads/:id/suggest-assignee`, `/opportunities/:id/health`, `/opportunities/:id/proposals[/generate]`, `/forecasts/revenue`, `/copilot/query`, `/settings/llm[/:id][/activate\|/test]`, `/public/chat/message` |
| `analytics` | Pipeline/revenue attribution reporting | reads from leads/opportunities/revenue (no own table) | `/analytics/overview`, `/analytics/attribution` |
| `assessments` | Public lead-qualification quiz catalog + scored submissions | `assessments`, `assessment_submissions` | `/public/assessments`, `/public/assessments/:slug[/evaluate\|/submissions]` |
| `audit` | Business audit-trail writer (no routes — internal write-only repository) | `audit_logs` | n/a |
| `auth` | Login, session introspection, permission lookup | `users` (reads for login) | `/auth/login`, `/auth/me`, `/auth/permissions` |
| `campaigns` | Marketing campaigns, ad-spend tracking, referrals | `campaigns`, `acquisition_costs`, `referrals` | `/campaigns[/:id]`, `/campaigns/:id/acquisition-costs`, `/acquisition-costs`, `/referrals[/:id]` |
| `common` | Shared idempotency helper, response envelope, zod schema fragments — infra, not a business module | `idempotency_keys` | n/a |
| `customers` | Converted-customer accounts, contacts, contracts, renewals | `customers`, `contacts`, `contracts` | `/customers[/:id]`, `/customers/:id/history`, `/customers/:id/contacts`, `/customers/:id/contracts`, `/contracts/renewals` |
| `email` | Email provider abstraction (SMTP) + templates — infra | — | n/a |
| `events` | Server-Sent-Events stream for live UI updates | — | `/events` |
| `follow-ups` | Tasks/reminders tied to leads, opportunities, or customers | `follow_up_tasks` | `/follow-ups`, `/follow-ups/:id/complete` |
| `geo` | Static country reference list for dropdowns | `countries` | `/countries` |
| `health` | Liveness/readiness probes | — | `/health`, `/ready` |
| `integrations` | Outbound CRM adapter (HubSpot) + booking webhook/public booking config | `crm_sync_records` | `/public/booking-config`, `/webhooks/bookings/:provider` |
| `leads` | Core lead capture, scoring, lifecycle, stage/assignment, activities, public intake forms | `leads`, `lead_stages`, `lead_stage_history`, `lead_assignment_history`, `lead_activities` | `/leads[/:id]`, `/leads/:id/stage`, `/leads/:id/assign`, `/leads/:id/qualify`, `/leads/:id/activities`, `/leads/:id/history`, `/leads/:id/score-explain`, `/public/leads`, `/public/discovery-requests` |
| `opportunities` | Sales pipeline deals, stage transitions, proposals, history | `opportunities`, `opportunity_stages`, `opportunity_stage_history` | `/opportunities[/:id]`, `/opportunities/:id/stage`, `/opportunities/:id/proposals`, `/opportunities/:id/history` |
| `options` | App-managed dropdown option sets (service interest, budget range, currency, etc.), admin CRUD | `option_items` | `/options` (public read), `/settings/options[/:id]` (admin CRUD) |
| `rbac` | Role & permission administration — DB-backed, authoritative at runtime | `role_permissions`, `role_meta` | `/settings/roles`, `/settings/roles/permissions`, `/settings/roles/:role[/permissions]`, `/settings/roles/meta` |
| `revenue` | Revenue/invoice records and FX rates | `revenue_records`, `exchange_rates` | `/revenue-records`, `/exchange-rates` |
| `security` | Security/auth event log + read-only security config snapshot | `security_events` | `/settings/security-events`, `/settings/security-config` |
| `users` | Internal CRM user/account management | `users` | `/users[/:id]` |

## Notes

- The `rbac` module's tables (`role_permissions`, `role_meta`) live in `backend/src/db/schema/security.ts` alongside `security_events`, not a separate `rbac.ts` schema file.
- `audit_logs` (business audit trail, e.g. `customer.created`, `opportunity.won`) and `security_events` (auth/access events — login attempts, lockouts, permission changes) are two distinct logging systems; see `role-permission-matrix.md` and `workflow-inventory.md` for how they're used.
- 22 total backend routes are gated by specific permissions (see `role-permission-matrix.md`); public routes (`/public/*`, `/options`, `/countries`, `/health`, `/ready`) require no authentication.
