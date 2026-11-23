-- Generic single-row-per-key app settings (e.g. AI revenue forecast refresh cooldown), editable by
-- super_admin from Settings → General. Values are stored as JSON so one table covers any future
-- scalar config without a migration per setting.
CREATE TABLE IF NOT EXISTS "app_settings" (
  "key"        text PRIMARY KEY,
  "value"      jsonb NOT NULL,
  "updated_by" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
