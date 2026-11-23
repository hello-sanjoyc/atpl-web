-- Per-provider/model request timeout override for LLM provider configs
ALTER TABLE "llm_provider_configs" ADD COLUMN IF NOT EXISTS "timeout_ms" integer NOT NULL DEFAULT 30000;
