-- =========================================================================
-- CRM transactional data cleanup
-- =========================================================================
-- Purpose: reset the CRM database to a "fresh install" state before go-live
-- or demo teardown, while preserving:
--   - Master/reference data: countries, option_items, lead_stages,
--     opportunity_stages, assessments (templates, not submissions)
--   - Settings/config: app_settings, role_meta, role_permissions,
--     llm_provider_configs
--   - Exactly one login: the super_admin user with the email below
--
-- Everything else — leads, opportunities, customers, campaigns, referrals,
-- contracts, follow-ups, revenue records, AI-generated content, audit/
-- security logs, outbox/job-queue entries, idempotency records, and every
-- non-super-admin user account — is permanently deleted.
--
-- THIS IS DESTRUCTIVE AND IRREVERSIBLE. Take a full database backup/
-- snapshot before running this. Review SUPER_ADMIN_EMAIL below before
-- executing.
-- =========================================================================

\set SUPER_ADMIN_EMAIL '''sany.chowdhury@gmail.com'''

BEGIN;

-- Fail loudly (and roll back) if the super admin account doesn't exist,
-- so a typo'd email can never result in zero surviving logins.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM users
        WHERE email = :SUPER_ADMIN_EMAIL
          AND role = 'super_admin'
    ) THEN
        RAISE EXCEPTION
            'Super admin email % not found with role = super_admin. Aborting cleanup.',
            :SUPER_ADMIN_EMAIL;
    END IF;
END $$;

-- -------------------------------------------------------------------------
-- 1. Logs / audit / AI query trails (no dependents)
-- -------------------------------------------------------------------------
TRUNCATE TABLE
    ai_query_audit_logs,
    security_events,
    audit_logs
RESTART IDENTITY;

-- -------------------------------------------------------------------------
-- 2. AI-generated content tied to leads/opportunities, and per-rep AI data
-- -------------------------------------------------------------------------
TRUNCATE TABLE
    conversations,
    proposal_versions,
    forecast_snapshots,
    rep_skills
RESTART IDENTITY;

-- -------------------------------------------------------------------------
-- 3. Assessment submissions (the assessment templates themselves are kept)
-- -------------------------------------------------------------------------
TRUNCATE TABLE assessment_submissions RESTART IDENTITY;

-- -------------------------------------------------------------------------
-- 4. Background jobs / sync / delivery / idempotency (independent tables)
-- -------------------------------------------------------------------------
TRUNCATE TABLE
    crm_sync_records,
    email_delivery_logs,
    outbox_events,
    idempotency_keys
RESTART IDENTITY;

-- -------------------------------------------------------------------------
-- 5. Follow-ups (children of leads/opportunities/customers/users)
-- -------------------------------------------------------------------------
TRUNCATE TABLE follow_up_tasks RESTART IDENTITY;

-- -------------------------------------------------------------------------
-- 6. Finance / revenue (children of customers/opportunities/contracts)
-- -------------------------------------------------------------------------
TRUNCATE TABLE revenue_records RESTART IDENTITY;
TRUNCATE TABLE exchange_rates RESTART IDENTITY;

-- -------------------------------------------------------------------------
-- 7. Contracts (children of customers/opportunities)
-- -------------------------------------------------------------------------
TRUNCATE TABLE contracts RESTART IDENTITY;

-- -------------------------------------------------------------------------
-- 8. Opportunity history, then opportunities, then contacts/customers
-- -------------------------------------------------------------------------
TRUNCATE TABLE opportunity_stage_history RESTART IDENTITY;
TRUNCATE TABLE opportunities RESTART IDENTITY;
TRUNCATE TABLE contacts RESTART IDENTITY;
TRUNCATE TABLE customers RESTART IDENTITY;

-- -------------------------------------------------------------------------
-- 9. Marketing (acquisition costs before campaigns)
-- -------------------------------------------------------------------------
TRUNCATE TABLE acquisition_costs RESTART IDENTITY;

-- -------------------------------------------------------------------------
-- 10. Lead history/activity, then leads themselves
-- -------------------------------------------------------------------------
TRUNCATE TABLE
    lead_stage_history,
    lead_assignment_history,
    lead_activities
RESTART IDENTITY;
TRUNCATE TABLE leads RESTART IDENTITY;

-- -------------------------------------------------------------------------
-- 11. Campaigns and referrals (now that nothing references them)
-- -------------------------------------------------------------------------
TRUNCATE TABLE campaigns RESTART IDENTITY;
TRUNCATE TABLE referrals RESTART IDENTITY;

-- -------------------------------------------------------------------------
-- 12. Users — delete every account except the one super admin.
--     Safe now: every table that RESTRICTed on users.id (follow_up_tasks)
--     has already been truncated; all remaining FKs from kept config
--     tables (app_settings, role_meta, role_permissions,
--     llm_provider_configs) are ON DELETE SET NULL, so they survive with
--     their updated_by/created_by columns nulled out for removed users.
-- -------------------------------------------------------------------------
DELETE FROM users
WHERE email <> :SUPER_ADMIN_EMAIL;

-- -------------------------------------------------------------------------
-- Sanity check: exactly one user should remain.
-- -------------------------------------------------------------------------
DO $$
DECLARE
    remaining_count integer;
BEGIN
    SELECT count(*) INTO remaining_count FROM users;
    IF remaining_count <> 1 THEN
        RAISE EXCEPTION
            'Expected exactly 1 user to remain, found %. Rolling back.',
            remaining_count;
    END IF;
END $$;

COMMIT;

-- -------------------------------------------------------------------------
-- Preserved master/settings data (verify after running):
--   countries, option_items, lead_stages, opportunity_stages, assessments,
--   app_settings, role_meta, role_permissions, llm_provider_configs,
--   and the single super_admin user row.
-- -------------------------------------------------------------------------
