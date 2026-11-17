# Security

- **Authentication:** JWT (HS256, issuer `aranax-lead-api`). The token carries only the subject. Role and active
  status are re-read on every request, so deactivation takes effect immediately. Refresh tokens are deferred.
- **Passwords:** Node `crypto.scrypt` with a per-password salt, stored as `scrypt$N$r$p$salt$hash`. A dummy hash
  is verified for unknown users to equalise timing. Five failures lock the account for 15 minutes.
- **Authorization:** role-to-permission map in `src/config/constants.ts`. Executives without `pipeline.view_all`
  see only records they own, and records outside that scope return 404, not 403, so their existence is not leaked.
- **PII:** masked emails in logs and for roles without `leads.pii`. Log redaction is applied by Pino path and by a
  deep sanitiser. The production config refuses to start with redaction disabled.
- **Public intake:** honeypot field, URL-count limit, consent required, rate limit, and `Idempotency-Key` support.
- **Webhooks:** HMAC-SHA256 over `timestamp.rawBody` with a replay window. The body is parsed only after the signature passes.
- **Exports:** CSV cells beginning with `=`, `+`, `-`, `@` are prefixed with an apostrophe. Exports are audited.
- **Money:** `NUMERIC(14,2)` in the database, decimal strings on the wire, decimal.js arithmetic. Missing
  exchange rates produce `insufficient_data`; rates are never invented.
- **Errors:** raw SQL and stacks never reach clients. Database errors map to stable codes.
- **Secrets:** configuration is validated at startup; `.env` is local only and never committed.
