CREATE TABLE "option_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category" text NOT NULL,
	"value" text NOT NULL,
	"label" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "option_items_category_value_uq" ON "option_items" USING btree ("category","value");--> statement-breakpoint
INSERT INTO "option_items" ("category", "value", "label", "position") VALUES
	('service_interest', 'ai_saas', 'AI SaaS', 0),
	('service_interest', 'rag_ai', 'RAG AI', 1),
	('service_interest', 'white_label_agency', 'White Label Agency', 2),
	('service_interest', 'web_development', 'Web Development', 3),
	('service_interest', 'mobile_development', 'Mobile Development', 4),
	('service_interest', 'custom_software', 'Custom Software', 5),
	('budget_range', 'unknown', 'Unknown', 0),
	('budget_range', 'under_5k', 'Under 5k', 1),
	('budget_range', '5k_20k', '5k - 20k', 2),
	('budget_range', '20k_50k', '20k - 50k', 3),
	('budget_range', 'over_50k', 'Over 50k', 4),
	('timeline', 'exploring', 'Exploring', 0),
	('timeline', 'three_to_six_months', '3 - 6 months', 1),
	('timeline', 'one_to_three_months', '1 - 3 months', 2),
	('timeline', 'immediate', 'Immediate', 3),
	('capture_channel', 'contact_form', 'Contact Form', 0),
	('capture_channel', 'email', 'Email', 1),
	('capture_channel', 'live_chat', 'Live Chat', 2),
	('capture_channel', 'phone', 'Phone', 3),
	('capture_channel', 'whatsapp', 'WhatsApp', 4),
	('capture_channel', 'social_dm', 'Social DM', 5),
	('capture_channel', 'other', 'Other', 6),
	('lead_source', 'website', 'Website', 0),
	('lead_source', 'google_ads', 'Google Ads', 1),
	('lead_source', 'linkedin', 'LinkedIn', 2),
	('lead_source', 'referral', 'Referral', 3),
	('lead_source', 'email', 'Email', 4),
	('lead_source', 'upwork', 'Upwork', 5),
	('lead_source', 'other', 'Other', 6),
	('opportunity_type', 'new_business', 'New Business', 0),
	('opportunity_type', 'cross_sell', 'Cross-sell', 1),
	('opportunity_type', 'upgrade', 'Upgrade', 2),
	('opportunity_type', 'renewal', 'Renewal', 3),
	('contract_kind', 'subscription', 'Subscription', 0),
	('contract_kind', 'maintenance', 'Maintenance', 1),
	('contract_kind', 'support', 'Support', 2)
ON CONFLICT ("category", "value") DO NOTHING;--> statement-breakpoint
ALTER TABLE "leads" DROP CONSTRAINT IF EXISTS "leads_capture_channel_chk";--> statement-breakpoint
ALTER TABLE "leads" DROP CONSTRAINT IF EXISTS "leads_lead_source_chk";--> statement-breakpoint
ALTER TABLE "opportunities" DROP CONSTRAINT IF EXISTS "opportunities_type_chk";--> statement-breakpoint
ALTER TABLE "contracts" DROP CONSTRAINT IF EXISTS "contracts_kind_chk";
