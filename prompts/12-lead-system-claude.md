# CODEX MASTER IMPLEMENTATION PROMPT (AS BUILT)

> **Revision note.** This copy keeps the original prompt text and adds an **As built** note under each section to record what was implemented, what was deviated from, and what is still open. Status values: **Built**, **Partial**, **Deviated**, **Not built**. Verification: typecheck and build pass; 42 unit tests and 19 integration tests pass against PostgreSQL 16. Tests were not run for the logging-specific scenarios listed in section 30.

## Production-Grade Lead Capture, CRM, Lead Nurturing, Sales Pipeline and Revenue Analytics Backend

### 1. Role and objective

Act as a Principal Backend Architect, Senior Node.js/Fastify Engineer, PostgreSQL Database Architect, and Production Reliability Engineer.

Build a standalone, production-ready REST API backend for Aranax Technologies.

Technology stack:

- Node.js LTS
- Fastify
- TypeScript (strict mode)
- Drizzle ORM
- PostgreSQL
- Zod
- pnpm
- Pino structured logging
- OpenAPI 3.1 / Swagger
- JWT authentication and RBAC
- BullMQ + Redis when background processing is required
  - **Deviated:** BullMQ is not used. Background work runs from a PostgreSQL transactional outbox (`outbox_events`, claimed with `FOR UPDATE SKIP LOCKED`). Redis is optional and used only for shared rate-limit counters when `REDIS_URL` is set. Reason: the outbox keeps the enqueue atomic with the business transaction without a second durable store.
- Vitest
- PM2
- Nginx

**Backend only. Do not implement any frontend application, UI, dashboard components, or frontend framework.**

Implement real working code, migrations, API endpoints, automated tests, background workers, and production deployment configurations.

Do not stop at architectural descriptions or placeholder implementations.

---

### 2. Clean up the existing project

> **As built:** Built. The project was empty at start, so there were no unrelated modules to remove.

If the existing project contains modules from a different application, remove unrelated modules.

### 3. Required project structure

> **As built (Deviated):** The tree is implemented with these differences.
> - Present: `config/`, `db/` (schema, migrations, `seed.ts`), `modules/`, `jobs/`, `plugins/`, `logger/`, `errors/`, `middleware/`, `utils/`, `app.ts`, `server.ts`, `worker.ts`, `scripts/export-openapi.ts`, `docs/`, `ecosystem.config.cjs`, `.env.example`, `drizzle.config.ts`.
> - Module folders: `assessments`, `auth`, `audit`, `campaigns`, `common`, `customers`, `email`, `follow-ups`, `integrations` (booking webhook and CRM adapters), `leads` (including activities and history), `opportunities`, `revenue`, `analytics`, `users`. `referrals` has endpoints but no separate module folder.
> - Not created: `crm/`, `activities/`, nurture module, `tests/e2e/`, `logs/` (PM2 writes logs at runtime).
> - Layout inside modules: controller, service, repository, schema per module. Model and types files were folded into schema and service files.
> - Jobs: `jobs/queues/outbox.repository.ts` replaces a BullMQ queue. The worker is `src/worker.ts`, and the scheduler runs inside the worker process rather than as `jobs/scheduler.ts` in a separate process.


Adopt the following structure:

```text
api/
├── src/
│   ├── config/
│   │   ├── env.ts
│   │   ├── database.config.ts
│   │   ├── logger.config.ts
│   │   └── constants.ts
│   ├── db/
│   │   ├── client.ts
│   │   ├── schema/
│   │   ├── migrations/
│   │   └── seed.ts
│   ├── modules/
│   │   ├── auth/
│   │   ├── users/
│   │   ├── leads/
│   │   ├── assessments/
│   │   ├── activities/
│   │   ├── crm/
│   │   ├── opportunities/
│   │   ├── follow-ups/
│   │   ├── campaigns/
│   │   ├── customers/
│   │   ├── referrals/
│   │   ├── revenue/
│   │   ├── analytics/
│   │   ├── email/
│   │   ├── integrations/
│   │   ├── audit/
│   │   └── common/
│   ├── jobs/
│   │   ├── workers/
│   │   ├── processors/
│   │   ├── queues/
│   │   └── scheduler.ts
│   ├── plugins/
│   │   ├── auth.plugin.ts
│   │   ├── authorization.plugin.ts
│   │   ├── logger.plugin.ts
│   │   ├── request-context.plugin.ts
│   │   ├── error-handler.plugin.ts
│   │   ├── rate-limit.plugin.ts
│   │   └── swagger.plugin.ts
│   ├── logger/
│   │   ├── index.ts
│   │   ├── serializers.ts
│   │   ├── redaction.ts
│   │   ├── audit-logger.ts
│   │   └── correlation.ts
│   ├── errors/
│   │   ├── app.error.ts
│   │   ├── error-codes.ts
│   │   └── error-mapper.ts
│   ├── middleware/
│   │   └── request-context.ts
│   ├── utils/
│   ├── types/
│   ├── app.ts
│   └── server.ts
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── logs/
├── docs/
├── drizzle.config.ts
├── ecosystem.config.cjs
├── .env.example
├── package.json
└── tsconfig.json
```

For each business module, use the existing controller/service/model pattern, adding schema and repository files where appropriate.

Example:

```text
modules/leads/
├── lead.controller.ts
├── lead.service.ts
├── lead.model.ts
├── lead.repository.ts
├── lead.schema.ts
├── lead.types.ts
└── index.ts
```

Controllers handle HTTP requests and responses.

Services handle business logic and transactions.

Repositories handle Drizzle queries.

Schemas handle request and response validation.

Keep modules loosely coupled.

---

# PART A — CORE BUSINESS FUNCTIONALITY

### 4. Lead capture

> **As built (Built, with deviations):** Public lead and discovery endpoints, booking config, booking webhook, and the four assessment endpoints are implemented. Validation, honeypot, URL-count spam limit, consent, idempotency keys, duplicate detection, and transactional outbox acknowledgements are in place. Sales notifications and CRM queueing are enqueued in the same transaction.
> - **Deviated:** The booking webhook validates the body only after the HMAC signature check passes. Unsigned or badly signed requests get 401 without schema parsing.
> - **Deviated:** Creates return 201, and public lead submission returns `201 { status: "received" }`.
> - Lead submissions survive email or CRM outages because the outbox keeps the event and retries with backoff. Verified by an integration test where the email provider fails, the lead is kept, and delivery succeeds on retry.


