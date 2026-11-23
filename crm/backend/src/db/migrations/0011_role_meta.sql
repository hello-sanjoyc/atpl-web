-- Role metadata: editable label and description per role
CREATE TABLE IF NOT EXISTS role_meta (
  role        text        PRIMARY KEY,
  label       text        NOT NULL,
  description text        NOT NULL DEFAULT '',
  updated_by  uuid        REFERENCES users(id) ON DELETE SET NULL,
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Seed defaults
INSERT INTO role_meta (role, label, description) VALUES
  ('super_admin',       'Super Admin',       'Full access to all modules and system settings.'),
  ('sales_manager',     'Sales Manager',     'Manages leads, pipeline, revenue and the sales team.'),
  ('sales_executive',   'Sales Executive',   'Creates and updates leads, follow-ups and customers.'),
  ('marketing_manager', 'Marketing Manager', 'Manages campaigns, referrals and marketing analytics.'),
  ('finance',           'Finance',           'Revenue records, customers and financial analytics.'),
  ('read_only_analyst', 'Read Only Analyst', 'View-only access across pipeline and analytics.')
ON CONFLICT (role) DO NOTHING;
