-- Phase 5: DB-backed LLM provider configuration
CREATE TABLE IF NOT EXISTS "llm_provider_configs" (
  "id"                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "label"             text NOT NULL,
  "provider"          text NOT NULL,
  "model"             text NOT NULL,
  "api_key_encrypted" text NOT NULL DEFAULT '',
  "base_url"          text,
  "max_tokens"        integer NOT NULL DEFAULT 2048,
  "is_active"         boolean NOT NULL DEFAULT false,
  "created_by"        uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "updated_by"        uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "created_at"        timestamptz NOT NULL DEFAULT now(),
  "updated_at"        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "llm_provider_configs_active_idx" ON "llm_provider_configs"("is_active");