Implement:

- Public project enquiry API
- Discovery call enquiry API
- Configurable booking-provider integration
- AI/SaaS readiness assessment API
- Website form-source tracking
- Lead source and UTM attribution
- Duplicate detection
- Submission idempotency
- Lead validation
- Spam prevention
- Consent management
- Transactional acknowledgement emails
- Sales team notifications
- CRM synchronization queueing

Endpoints:

```text
POST /api/v1/public/leads
POST /api/v1/public/discovery-requests
GET  /api/v1/public/booking-config
POST /api/v1/webhooks/bookings/:provider

GET  /api/v1/public/assessments
GET  /api/v1/public/assessments/:slug
POST /api/v1/public/assessments/:slug/evaluate
POST /api/v1/public/assessments/:slug/submissions
```

Support anonymous assessment evaluation without forcing contact submission.

Lead submissions must not be lost when email or CRM synchronization fails.

Use transactionally persisted outbox events.

### 5. Lead management

> **As built (Built):** Lead list (search, filters, pagination, sort), create, read, update, soft delete, stage change, assignment (`PATCH`), qualification (`POST`), activities (list and create), and history endpoints are implemented. Stage history and assignment history are written. Ownership checks return 404 for records outside the caller's scope.
> - **Deviated:** The stage list uses the ten stages in the prompt, but the constants are keyed as `new_lead`, `contacted`, and so on, not display names.
> - **Deviated:** The assignment history table is `lead_assignment_history`.
> - Scoring (0–100) is implemented from budget, timeline, decision maker, service fit, company, and discovery request. Qualified at ≥ 60.


Implement:

- Lead CRUD
- Lead assignment
- Configurable pipeline stages
- Lead qualification
- Lead scoring
- Priority management
- Activity history
- Notes
- Lead stage history
- Search
- Pagination
- Filtering
- Ownership
- Follow-up scheduling

Stages:

1. New Lead
2. Contacted
3. Qualified
4. Discovery Scheduled
5. Discovery Completed
6. Proposal Sent
7. Negotiation
8. Won
9. Lost
10. Nurturing

Endpoints:

```text
GET    /api/v1/leads
POST   /api/v1/leads
GET    /api/v1/leads/:id
PATCH  /api/v1/leads/:id
DELETE /api/v1/leads/:id

PATCH  /api/v1/leads/:id/stage
PATCH  /api/v1/leads/:id/assign
POST   /api/v1/leads/:id/qualify

GET    /api/v1/leads/:id/activities
POST   /api/v1/leads/:id/activities
GET    /api/v1/leads/:id/history
```

Preserve historical stage transitions and assignment changes.

Prevent unauthorized modification of another user's records.

### 6. CRM and opportunities

> **As built (Partial):** Opportunity CRUD, stage transitions with forward-only and terminal rules, probability, estimated value, expected close date, proposals, won and lost status, lost reasons, and customer conversion on won are implemented. Stage history is written.
> - **Deviated:** Zoho is deferred. Only HubSpot has an adapter (CRM v3 contacts API). `CRM_PROVIDER=none` records sync events as `skipped`, never as synced.
> - Provider abstraction and retryable synchronization are built: failures are rethrown so the outbox retries them.


Implement:

- Internal CRM records
- Configurable sales stages
- Opportunity CRUD
- Opportunity stage transitions
- Deal probability
- Estimated deal value
- Expected close date
- Proposal tracking
- Won/lost status
- Lost reasons
- Customer conversion
- CRM integration adapters

Integrations should support configured providers such as HubSpot and Zoho.

Do not assume either service is already configured.

Implement provider abstractions and safe retryable synchronization.

### 7. Lead nurturing

> **As built (Not built):** Nurture sequences, sequence steps, enrollment, pause and resume, sales takeover, email scheduling from sequences, unsubscribe, and marketing suppression are not implemented. There are no `nurture_sequences` or `sequence_enrollments` tables. Only transactional acknowledgement emails exist, which keeps promotional sending out of scope until consent handling is designed.


Support configurable sequences for:

- AI SaaS prospects
- RAG and AI development prospects
- White-label agency prospects
- General software development prospects

Implement:

- Nurture sequence creation
- Sequence steps
- Lead enrollment
- Pause/resume
- Manual sales takeover
- Follow-up tasks
- Email scheduling
- Sequence cancellation
- Unsubscribe
- Marketing suppression
- Meeting-related suppression
- Conversion-related suppression

Transactional acknowledgements and promotional marketing must follow separate rules.

Do not send marketing emails without appropriate consent or other established lawful basis.

### 8. Customers and referrals

> **As built (Partial):** Customer CRUD, contacts, contracts, renewals listing, customer history, won-opportunity conversion, referral endpoints, and acquisition costs under campaigns are implemented. Renewal reminders are queued by the scheduler.
> - **Not built:** Account review records, cross-sell and upgrade opportunity generation (they can be created manually as opportunities of type `cross_sell` or `upgrade`), and referral-attributed deal reporting beyond the referral link on opportunities.


Implement:

- Customer account CRUD
- Contacts
- Won opportunity association
- Account reviews
- Renewal tracking
- Maintenance contract reminders
- Cross-sell opportunities
- Upgrade opportunities
- Customer history
- Referral source attribution
- Referral-related deals and won values

### 9. Revenue analytics

> **As built (Partial):** Implemented: funnel counts (leads created, qualification breakdown, open, won, lost), lead-to-won rate and win rate, invoiced and collected revenue per currency, conversion with stored exchange rates, `insufficient_data` when a rate is missing, and CSV exports for leads and revenue records.
> - **Not built:** Open and weighted pipeline value, won contract value as a separate figure, average deal size, sales velocity, referral conversion, customer retention, CAC, LTV, and historical customer revenue. These are listed as deferred in the README, not implemented.
> - **Deviated:** Reporting filters are period (from/to, year, quarter, month), base currency, and for exports stage, owner, qualification, kind, currency, and customer. Service, country, source, and campaign filters on analytics are not implemented.
> - Money is `NUMERIC(14,2)` on the wire as strings, with decimal.js arithmetic. Pipeline, won, and actual revenue are kept as separate fields, so won deals are not counted as revenue.


