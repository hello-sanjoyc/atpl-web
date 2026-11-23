INSERT INTO "option_items" ("category", "value", "label", "position") VALUES
	('campaign_channel', 'email', 'Email', 0),
	('campaign_channel', 'google_ads', 'Google Ads', 1),
	('campaign_channel', 'linkedin_ads', 'LinkedIn Ads', 2),
	('campaign_channel', 'facebook_ads', 'Facebook Ads', 3),
	('campaign_channel', 'content_marketing', 'Content Marketing', 4),
	('campaign_channel', 'webinar', 'Webinar', 5),
	('campaign_channel', 'events', 'Events', 6),
	('campaign_channel', 'partnership', 'Partnership', 7),
	('campaign_channel', 'organic_social', 'Organic Social', 8),
	('campaign_channel', 'other', 'Other', 9)
ON CONFLICT ("category", "value") DO NOTHING;
