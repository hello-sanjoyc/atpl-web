# Testing

- `pnpm test` runs the unit project (`tests/unit`). It needs no database.
- `pnpm test:integration` runs `tests/integration` against `TEST_DATABASE_URL`, which must name a database containing
  `_test`. The setup applies migrations and reference data once; each test resets all tables first.
- Fakes replace SMTP and the CRM. The clock is fixed at `FIXED_NOW` in `tests/helpers/test-app.ts`.

Coverage today: configuration validation, error mapping, redaction and correlation IDs, lead scoring, money and
period arithmetic, CSV encoding, booking signatures, password hashing, backoff; and integration tests for public lead
capture and idempotency, honeypot, consent, ownership-scoped 404s, the outbox under an email outage with recovery,
CRM skipped-versus-synced, analytics `insufficient_data` and conversion, CSV permissions, and webhook signatures.

Not yet covered: follow-up tasks, customer and contract flows, the scheduler's renewal reminders, and log-structure
assertions on captured output. These are the next tests to write.