Implement:

- Leads by source
- Qualified leads
- Discovery meetings
- Proposals sent
- Won opportunities
- Lost opportunities
- Open pipeline value
- Weighted pipeline value
- Won contract value
- Actual revenue
- Conversion rates
- Average deal size
- Sales velocity
- Referral conversion
- Customer retention
- Acquisition costs
- CAC
- Historical customer revenue
- LTV where defensible

Maintain separate values for:

1. Estimated pipeline revenue
2. Won contract value
3. Actual recognized or invoiced revenue

Do not treat won deals as actual collected revenue.

Do not fabricate missing revenue or acquisition costs.

Use PostgreSQL NUMERIC and decimal-safe calculations.

Implement multi-currency support with explicitly sourced exchange rates. Do not combine unlike currencies without valid conversion.

Return `insufficient_data` where required.

Provide reporting filters:

- Date range
- Month
- Quarter
- Year
- Service
- Country
- Source
- Campaign
- Owner
- Currency

Provide secure CSV exports.

---

# PART B — PRODUCTION-GRADE LOGGING AND OBSERVABILITY

### 10. Logging architecture

> **As built (Built):** Pino is the only logger. No `console.*` calls are used for operational logging. Module loggers are children of the shared root logger. Fastify uses the same Pino instance through `loggerInstance`.


Implement a centralized structured logging system using **Pino**, integrated with Fastify's native logging capabilities.

Do not use console.log, console.error, or console.warn for application or production operational logging.

Use one consistent logging configuration across:

- HTTP server
- Controllers
- Services
- Repositories
- Background workers
- Email delivery
- CRM integrations
- Database operations
- Authentication
- Security
- Scheduled tasks
- Error handling

Prefer Fastify's request-scoped logger and the existing shared Pino instance.

Do not create a new unrelated logger instance for each module.

### 11. Logger configuration

> **As built (Built, with deviations):** Levels, defaults (debug in development, info in production), UTC ISO timestamps, service and environment fields, redaction, and pretty output in development are implemented.
> - **Deviated:** Each line includes `pid` and `hostname`, and an `instance` field that is `null` outside PM2. PM2 does not yet populate it.
> - **Not built:** Retention variables (`APP_LOG_RETENTION_DAYS`, `ERROR_LOG_RETENTION_DAYS`, `SECURITY_LOG_RETENTION_DAYS`) are not read by the app. Retention is handled by the PM2 log rotation setup in `docs/logging.md`.


Create:

```text
src/config/logger.config.ts
src/logger/index.ts
src/logger/serializers.ts
src/logger/redaction.ts
src/logger/correlation.ts
src/plugins/logger.plugin.ts
```

Supported logging levels:

| Level | Purpose                                      |
| ----- | -------------------------------------------- |
| fatal | Critical application failure                 |
| error | Failed operation requiring investigation     |
| warn  | Recoverable failure, unusual behavior        |
| info  | Significant application and lifecycle events |
| debug | Development troubleshooting                  |
| trace | Detailed diagnostic information              |

Production default: `info`

Development default: `debug`

Allow configuration using:

```env
LOG_LEVEL=info
LOG_FORMAT=json
LOG_PRETTY=false
LOG_REDACTION=true
LOG_SERVICE_NAME=aranax-lead-api
LOG_ENVIRONMENT=production
LOG_INCLUDE_STACK=false
```

Requirements:

- Structured JSON logs in production
- Human-readable pretty logs in development
- Configurable log level
- UTC ISO 8601 timestamps
- Service name and environment
- Application version
- Process ID and PM2 instance identifier where available
- Log event category
- Request correlation
- Redaction
- Safe error serialization

Avoid synchronous filesystem logging in request handlers.

Use asynchronous, operationally managed log collection.

### 12. Required structured log format

> **As built (Partial):** Events use `module.action` names. Implemented names include `lead.assigned`, `lead.stage_changed`, `lead.created`, `lead.updated`, `lead.qualified`, `lead.duplicate_detected`, `opportunity.created`, `revenue.record_created`, `auth.*`, `job.started`, `job.sent`, `job.skipped`, `job.retry_scheduled`, `job.dead_lettered`, `email.delivery_started`, `email.provider_accepted`, `email.failed`, `export.leads_csv`, `export.revenue_csv`, `security.*`, and `system`/`server.*` lifecycle events.
> - **Deviated:** The job events are `job.sent` and `job.dead_lettered`, not `job.completed` and `job.permanently_failed`. `job.poll_failed` was added.
> - **Not built:** `email.queued`, `email.delivery_confirmed`, `crm.sync_started`, and `crm.sync_completed`. Delivery is only ever "provider accepted", because SMTP gives no receipt.


Example:

```json
{
    "level": "info",
    "time": "2026-11-12T06:45:00.000Z",
    "service": "aranax-lead-api",
    "environment": "production",
    "event": "lead.created",
    "requestId": "req-a2f91",
    "correlationId": "cor-f3012",
    "module": "leads",
    "userId": "user-uuid",
    "leadId": "lead-uuid",
    "durationMs": 48,
    "message": "Lead created successfully"
}
```

Create an internal event naming convention using:

```text
module.action
```

Examples:

```text
lead.created
lead.updated
lead.assigned
lead.qualified
lead.stage_changed

opportunity.created
opportunity.stage_changed
opportunity.won
opportunity.lost

email.queued
email.sent
email.failed

crm.sync_started
crm.sync_completed
crm.sync_failed

auth.login_success
auth.login_failed
auth.access_denied

job.started
job.completed
job.retry
job.failed

revenue.record_created
revenue.record_updated

system.startup
system.shutdown
system.unhandled_error
```

Use stable identifiers for events so they can be searched and aggregated.

### 13. HTTP request and response logging

