CREATE TABLE "assessment_submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"assessment_id" uuid NOT NULL,
	"lead_id" uuid NOT NULL,
	"score" integer NOT NULL,
	"band" text NOT NULL,
	"answers" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assessments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"questions" jsonb NOT NULL,
	"bands" jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "assessments_version_chk" CHECK ("assessments"."version" >= 1)
);
--> statement-breakpoint
CREATE TABLE "exchange_rates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"base" char(3) NOT NULL,
	"quote" char(3) NOT NULL,
	"rate" numeric(18, 8) NOT NULL,
	"rate_date" date NOT NULL,
	"source" text NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "exchange_rates_positive_chk" CHECK ("exchange_rates"."rate" > 0)
);
--> statement-breakpoint
CREATE TABLE "revenue_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid,
	"opportunity_id" uuid,
	"contract_id" uuid,
	"kind" text NOT NULL,
	"amount" numeric(14, 2) NOT NULL,
	"currency" char(3) NOT NULL,
	"recognized_on" date NOT NULL,
	"reference" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "revenue_records_kind_chk" CHECK ("revenue_records"."kind" in ('invoiced', 'collected')),
	CONSTRAINT "revenue_records_amount_chk" CHECK ("revenue_records"."amount" > 0)
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"role" text NOT NULL,
	"password_hash" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"failed_login_count" integer DEFAULT 0 NOT NULL,
	"locked_until" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_role_chk" CHECK ("users"."role" in ('super_admin', 'sales_manager', 'sales_executive', 'marketing_manager', 'finance', 'read_only_analyst'))
);
--> statement-breakpoint
CREATE TABLE "lead_activities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" uuid NOT NULL,
	"type" text NOT NULL,
	"body" text,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"actor_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "lead_activities_type_chk" CHECK ("lead_activities"."type" in ('note', 'call', 'email', 'meeting', 'system', 'duplicate_submission'))
);
--> statement-breakpoint
CREATE TABLE "lead_assignment_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" uuid NOT NULL,
	"from_owner_id" uuid,
	"to_owner_id" uuid,
	"actor_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lead_stage_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" uuid NOT NULL,
	"from_stage" text,
	"to_stage" text NOT NULL,
	"actor_id" uuid,
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lead_stages" (
	"key" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"position" integer NOT NULL,
	"is_terminal" boolean DEFAULT false NOT NULL,
	CONSTRAINT "lead_stages_key_chk" CHECK ("lead_stages"."key" in ('new_lead', 'contacted', 'qualified', 'discovery_scheduled', 'discovery_completed', 'proposal_sent', 'negotiation', 'won', 'lost', 'nurturing'))
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"phone" text,
	"company" text,
	"country" char(2),
	"service_interest" text,
	"budget_range" text,
	"timeline" text,
	"message" text,
	"source" text NOT NULL,
	"form_source" text NOT NULL,
	"utm_source" text,
	"utm_medium" text,
	"utm_campaign" text,
	"utm_term" text,
	"utm_content" text,
	"campaign_id" uuid,
	"referral_id" uuid,
	"stage" text DEFAULT 'new_lead' NOT NULL,
	"priority" text DEFAULT 'medium' NOT NULL,
	"score" integer DEFAULT 0 NOT NULL,
	"qualification_status" text DEFAULT 'unqualified' NOT NULL,
	"owner_id" uuid,
	"discovery_requested" boolean DEFAULT false NOT NULL,
	"marketing_consent" boolean DEFAULT false NOT NULL,
	"marketing_consent_at" timestamp with time zone,
	"privacy_policy_version" text NOT NULL,
	"consent_recorded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"unsubscribed_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "leads_priority_chk" CHECK ("leads"."priority" in ('low', 'medium', 'high')),
	CONSTRAINT "leads_qualification_chk" CHECK ("leads"."qualification_status" in ('unqualified', 'qualified', 'disqualified')),
	CONSTRAINT "leads_score_chk" CHECK ("leads"."score" between 0 and 100)
);
--> statement-breakpoint
CREATE TABLE "acquisition_costs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid,
	"channel" text NOT NULL,
	"amount" numeric(14, 2) NOT NULL,
	"currency" char(3) NOT NULL,
	"period_start" date NOT NULL,
	"period_end" date NOT NULL,
	"source" text NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "acquisition_costs_amount_chk" CHECK ("acquisition_costs"."amount" >= 0)
);
--> statement-breakpoint
CREATE TABLE "campaigns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"channel" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"starts_on" date,
	"ends_on" date,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "campaigns_status_chk" CHECK ("campaigns"."status" in ('active', 'paused', 'ended'))
);
--> statement-breakpoint
CREATE TABLE "referrals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"referrer_name" text NOT NULL,
	"referrer_email" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"actor_id" uuid,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"correlation_id" text
);
--> statement-breakpoint
CREATE TABLE "crm_sync_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" uuid NOT NULL,
	"provider" text NOT NULL,
	"external_id" text,
	"status" text NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"last_error_code" text,
	"last_synced_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "crm_sync_status_chk" CHECK ("crm_sync_records"."status" in ('synced', 'failed', 'skipped', 'pending'))
);
--> statement-breakpoint
CREATE TABLE "email_delivery_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"outbox_event_id" uuid,
	"template" text NOT NULL,
	"provider" text NOT NULL,
	"provider_message_id" text,
	"recipient_fingerprint" text NOT NULL,
	"related_lead_id" uuid,
	"status" text NOT NULL,
	"attempt" integer DEFAULT 1 NOT NULL,
	"error_code" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "email_delivery_logs_status_chk" CHECK ("email_delivery_logs"."status" in ('queued', 'delivery_started', 'provider_accepted', 'failed'))
);
--> statement-breakpoint
CREATE TABLE "idempotency_keys" (
	"scope" text NOT NULL,
	"key" text NOT NULL,
	"request_hash" text NOT NULL,
	"status_code" integer,
	"response_body" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "outbox_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" text NOT NULL,
	"aggregate_type" text NOT NULL,
	"aggregate_id" uuid NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"max_attempts" integer DEFAULT 8 NOT NULL,
	"next_attempt_at" timestamp with time zone DEFAULT now() NOT NULL,
	"locked_until" timestamp with time zone,
	"locked_by" text,
	"last_error_code" text,
	"correlation_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone,
	CONSTRAINT "outbox_events_status_chk" CHECK ("outbox_events"."status" in ('pending', 'processing', 'failed', 'sent', 'skipped', 'dead'))
);
--> statement-breakpoint
CREATE TABLE "contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"name" text NOT NULL,
	"email" text,
	"phone" text,
	"role" text,
	"is_primary" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contracts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"opportunity_id" uuid,
	"name" text NOT NULL,
	"kind" text NOT NULL,
	"value" numeric(14, 2) NOT NULL,
	"currency" char(3) NOT NULL,
	"starts_on" date NOT NULL,
	"renews_on" date,
	"status" text DEFAULT 'active' NOT NULL,
	"renewal_reminder_sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "contracts_kind_chk" CHECK ("contracts"."kind" in ('subscription', 'maintenance', 'support')),
	CONSTRAINT "contracts_status_chk" CHECK ("contracts"."status" in ('active', 'ended'))
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"company" text,
	"email" text NOT NULL,
	"phone" text,
	"country" text,
	"status" text DEFAULT 'active' NOT NULL,
	"source_lead_id" uuid,
	"referral_id" uuid,
	"campaign_id" uuid,
	"churned_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "customers_status_chk" CHECK ("customers"."status" in ('active', 'churned'))
);
--> statement-breakpoint
CREATE TABLE "follow_up_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" uuid,
	"opportunity_id" uuid,
	"customer_id" uuid,
	"owner_id" uuid NOT NULL,
	"title" text NOT NULL,
	"due_at" timestamp with time zone NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "follow_up_tasks_status_chk" CHECK ("follow_up_tasks"."status" in ('open', 'completed', 'cancelled'))
);
--> statement-breakpoint
CREATE TABLE "opportunities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" uuid,
	"customer_id" uuid,
	"referral_id" uuid,
	"campaign_id" uuid,
	"owner_id" uuid,
	"title" text NOT NULL,
	"service_interest" text,
	"country" text,
	"opportunity_type" text DEFAULT 'new_business' NOT NULL,
	"stage" text NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"probability" numeric(5, 4) NOT NULL,
	"estimated_value" numeric(14, 2) NOT NULL,
	"currency" char(3) NOT NULL,
	"expected_close_date" date,
	"proposal_sent_at" timestamp with time zone,
	"proposal_version" integer DEFAULT 0 NOT NULL,
	"won_value" numeric(14, 2),
	"won_at" timestamp with time zone,
	"lost_at" timestamp with time zone,
	"lost_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "opportunities_status_chk" CHECK ("opportunities"."status" in ('open', 'won', 'lost')),
	CONSTRAINT "opportunities_type_chk" CHECK ("opportunities"."opportunity_type" in ('new_business', 'cross_sell', 'upgrade', 'renewal')),
	CONSTRAINT "opportunities_lost_reason_chk" CHECK ("opportunities"."lost_reason" is null or "opportunities"."lost_reason" in ('price', 'timing', 'competitor', 'no_budget', 'no_response', 'scope_mismatch', 'other')),
	CONSTRAINT "opportunities_probability_chk" CHECK ("opportunities"."probability" between 0 and 1),
	CONSTRAINT "opportunities_value_chk" CHECK ("opportunities"."estimated_value" >= 0)
);
--> statement-breakpoint
CREATE TABLE "opportunity_stage_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"opportunity_id" uuid NOT NULL,
	"from_stage" text,
	"to_stage" text NOT NULL,
	"actor_id" uuid,
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "opportunity_stages" (
	"key" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"position" integer NOT NULL,
	"default_probability" numeric(5, 4) NOT NULL,
	"is_terminal" boolean DEFAULT false NOT NULL,
	CONSTRAINT "opportunity_stages_key_chk" CHECK ("opportunity_stages"."key" in ('discovery', 'proposal_sent', 'negotiation', 'won', 'lost'))
);
--> statement-breakpoint
ALTER TABLE "assessment_submissions" ADD CONSTRAINT "assessment_submissions_assessment_id_assessments_id_fk" FOREIGN KEY ("assessment_id") REFERENCES "public"."assessments"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_submissions" ADD CONSTRAINT "assessment_submissions_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exchange_rates" ADD CONSTRAINT "exchange_rates_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "revenue_records" ADD CONSTRAINT "revenue_records_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "revenue_records" ADD CONSTRAINT "revenue_records_opportunity_id_opportunities_id_fk" FOREIGN KEY ("opportunity_id") REFERENCES "public"."opportunities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "revenue_records" ADD CONSTRAINT "revenue_records_contract_id_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."contracts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "revenue_records" ADD CONSTRAINT "revenue_records_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_activities" ADD CONSTRAINT "lead_activities_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_activities" ADD CONSTRAINT "lead_activities_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_assignment_history" ADD CONSTRAINT "lead_assignment_history_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_assignment_history" ADD CONSTRAINT "lead_assignment_history_from_owner_id_users_id_fk" FOREIGN KEY ("from_owner_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_assignment_history" ADD CONSTRAINT "lead_assignment_history_to_owner_id_users_id_fk" FOREIGN KEY ("to_owner_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_assignment_history" ADD CONSTRAINT "lead_assignment_history_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_stage_history" ADD CONSTRAINT "lead_stage_history_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_stage_history" ADD CONSTRAINT "lead_stage_history_to_stage_lead_stages_key_fk" FOREIGN KEY ("to_stage") REFERENCES "public"."lead_stages"("key") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_stage_history" ADD CONSTRAINT "lead_stage_history_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_referral_id_referrals_id_fk" FOREIGN KEY ("referral_id") REFERENCES "public"."referrals"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_stage_lead_stages_key_fk" FOREIGN KEY ("stage") REFERENCES "public"."lead_stages"("key") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "acquisition_costs" ADD CONSTRAINT "acquisition_costs_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "acquisition_costs" ADD CONSTRAINT "acquisition_costs_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_sync_records" ADD CONSTRAINT "crm_sync_records_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_delivery_logs" ADD CONSTRAINT "email_delivery_logs_related_lead_id_leads_id_fk" FOREIGN KEY ("related_lead_id") REFERENCES "public"."leads"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_opportunity_id_opportunities_id_fk" FOREIGN KEY ("opportunity_id") REFERENCES "public"."opportunities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_source_lead_id_leads_id_fk" FOREIGN KEY ("source_lead_id") REFERENCES "public"."leads"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_referral_id_referrals_id_fk" FOREIGN KEY ("referral_id") REFERENCES "public"."referrals"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "follow_up_tasks" ADD CONSTRAINT "follow_up_tasks_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "follow_up_tasks" ADD CONSTRAINT "follow_up_tasks_opportunity_id_opportunities_id_fk" FOREIGN KEY ("opportunity_id") REFERENCES "public"."opportunities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "follow_up_tasks" ADD CONSTRAINT "follow_up_tasks_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "follow_up_tasks" ADD CONSTRAINT "follow_up_tasks_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_referral_id_referrals_id_fk" FOREIGN KEY ("referral_id") REFERENCES "public"."referrals"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_stage_opportunity_stages_key_fk" FOREIGN KEY ("stage") REFERENCES "public"."opportunity_stages"("key") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opportunity_stage_history" ADD CONSTRAINT "opportunity_stage_history_opportunity_id_opportunities_id_fk" FOREIGN KEY ("opportunity_id") REFERENCES "public"."opportunities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opportunity_stage_history" ADD CONSTRAINT "opportunity_stage_history_to_stage_opportunity_stages_key_fk" FOREIGN KEY ("to_stage") REFERENCES "public"."opportunity_stages"("key") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opportunity_stage_history" ADD CONSTRAINT "opportunity_stage_history_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "assessments_slug_uq" ON "assessments" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "exchange_rates_pair_date_source_uq" ON "exchange_rates" USING btree ("base","quote","rate_date","source");--> statement-breakpoint
CREATE INDEX "exchange_rates_pair_idx" ON "exchange_rates" USING btree ("base","quote","rate_date");--> statement-breakpoint
CREATE INDEX "revenue_records_date_idx" ON "revenue_records" USING btree ("recognized_on");--> statement-breakpoint
CREATE INDEX "revenue_records_customer_idx" ON "revenue_records" USING btree ("customer_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_lower_uq" ON "users" USING btree (lower("email"));--> statement-breakpoint
CREATE INDEX "lead_activities_lead_idx" ON "lead_activities" USING btree ("lead_id","created_at");--> statement-breakpoint
CREATE INDEX "lead_assignment_history_lead_idx" ON "lead_assignment_history" USING btree ("lead_id","created_at");--> statement-breakpoint
CREATE INDEX "lead_stage_history_lead_idx" ON "lead_stage_history" USING btree ("lead_id","created_at");--> statement-breakpoint
CREATE INDEX "lead_stage_history_to_idx" ON "lead_stage_history" USING btree ("to_stage","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "leads_email_live_uq" ON "leads" USING btree ("email") WHERE "leads"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "leads_stage_idx" ON "leads" USING btree ("stage");--> statement-breakpoint
CREATE INDEX "leads_owner_idx" ON "leads" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "leads_created_idx" ON "leads" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "leads_source_idx" ON "leads" USING btree ("source");--> statement-breakpoint
CREATE INDEX "acquisition_costs_period_idx" ON "acquisition_costs" USING btree ("period_start","period_end");--> statement-breakpoint
CREATE UNIQUE INDEX "campaigns_slug_uq" ON "campaigns" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "referrals_code_uq" ON "referrals" USING btree (upper("code"));--> statement-breakpoint
CREATE INDEX "audit_logs_entity_idx" ON "audit_logs" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "audit_logs_occurred_idx" ON "audit_logs" USING btree ("occurred_at");--> statement-breakpoint
CREATE UNIQUE INDEX "crm_sync_lead_provider_uq" ON "crm_sync_records" USING btree ("lead_id","provider");--> statement-breakpoint
CREATE INDEX "email_delivery_logs_lead_idx" ON "email_delivery_logs" USING btree ("related_lead_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idempotency_keys_pk" ON "idempotency_keys" USING btree ("scope","key");--> statement-breakpoint
CREATE INDEX "outbox_events_dispatch_idx" ON "outbox_events" USING btree ("status","next_attempt_at");--> statement-breakpoint
CREATE INDEX "contracts_renewal_idx" ON "contracts" USING btree ("renews_on");--> statement-breakpoint
CREATE INDEX "customers_email_idx" ON "customers" USING btree (lower("email"));--> statement-breakpoint
CREATE INDEX "follow_up_tasks_owner_due_idx" ON "follow_up_tasks" USING btree ("owner_id","status","due_at");--> statement-breakpoint
CREATE INDEX "opportunities_stage_idx" ON "opportunities" USING btree ("stage");--> statement-breakpoint
CREATE INDEX "opportunities_owner_idx" ON "opportunities" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "opportunities_status_idx" ON "opportunities" USING btree ("status","won_at");--> statement-breakpoint
CREATE INDEX "opportunity_stage_history_opp_idx" ON "opportunity_stage_history" USING btree ("opportunity_id","created_at");