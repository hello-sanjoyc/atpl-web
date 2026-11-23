UPDATE "leads"
SET "service_interest" = CASE "service_interest"
  WHEN 'ai_saas' THEN 'ai_saas_development'
  WHEN 'rag_ai' THEN 'rag_ai_chatbot_development'
  WHEN 'white_label_agency' THEN 'white_label_development_agencies'
  WHEN 'web_development' THEN 'website_design_cms_development'
  WHEN 'mobile_development' THEN 'mobile_app_development'
  WHEN 'custom_software' THEN 'custom_software_development'
  ELSE "service_interest"
END
WHERE "service_interest" IN ('ai_saas', 'rag_ai', 'white_label_agency', 'web_development', 'mobile_development', 'custom_software');

UPDATE "opportunities"
SET "service_interest" = CASE "service_interest"
  WHEN 'ai_saas' THEN 'ai_saas_development'
  WHEN 'rag_ai' THEN 'rag_ai_chatbot_development'
  WHEN 'white_label_agency' THEN 'white_label_development_agencies'
  WHEN 'web_development' THEN 'website_design_cms_development'
  WHEN 'mobile_development' THEN 'mobile_app_development'
  WHEN 'custom_software' THEN 'custom_software_development'
  ELSE "service_interest"
END
WHERE "service_interest" IN ('ai_saas', 'rag_ai', 'white_label_agency', 'web_development', 'mobile_development', 'custom_software');

UPDATE "option_items"
SET "value" = CASE "value"
  WHEN 'ai_saas' THEN 'ai_saas_development'
  WHEN 'rag_ai' THEN 'rag_ai_chatbot_development'
  WHEN 'white_label_agency' THEN 'white_label_development_agencies'
  WHEN 'web_development' THEN 'website_design_cms_development'
  WHEN 'mobile_development' THEN 'mobile_app_development'
  WHEN 'custom_software' THEN 'custom_software_development'
  ELSE "value"
END,
"label" = CASE "value"
  WHEN 'ai_saas' THEN 'AI SaaS Development'
  WHEN 'rag_ai' THEN 'RAG & AI Chatbot Development'
  WHEN 'white_label_agency' THEN 'White-Label Development for Agencies'
  WHEN 'web_development' THEN 'Website Design & CMS Development'
  WHEN 'mobile_development' THEN 'Mobile App Development'
  WHEN 'custom_software' THEN 'Custom Software Development'
  ELSE "label"
END,
"position" = CASE "value"
  WHEN 'ai_saas' THEN 0
  WHEN 'rag_ai' THEN 1
  WHEN 'white_label_agency' THEN 8
  WHEN 'web_development' THEN 5
  WHEN 'mobile_development' THEN 6
  WHEN 'custom_software' THEN 4
  ELSE "position"
END
WHERE "category" = 'service_interest';

INSERT INTO "option_items" ("category", "value", "label", "position") VALUES
  ('service_interest', 'ai_agents_voice_automation', 'AI Agents, Voice AI & Automation', 2),
  ('service_interest', 'mvp_development_startups', 'MVP Development for Startups', 3),
  ('service_interest', 'offshore_software_development', 'Offshore Software Development', 7)
ON CONFLICT ("category", "value") DO UPDATE
SET "label" = EXCLUDED."label", "position" = EXCLUDED."position", "is_active" = true;