> **As built (Built):** One `http.request_completed` line per request, emitted from `onResponse`, with method, sanitized route pattern, status, duration, request and response sizes, `requestId`, `correlationId`, and `userId` when authenticated. Query strings and bodies are not logged.
> - **Deviated:** Fastify's built-in request logging is turned off with `disableRequestLogging`. That option is deprecated in Fastify 5 in favour of `logController`, which the typed app could not accept. It still works, and the warning is noted for the Fastify 6 upgrade.


Implement automatic request logging using Fastify and Pino.

Capture:

- Request ID
- Correlation ID
- HTTP method
- Sanitized route pattern
- Status code
- Request duration
- Request size where available
- Response size where available
- Authenticated user ID when appropriate
- Service name
- Environment

Do not log full request bodies or query strings by default.

Use sanitized route patterns rather than raw URLs where sensitive values may appear.

Example:

```json
{
    "level": "info",
    "event": "http.request_completed",
    "requestId": "req-123",
    "method": "POST",
    "route": "/api/v1/public/leads",
    "statusCode": 201,
    "durationMs": 42,
    "message": "HTTP request completed"
}
```

Avoid duplicate request completion logs from multiple Fastify hooks.

Use request lifecycle hooks and Fastify's standard logger behavior consistently.

### 14. Correlation IDs and distributed tracing

> **As built (Partial):** `X-Request-ID` and `X-Correlation-ID` are validated against `^[A-Za-z0-9][A-Za-z0-9._:-]{7,127}$`, generated when absent, returned in the response, and carried through AsyncLocalStorage. Jobs keep the originating correlation ID from the outbox row.
> - **Not built:** W3C `traceparent` and OpenTelemetry. `OTEL_ENABLED` is not in the config.


Every incoming API request must receive a request ID.

Support a correlation ID for tracing business operations across:

- Incoming API request
- Lead creation
- Email queue
- CRM synchronization
- Follow-up creation
- Background jobs
- Webhook processing

Use:

```text
X-Request-ID
X-Correlation-ID
```

Requirements:

- Generate safe IDs when absent.
- Validate supplied IDs against length and character restrictions.
- Do not blindly trust client-generated identifiers for security decisions.
- Return request ID in the response header.
- Preserve correlation ID across supported asynchronous workflows.
- Include correlation IDs in application logs.
- Propagate request context through AsyncLocalStorage where appropriate.
- Avoid leaking context between concurrent requests.

Support W3C `traceparent` when OpenTelemetry is enabled.

Do not treat request IDs and distributed trace IDs as interchangeable.

Optional OpenTelemetry instrumentation must be configuration-driven.

### 15. Contextual logging

Support child loggers.

Example:

```typescript
const log = request.log.child({
    module: "leads",
    leadId,
});

log.info({ event: "lead.created" }, "Lead created successfully");
```

Context should include only identifiers and operational metadata needed for troubleshooting.

Never attach the entire lead, customer, email, JWT payload, or authentication session to logger context.

Services and background workers should be able to receive contextual loggers without requiring Fastify request objects.

### 16. Sensitive data redaction

> **As built (Built):** Pino path redaction plus a deep `sanitizeForLog` pass. Emails are masked in logs and for roles without `leads.pii`. Third-party errors are summarized by provider and category rather than logged raw. Unit tests cover nested secrets and email masking.


Implement a centralized redaction policy.

Never log:

- Passwords
- JWTs
- Refresh tokens
- API keys
- Authorization headers
- Session cookies
- SMTP credentials
- Database passwords
- OAuth secrets
- Webhook signing secrets
- Full email bodies
- Private project descriptions by default
- Payment credentials

Configure Pino redaction for known sensitive field paths.

Include headers such as:

```text
authorization
cookie
set-cookie
x-api-key
proxy-authorization
```

Do not rely exclusively on Pino path-based redaction.

Also prevent sensitive data from being logged through generic request body serialization, arbitrary error objects, and provider responses.

Implement safe serializers for third-party API errors.

Record useful identifiers and error categories rather than sensitive payloads.

### 17. Centralized exception handling

> **As built (Built):** Typed errors (validation, authentication, authorization, not found, conflict, business rule, external service, database) with stable codes. `mapError` maps Zod and Fastify validation errors, pg SQLSTATE codes (23505→409, 23503→422, 23514 and 22P02→400, connection and serialization classes→503, admin shutdown 57P01/57P02/57P03→503), and network codes→503. Errors are logged once at the handler boundary.
> - **Built:** `uncaughtException` and `unhandledRejection` log at fatal and exit with code 1 after a bounded shutdown.
> - **Not tested:** The fatal-exit path has no automated test.


Create:

```text
src/errors/app.error.ts
src/errors/error-codes.ts
src/errors/error-mapper.ts
src/plugins/error-handler.plugin.ts
```

Implement typed application errors:

- ValidationError
- AuthenticationError
- AuthorizationError
- NotFoundError
- ConflictError
- RateLimitError
- DatabaseError
- ExternalServiceError
- BusinessRuleError

Each error should have:

- Stable error code
- Safe public message
- HTTP status
- Operational/non-operational classification
- Optional cause
- Internal diagnostic metadata

Map errors to consistent API responses.

Example:

```json
{
    "success": false,
    "error": {
        "code": "LEAD_NOT_FOUND",
        "message": "The requested lead was not found."
    },
    "meta": {
        "requestId": "req-123"
    }
}
```

Requirements:

- Log unexpected errors once at the correct application boundary.
- Avoid duplicate error logging across controller, service and error handler.
- Avoid logging expected validation errors as server failures.
- Do not expose raw SQL messages or stack traces to clients.
- Preserve internal stack traces for diagnostics when securely configured.
- Map database constraint errors to meaningful controlled responses.
- Identify retryable vs permanent failures.

Handle `uncaughtException` and `unhandledRejection` using a documented fatal-error shutdown strategy.

Do not silently continue operation after an unrecoverable process-level failure.

### 18. Database logging

