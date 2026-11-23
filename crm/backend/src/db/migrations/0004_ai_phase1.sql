-- Phase 1: AI infrastructure — schema additions

-- AI columns on leads table
ALTER TABLE "leads"
  ADD COLUMN IF NOT EXISTS "ai_score"         integer,
  ADD COLUMN IF NOT EXISTS "ai_score_reason"  text,
  ADD COLUMN IF NOT EXISTS "ai_summary"       text,
  ADD COLUMN IF NOT EXISTS "enrichment_data"  jsonb,
  ADD COLUMN IF NOT EXISTS "duplicate_group_id" uuid;

ALTER TABLE "leads"
  ADD CONSTRAINT "leads_ai_score_chk"
    CHECK ("ai_score" is null or "ai_score" between 0 and 100);

CREATE INDEX IF NOT EXISTS "leads_duplicate_group_idx"
  ON "leads" ("duplicate_group_id");

-- Conversations table
CREATE TABLE IF NOT EXISTS "conversations" (
  "id"           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "lead_id"      uuid NOT NULL REFERENCES "leads" ("id") ON DELETE CASCADE,
  "kind"         text NOT NULL DEFAULT 'transcript',
  "raw_text"     text NOT NULL,
  "summary"      text,
  "requirements" jsonb,
  "objections"   jsonb,
  "commitments"  jsonb,
  "action_items" jsonb,
  "processed_at" timestamptz,
  "actor_id"     uuid REFERENCES "users" ("id") ON DELETE SET NULL,
  "created_at"   timestamptz NOT NULL DEFAULT now(),
  "updated_at"   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "conversations_kind_chk"
    CHECK ("kind" in ('transcript', 'meeting_notes', 'email_thread'))
);

CREATE INDEX IF NOT EXISTS "conversations_lead_idx"
  ON "conversations" ("lead_id", "created_at");

-- Proposal versions table
CREATE TABLE IF NOT EXISTS "proposal_versions" (
  "id"               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "opportunity_id"   uuid NOT NULL REFERENCES "opportunities" ("id") ON DELETE CASCADE,
  "version"          integer NOT NULL DEFAULT 1,
  "sections"         jsonb NOT NULL DEFAULT '[]',
  "markdown_content" text NOT NULL,
  "generated_at"     timestamptz NOT NULL DEFAULT now(),
  "actor_id"         uuid REFERENCES "users" ("id") ON DELETE SET NULL,
  "created_at"       timestamptz NOT NULL DEFAULT now(),
  "updated_at"       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "proposal_versions_opp_idx"
  ON "proposal_versions" ("opportunity_id", "version");

-- Forecast snapshots table
CREATE TABLE IF NOT EXISTS "forecast_snapshots" (
  "id"                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "snapshot_date"           text NOT NULL,
  "band_30"                 jsonb NOT NULL,
  "band_60"                 jsonb NOT NULL,
  "band_90"                 jsonb NOT NULL,
  "open_opportunity_count"  integer NOT NULL DEFAULT 0,
  "created_at"              timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "forecast_snapshots_date_idx"
  ON "forecast_snapshots" ("snapshot_date");

-- Rep skills table
CREATE TABLE IF NOT EXISTS "rep_skills" (
  "id"               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id"          uuid NOT NULL REFERENCES "users" ("id") ON DELETE CASCADE,
  "profile"          jsonb NOT NULL DEFAULT '{}',
  "is_available"     boolean NOT NULL DEFAULT true,
  "current_lead_load" integer NOT NULL DEFAULT 0,
  "recent_win_rate"  numeric(5,4) NOT NULL DEFAULT 0,
  "last_updated_at"  timestamptz NOT NULL DEFAULT now(),
  "created_at"       timestamptz NOT NULL DEFAULT now(),
  "updated_at"       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "rep_skills_user_idx"
  ON "rep_skills" ("user_id");

-- AI query audit log table
CREATE TABLE IF NOT EXISTS "ai_query_audit_logs" (
  "id"          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "actor_id"    uuid REFERENCES "users" ("id") ON DELETE SET NULL,
  "query_kind"  text NOT NULL,
  "prompt"      text NOT NULL,
  "tokens_used" integer,
  "model_id"    text,
  "duration_ms" integer,
  "error_code"  text,
  "created_at"  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "ai_query_audit_logs_actor_idx"
  ON "ai_query_audit_logs" ("actor_id", "created_at");

CREATE INDEX IF NOT EXISTS "ai_query_audit_logs_kind_idx"
  ON "ai_query_audit_logs" ("query_kind", "created_at");
