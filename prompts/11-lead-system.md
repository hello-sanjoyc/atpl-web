# CODEX MASTER IMPLEMENTATION PROMPT

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
- Vitest
- PM2
- Nginx

**Backend only. Do not implement any frontend application, UI, dashboard components, or frontend framework.**

Implement real working code, migrations, API endpoints, automated tests, background workers, and production deployment configurations.

Do not stop at architectural descriptions or placeholder implementations.

---

### 2. Clean up the existing project

If the existing project contains modules from a different application, remove unrelated modules.

### 3. Required project structure

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

Inspect the repository first, then implement the complete backend using the specified architecture.

Make actual file changes, generate database migrations, register Fastify modules, implement REST endpoints, build the logging infrastructure, create tests, run validation commands, and fix issues.

Preserve useful existing components while removing unrelated application-specific functionality.

When external services cannot be activated without credentials, implement their real integration interfaces, safe adapters, tests, and configuration requirements without claiming production connectivity.

Do not use placeholder methods that return fake success.

Do not generate frontend functionality.

**Deliver a production-oriented, modular REST API backend with reliable lead workflows, CRM automation, financial reporting, centralized logging, and operational observability.**