> **As built (Partial):** `withDbTiming` times repository operations and emits `database.slow_query` above `DB_SLOW_QUERY_MS`. Failures are rethrown unchanged so their mapping is preserved. The pool monitor logs pool statistics on an interval.
> - **Deviated:** Query-level instrumentation is by repository operation name, not a Drizzle logger hook, because the hook does not provide timing.
> - **Not built:** `DB_QUERY_LOGGING` is read by the config but no query logger uses it, so it has no effect.


Use Drizzle ORM's logging/instrumentation interfaces where appropriate.

In production:

- Do not log every SQL statement.
- Do not log SQL bind parameters containing sensitive values.
- Record query failures.
- Record slow query duration.
- Capture a safe query fingerprint or operation name.
- Include correlation ID where available.
- Monitor database connection failures and pool exhaustion.

Configuration:

```env
DB_SLOW_QUERY_MS=500
DB_QUERY_LOGGING=false
```

Example:

```json
{
    "level": "warn",
    "event": "database.slow_query",
    "operation": "leads.search",
    "durationMs": 850,
    "thresholdMs": 500,
    "message": "Database query exceeded threshold"
}
```

Use slow-query thresholds appropriate to the database workload.

Do not assume the ORM provides timing hooks that it does not support; implement instrumentation around repositories or the database driver if necessary.

### 19. Background job logging

> **As built (Built, with deviations):** The outbox worker logs `job.started`, `job.sent`, `job.skipped`, `job.retry_scheduled`, and `job.dead_lettered`, each with job ID, event type, attempt, error code, and backoff. Each job runs in its own correlation context.
> - **Deviated:** There is no queue name, because there is no BullMQ. The event type stands in for it.
> - Retries are logged once per attempt, not per tick, and dead-letter records remain in `outbox_events` with `status = 'dead'`.


Every background job must record appropriate lifecycle events.

Capture:

- Job ID
- Queue name
- Job type
- Correlation ID
- Attempt number
- Start time
- Duration
- Completion status
- Retry decision
- Safe failure reason

Events:

```text
job.started
job.completed
job.retry_scheduled
job.permanently_failed
```

Example:

```json
{
    "level": "error",
    "event": "job.permanently_failed",
    "queue": "crm-sync",
    "jobId": "job-123",
    "leadId": "lead-uuid",
    "attempt": 5,
    "errorCode": "CRM_PROVIDER_UNAVAILABLE",
    "message": "CRM synchronization exhausted retry attempts"
}
```

Log retries without flooding the logging system.

Retain failed jobs or durable failure records for investigation.

### 20. Email delivery logging

> **As built (Built, with deviations):** `email_delivery_logs` records each attempt as `delivery_started`, then `provider_accepted` or `failed`, with the provider message ID and error code. Recipients are stored as a SHA-256 fingerprint, not an address.
> - **Not built:** `email.queued`, `email.delivery_confirmed`, and a queue-time field. `delivery_confirmed` cannot be produced from SMTP.
> - Verified: after a provider outage the lead is kept, the event retries, and delivery is recorded only as provider accepted.


Record:

- Email message ID
- Template identifier
- Provider
- Related lead or customer ID
- Queue time
- Delivery attempt
- Provider acknowledgement
- Failure category

Events:

```text
email.queued
email.delivery_started
email.provider_accepted
email.delivery_confirmed
email.delivery_failed
```

Distinguish provider acceptance from confirmed delivery.

Do not mark an email as delivered solely because an SMTP server accepted it.

Do not log recipient addresses in full unless explicitly permitted by the data policy.

### 21. CRM integration logging

> **As built (Partial):** `crm_sync_records` stores provider, external ID, status, attempts, and error code, and the outbox logs the job lifecycle. Tokens and payloads are not logged.
> - **Not built:** Synchronization direction, a per-sync duration log, and dedicated `crm.sync_*` events.


Record:

- Provider name
- Synchronization direction
- Entity type
- Internal entity ID
- External reference ID where safe
- Synchronization status
- Duration
- Retry attempt
- Provider error category

Do not log:

- OAuth tokens
- Provider secrets
- Full CRM payloads
- Customer private data

Support diagnosis of failed synchronizations using correlation IDs and integration execution logs.

### 22. Security logging

> **As built (Partial):** `SecurityEventLogger` is rate-limited per event name (one per minute) and used for invalid tokens, login lockout, invalid webhook signatures, webhook replay rejection, and authorization denials. Credentials are never included.
> - **Not built:** Repeated-login-failure alerts beyond lockout, suspicious-submission events, sensitive-export security events (exports are written to the audit log instead), and permission-change security events.


Implement security event logging.

Events include:

- Authentication success/failure
- Repeated login failures
- Invalid tokens
- Authorization denials
- Unusual rate-limit activity
- Suspicious API submissions
- Invalid webhook signatures
- Replay attempts
- Sensitive export requests
- Permission changes

Security logs must not expose credentials or tokens.

Use rate-limited security event logging to avoid attacker-generated log flooding.

Security events must be distinguishable from ordinary application information logs.

### 23. Audit logs versus application logs

> **As built (Built):** `audit_logs` is written with `recordAudit`, inside the same transaction as the business change where atomicity matters. Covered actions include lead assignment, stage change, opportunity changes, revenue record and exchange rate creation, follow-up creation and completion, and exports.


Maintain two separate systems.

**Application logging (Pino)**

Purpose:

- Debugging
- Request tracing
- Reliability monitoring
- Error diagnostics
- Job diagnostics
- Performance monitoring

**Business audit logging (PostgreSQL)**

Purpose:

- Lead status history
- Ownership changes
- Deal modifications
- Revenue changes
- Permission changes
- CRM administrative actions
- Sensitive exports

Use the existing audit module where appropriate.

Audit records must persist independently of ordinary application log retention.

Important: Business audit persistence is not equivalent to a Pino log entry.

Where an audit event must be atomic with a business mutation, persist both in the same database transaction.

### 24. Log storage and retention

> **As built (Partial):** The app writes JSON to stdout. `docs/logging.md` describes PM2 log rotation, Loki and OpenSearch shipping, and troubleshooting.
> - **Not built:** Enforced retention. Retention periods are documented starting points, not enforced by the app.


Use structured JSON to stdout/stderr in production.

