INSERT INTO "option_items" ("category", "value", "label", "position") VALUES
	('currency', 'INR', 'INR', 0),
	('currency', 'USD', 'USD', 1),
	('currency', 'EUR', 'EUR', 2),
	('currency', 'GBP', 'GBP', 3),
	('currency', 'AUD', 'AUD', 4),
	('currency', 'CAD', 'CAD', 5),
	('currency', 'JPY', 'JPY', 6),
	('currency', 'CNY', 'CNY', 7)
ON CONFLICT ("category", "value") DO NOTHING;
