-- Phase 2: AI lead capture assistant, enrichment, and smart assignment

-- Override columns on lead_assignment_history (manager override tracking)
ALTER TABLE "lead_assignment_history"
  ADD COLUMN IF NOT EXISTS "is_manager_override" boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "override_note" text;