Allow infrastructure to collect logs through:

- PM2
- systemd/journald
- A log collector such as Fluent Bit
- Centralized observability services

Support integration with:

- Grafana Loki
- Elasticsearch / OpenSearch
- Other compatible logging platforms

Do not make a remote logging platform mandatory.

For PM2 deployments:

- Configure log handling.
- Support log rotation.
- Define retention limits.
- Prevent unlimited disk growth.
- Avoid duplicate logging across PM2 workers.

Do not implement application-managed rotating files inside the request path by default.

Recommended configurable retention policies:

| Log category        | Initial policy                                |
| ------------------- | --------------------------------------------- |
| Application logs    | 30 days                                       |
| Error logs          | 90 days                                       |
| Security logs       | 90 days                                       |
| Business audit logs | Configurable based on compliance requirements |

These are operational starting points, not universal legal retention requirements.

Support retention settings and document secure deletion.

### 25. Log health and observability

> **As built (Partial):** `GET /health` (liveness) and `GET /ready` (database check and outbox status counts) are implemented. Startup configuration is validated. Graceful shutdown is implemented in both the API and the worker, bounded by `SHUTDOWN_TIMEOUT_MS`.
> - **Not built:** Queue connectivity checks (there is no queue), worker heartbeat monitoring, Prometheus metrics, and OpenTelemetry. `METRICS_ENABLED` and `OTEL_ENABLED` are not in the config.
> - **Not tested:** Graceful shutdown has no automated test.


Expose:

```text
GET /health
GET /ready
```

Implement:

- Database readiness
- Queue connectivity checks
- Worker health monitoring
- Graceful shutdown
- Dependency status logging
- Startup configuration validation

Consider optional Prometheus metrics for:

- Request rate
- HTTP error rate
- Request latency
- Database pool utilization
- Slow queries
- Queue backlog
- Queue failures
- Email delivery failures
- CRM sync failures

Do not expose private internal metrics publicly.

For production, support OpenTelemetry instrumentation as a configurable feature when practical.

Logging must remain functional when remote telemetry collection is unavailable.

---

# PART C — SECURITY AND PRODUCTION IMPLEMENTATION

### 26. Authentication and authorization

> **As built (Built, with deviations):** JWT HS256 with issuer check. Account lockout after five failures for 15 minutes. Roles are as listed. Permissions are defined in `src/config/constants.ts`, and the names differ in places from this list: `follow_ups.manage`, `pipeline.view_all`, `leads.pii`, `leads.export`, `referrals.manage`, `revenue.manage`, and `users.manage` are present; `integrations.manage` is not.
> - **Deviated:** Ownership-scoped roles (sales executives without `pipeline.view_all`) see only their own records and get 404 for others.
> - **Not built:** Refresh tokens. `JWT_REFRESH_TTL` is in the example below but is not read by the app.


Implement or reuse JWT-based authentication.

Roles:

- Super Admin
- Sales Manager
- Sales Executive
- Marketing Manager
- Finance
- Read-only Analyst

Use permissions such as:

```text
leads.read
leads.create
leads.update
leads.assign
leads.delete

opportunities.read
opportunities.create
opportunities.update
opportunities.close

customers.read
customers.manage

campaigns.manage

revenue.read
revenue.manage
revenue.export

analytics.read
analytics.financial

users.manage
integrations.manage
```

Enforce both route-level and record-level authorization.

Avoid exposing personally identifiable information in unauthorized responses.

### 27. Database requirements

> **As built (Partial):** Implemented tables: `users`, `leads`, `lead_stages`, `lead_stage_history`, `lead_activities`, `lead_assignment_history`, `assessments`, `assessment_submissions`, `opportunities`, `opportunity_stages`, `opportunity_stage_history`, `customers`, `contacts`, `contracts`, `follow_up_tasks`, `email_delivery_logs`, `campaigns`, `acquisition_costs`, `referrals`, `revenue_records`, `exchange_rates`, `crm_sync_records`, `outbox_events`, `idempotency_keys`, `audit_logs`.
> - **Deviated:** The outbox table is `outbox_events`, not `transactional_outbox`. Assignment history is `lead_assignment_history`.
> - **Not built:** `nurture_sequences`, `sequence_enrollments`.
> - Migration `0000_initial_schema.sql` is generated by drizzle-kit and applied to the dev and test databases. No synthetic revenue records are generated; the seed inserts reference data and an optional admin only.


Implement complete Drizzle schemas for:

- users and roles
- leads
- lead_stages
- lead_stage_history
- lead_activities
- lead_assignments
- assessments and answers
- opportunities
- opportunity_stages
- opportunity_stage_history
- customers and contacts
- follow_up_tasks
- nurture_sequences
- sequence_enrollments
- email_delivery_logs
- campaigns
- acquisition_costs
- referrals
- contracts and renewals
- revenue_records
- exchange_rates
- CRM integration records
- transactional_outbox
- idempotency_keys
- audit_logs

Avoid unnecessary duplication.

Use foreign keys, constraints and proper indexes.

Create migration and seed scripts.

Do not generate synthetic production revenue records.

### 28. Standard API response format

> **As built (Built):** Success and error envelopes match the examples, with `meta.requestId`. Stack traces and SQL messages are never returned. Pagination is returned in `meta`.
> - **Deviated:** Creates return 201. The `data` for public lead submission is `{ status, reference }`.


Success:

```json
{
    "success": true,
    "data": {},
    "meta": {
        "requestId": "req-123"
    }
}
```

Error:

```json
{
    "success": false,
    "error": {
        "code": "VALIDATION_ERROR",
        "message": "Request validation failed."
    },
    "meta": {
        "requestId": "req-123"
    }
}
```

Support pagination, filtering and sorting.

Never expose stack traces to API consumers.

### 29. Environment variables

