# Logging

Pino writes one JSON object per line to stdout. Every request emits exactly one `http.request_completed` line from
the `onResponse` hook; Fastify's own request logging is disabled to avoid duplicates. Errors are logged once at the
error-handler boundary.

Each line carries `requestId` and `correlationId` (propagated from validated `X-Request-ID` and `X-Correlation-ID`
headers, or generated), plus `userId` once authenticated. Background jobs carry a `jobId` and their own
correlation ID, taken from the originating request when the event was enqueued.

Event names are stable strings such as `lead.assigned`, `job.dead_lettered` and `export.leads_csv`. Security events
are throttled to one per event name per minute.

## Operations

- **PM2 rotation:** install `pm2-logrotate` (`pm2 install pm2-logrotate`) and set `max_size` and `retain`.
- **Shipping:** collect stdout with your agent of choice (Vector, Fluent Bit or Promtail) into Loki or OpenSearch.
  Query on `event`, `requestId` and `correlationId`.
- **Troubleshooting:** search by `correlationId` to see the whole request and any jobs it enqueued.
  `job.retry_scheduled` lines show the error code and backoff; `job.dead_lettered` marks exhausted events.
