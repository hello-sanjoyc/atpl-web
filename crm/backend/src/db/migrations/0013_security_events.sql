-- Persisted security/auth events (login attempts, lockouts, invalid tokens, access denials,
-- rate limiting, webhook signature failures, spam suppression, permission changes).
CREATE TABLE IF NOT EXISTS "security_events" (
  "id"          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "occurred_at" timestamptz NOT NULL DEFAULT now(),
  "event"       text NOT NULL,
  "level"       text NOT NULL DEFAULT 'warn',
  "user_id"     uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "ip"          inet,
  "user_agent"  text,
  "metadata"    jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS "security_events_occurred_idx" ON "security_events" ("occurred_at");
CREATE INDEX IF NOT EXISTS "security_events_event_idx" ON "security_events" ("event");
CREATE INDEX IF NOT EXISTS "security_events_user_idx" ON "security_events" ("user_id");