> **As built (Partial):** Validated at startup with Zod. Blank values are treated as unset. Production refuses to start without `LOG_REDACTION=true` and `LOG_PRETTY=false`, and it requires `SMTP_FROM` when `SMTP_HOST` is set.
> - **Deviated:** `PORT` defaults to 4000 as specified. `CRM_PROVIDER` accepts `none` or `hubspot` (Zoho not built). `BOOKING_PROVIDER` is a free slug; the webhook requires `BOOKING_WEBHOOK_SECRET` when it is not `none`.
> - **Added (not in the prompt):** `TRUST_PROXY`, `BODY_LIMIT_BYTES`, `SWAGGER_ENABLED`, `CORS_ORIGINS`, `RATE_LIMIT_MAX`, `RATE_LIMIT_WINDOW`, `PUBLIC_RATE_LIMIT_MAX`, `DB_POOL_MAX`, `DB_STATEMENT_TIMEOUT_MS`, `BOOKING_WEBHOOK_TOLERANCE_SECONDS`, `OUTBOX_POLL_INTERVAL_MS`, `OUTBOX_BATCH_SIZE`, `OUTBOX_LEASE_MS`, `OUTBOX_MAX_ATTEMPTS`, `SCHEDULER_INTERVAL_MS`, `SHUTDOWN_TIMEOUT_MS`, `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, and `TEST_DATABASE_URL` for tests.
> - **Not built:** `JWT_REFRESH_TTL`, `OTEL_*`, `METRICS_ENABLED`, and the three retention variables.


Extend `.env.example`:

```env
NODE_ENV=development
PORT=4000
HOST=0.0.0.0

DATABASE_URL=
REDIS_URL=

JWT_SECRET=
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL=7d

CORS_ORIGINS=

SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=

SALES_NOTIFICATION_EMAIL=

CRM_PROVIDER=none
BOOKING_URL=

DEFAULT_CURRENCY=USD
REPORTING_TIMEZONE=UTC

# Logging
LOG_LEVEL=info
LOG_FORMAT=json
LOG_PRETTY=false
LOG_REDACTION=true
LOG_SERVICE_NAME=aranax-lead-api
LOG_ENVIRONMENT=production
LOG_INCLUDE_STACK=false

# Database performance
DB_SLOW_QUERY_MS=500
DB_QUERY_LOGGING=false

# Observability
OTEL_ENABLED=false
OTEL_SERVICE_NAME=aranax-lead-api
METRICS_ENABLED=false

