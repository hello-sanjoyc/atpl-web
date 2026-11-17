ALTER TABLE "leads" ADD COLUMN "capture_channel" text;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "lead_source" text;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_capture_channel_chk" CHECK ("leads"."capture_channel" is null or "leads"."capture_channel" in ('contact_form', 'email', 'live_chat', 'phone', 'whatsapp', 'social_dm', 'other'));--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_lead_source_chk" CHECK ("leads"."lead_source" is null or "leads"."lead_source" in ('website', 'google_ads', 'linkedin', 'referral', 'email', 'upwork', 'other'));