# Retention
APP_LOG_RETENTION_DAYS=30
ERROR_LOG_RETENTION_DAYS=90
SECURITY_LOG_RETENTION_DAYS=90
```

Do not treat retention environment variables as automatically enforced; implement retention through the deployed log collector or rotation facility and document the setup.

Validate environment variables at startup.

### 30. Testing

> **As built (Partial):** 42 unit tests and 19 integration tests pass. Covered: config validation, error mapping (including the 57P01 case), redaction, correlation ID validation, scoring, money and period arithmetic, CSV encoding and formula protection, booking signatures, password hashing, backoff; and integration tests for lead capture, idempotency replay and mismatch, honeypot, consent, ownership 404s, outbox recovery after an email outage, CRM skipped-versus-synced, analytics `insufficient_data` and conversion, CSV permissions, and webhook signatures.
> - **Not covered by tests:** Follow-up scheduling, customer and contract flows, renewal reminders, assessment endpoints, CAC and LTV (not implemented), JSON log structure, log-level filtering, request ID propagation into jobs, sensitive field redaction in captured output, slow-query logging, graceful shutdown, and the logging pipeline failure behaviour.
> - Tests were executed, not assumed. Results are as stated above.


Use Vitest with Fastify inject and PostgreSQL integration tests.

Test:

- Lead submission
- Lead duplicate handling
- Lead scoring
- Authentication
- RBAC
- Lead assignment
- Stage history
- Opportunity lifecycle
- Follow-up scheduling
- Email queuing
- Email failure recovery
- CRM synchronization
- Revenue calculations
- Currency handling
- CAC
- LTV
- CSV export permissions

Additional logging tests:

- JSON log structure
- Log-level filtering
- Request ID propagation
- Correlation propagation into jobs
- Sensitive field redaction
- Error serialization
- Expected versus unexpected errors
- Database failure logging
- Slow query logging
- Background job retry logging
- Authentication security events
- No duplicate request completion logs
- Graceful shutdown
- Logging pipeline failure behavior

Do not claim tests passed without executing them.

### 31. Production deployment

> **As built (Partial):** Scripts present: `build`, `start`, `dev`, `db:generate`, `db:migrate`, `db:seed`, `test`, `test:integration`, `typecheck`, `openapi:export`, `worker`. `ecosystem.config.cjs` defines an `aranax-api` app in cluster mode (`API_INSTANCES`, default 2) and a separate `aranax-worker` app in fork mode with one instance.
> - **Deviated:** The scheduler is not a separate optional process. It runs inside the worker and takes a PostgreSQL advisory lock, so only one instance executes scheduled tasks even if the worker is scaled.
> - **Not built:** Nginx configuration files. `docs/deployment.md` describes the Nginx front end in prose.
> - Graceful reload is configured via `kill_timeout` and `wait_ready`, but reload behaviour was not tested.


Support:

- RHEL / Ubuntu Linux
- Node.js
- PostgreSQL
- Redis when enabled
- PM2
- Nginx

Implement:

- `pnpm build`
- `pnpm start`
- `pnpm dev`
- `pnpm db:generate`
- `pnpm db:migrate`
- `pnpm db:seed`
- `pnpm test`
- `pnpm test:integration`
- `pnpm typecheck`

Create `ecosystem.config.cjs` supporting:

- API cluster mode
- Independent background worker
- Optional single scheduler
- Graceful reload
- Restart limits
- Memory thresholds
- Proper logging configuration
- Environment-specific configuration

Workers must not run in every API cluster instance.

Use a single scheduler or distributed locking.

Prevent accidental duplicate email sends and scheduled job execution.

### 32. Documentation

> **As built (Partial):** Written: `README.md`, `docs/security.md`, `docs/logging.md`, `docs/deployment.md`, `docs/testing.md`, and generated `docs/openapi.json` (45 paths).
> - **Not written:** `architecture.md`, `database-schema.md`, `api-reference.md` (use the generated OpenAPI file), `lead-workflows.md`, `crm-integration.md`, `revenue-metrics.md`, `observability.md`.


Create:

```text
docs/
├── architecture.md
├── database-schema.md
├── api-reference.md
├── lead-workflows.md
├── crm-integration.md
├── revenue-metrics.md
├── logging.md
├── observability.md
├── security.md
├── deployment.md
└── testing.md
```

`logging.md` must include:

- Logger architecture
- Log event conventions
- Severity guidelines
- Request/correlation ID propagation
- Redaction rules
- Application versus audit logging
- Error logging
- Job logging
- Log retention
- PM2 log rotation
- Loki/OpenSearch integration guidance
- Production troubleshooting examples

### 33. Implementation order

> **As built (Partial by phase):**
> - Phase 1 (cleanup and foundation): Built.
> - Phase 2 (logging and reliability): Built, except OpenTelemetry, Prometheus, and tests for logging behaviour.
> - Phase 3 (lead capture): Built.
> - Phase 4 (CRM and automation): Partial. Lead management, pipeline, opportunities, and follow-ups are built. HubSpot adapter is built. Zoho and nurture sequences are not built.
> - Phase 5 (revenue management): Partial. Customers, contracts, revenue records, referrals, campaigns, and acquisition costs are built.
> - Phase 6 (analytics): Partial. Conversion funnel, revenue overview, and CSV export are built. Pipeline forecast, CAC, LTV, and retention are not.
> - Phase 7 (hardening): Partial. Automated tests cover the main paths, OpenAPI is generated, and PM2 config exists. No performance tuning or security review has been done.


Implement in phases:

**Phase 1: Cleanup and foundation**

- Inspect existing backend
- Remove unrelated modules safely
- Configure Drizzle/PostgreSQL
- Establish authentication and RBAC
- Configure validation and API conventions

**Phase 2: Logging and reliability foundation**

- Centralized Pino logger
- Request correlation
- Error handling
- Redaction
- Security logging
- Audit logging
- Operational health checks

**Phase 3: Lead capture**

- Public lead API
- Assessment
- Discovery request
- Spam protection
- Duplicate detection
- Transactional outbox
- Acknowledgement emails

**Phase 4: CRM and automation**

- Lead management
- Pipeline
- Opportunities
- Follow-ups
- Email sequences
- CRM adapters
- Background workers

**Phase 5: Revenue management**

- Customers
- Contracts
- Actual revenue records
- Referrals
- Campaign attribution
- Acquisition costs

**Phase 6: Analytics**

- Conversion reporting
- Pipeline forecast
- Revenue analytics
- CAC/LTV
- Customer retention
- CSV export

**Phase 7: Production hardening**

- Automated tests
- Performance optimization
- Security review
- Logging verification
- OpenAPI documentation
- PM2 deployment
- Operational documentation

Complete functioning implementations and tests within each phase rather than creating empty scaffolding for all features.

### 34. Final acceptance criteria

> **As built status:**
> 1. Built (no unrelated modules existed).
> 2. Built.
> 3. Built: `pnpm build` passes.
> 4. Built: migration applied to the dev and test databases.
> 5. Partial: nurture, pipeline forecast, CAC, LTV, and retention are not built.
> 6. Built.
> 7. Partial: CRM sync and follow-ups work; follow-ups have no integration tests.
> 8. Built: verified by an integration test.
> 9. Built for pipeline, won, and actual revenue as separate fields. Weighted pipeline is not computed.
> 10. Built: all internal routes require authentication and role checks.
> 11. Built.
> 12. Built.
> 13. Built.
> 14. Partial: propagated into jobs; not tested.
> 15. Built, not tested against captured output.
> 16. Built.
> 17. Partial: slow queries and job failures are logged; not covered by tests.
> 18. Partial: security events exist but the list is shorter than specified.
> 19. Built.
> 20. Partial: documented for PM2 and collectors; retention not enforced.
> 21. Partial: 42 unit and 19 integration tests pass. Logging and follow-up coverage is missing.
> 22. Built: `docs/openapi.json` generated.
> 23. Built.
> 24. Built: no frontend code exists.


The application is complete when:

1. All unrelated application modules have been safely removed from the source tree and route registry.
2. Existing reusable infrastructure remains functional.
3. The Fastify application builds successfully.
4. PostgreSQL migrations work.
5. All business modules are implemented.
6. Lead capture works with validation and idempotency.
7. CRM and follow-up operations work.
8. Email failures cannot silently lose leads.
9. Revenue calculations distinguish pipeline, won value and actual revenue.
10. All internal APIs enforce authentication and authorization.
11. All application logs use the centralized Pino configuration.
12. Production logs are structured JSON.
13. Each request has a traceable request ID.
14. Correlation IDs propagate through background workflows.
15. Sensitive data is redacted.
16. Application errors are centrally handled.
17. Slow queries and job failures are observable.
18. Security events are recorded appropriately.
19. Audit logs remain distinct from operational logs.
20. Logging and retention are compatible with PM2 and centralized collection.
21. Unit and integration tests pass.
22. OpenAPI documentation is generated.
23. Production build succeeds.
24. No frontend code exists.

### FINAL INSTRUCTION

> **As built summary.** The backend is implemented in `/home/claude/api` with the core lead, pipeline, customer, and revenue workflows, the outbox-based reliability model, and centralized logging. The main gaps against this prompt are: nurture sequences, Zoho, pipeline forecast and CAC/LTV/retention metrics, OpenTelemetry and Prometheus, enforced log retention, refresh tokens, and test coverage for logging behaviour and follow-ups.

Inspect the repository first, then implement the complete backend using the specified architecture.

Make actual file changes, generate database migrations, register Fastify modules, implement REST endpoints, build the logging infrastructure, create tests, run validation commands, and fix issues.

Preserve useful existing components while removing unrelated application-specific functionality.

When external services cannot be activated without credentials, implement their real integration interfaces, safe adapters, tests, and configuration requirements without claiming production connectivity.

Do not use placeholder methods that return fake success.

Do not generate frontend functionality.

**Deliver a production-oriented, modular REST API backend with reliable lead workflows, CRM automation, financial reporting, centralized logging, and operational observability.**
