export {
  ROLES,
  PERMISSIONS,
  ROLE_PERMISSIONS,
  OWNER_ROLES,
  LEAD_STAGES,
  OPPORTUNITY_STAGES,
  LOST_REASONS,
  SERVICE_INTERESTS,
  BUDGET_RANGES,
  TIMELINES,
  OPPORTUNITY_TYPES,
  CONTRACT_KINDS,
  LEAD_PRIORITIES,
  LEAD_QUALIFICATION,
  CAPTURE_CHANNELS,
  CAPTURE_CHANNEL_LABELS,
  LEAD_SOURCES,
  LEAD_SOURCE_LABELS,
  ACTIVITY_TYPES,
  OPTION_CATEGORIES,
  DEFAULT_OPTION_ITEMS,
  QUALIFICATION_THRESHOLD,
  EXPORT_ROW_LIMIT,
} from '@aranax/contracts';
export type {
  Role,
  Permission,
  LeadStageKey,
  OpportunityStageKey,
  CaptureChannel,
  LeadSource,
  OptionCategory,
} from '@aranax/contracts';

import type { OpportunityStageKey, LeadStageKey } from '@aranax/contracts';

/** Lead stage that follows an opportunity stage change, when the lead is not already closed. */
export const LEAD_STAGE_FOR_OPPORTUNITY: Partial<Record<OpportunityStageKey, LeadStageKey>> = {
  discovery: 'discovery_completed',
  proposal_sent: 'proposal_sent',
  negotiation: 'negotiation',
  won: 'won',
  lost: 'lost',
};

export const PUBLIC_SPAM_URL_LIMIT = 3;
export const IDEMPOTENCY_TTL_HOURS = 24;
export const RENEWAL_REMINDER_WINDOW_DAYS = 30;
export const LOGIN_MAX_FAILURES = 5;
export const LOGIN_LOCK_MINUTES = 15;

export const ACKNOWLEDGEMENT_TEMPLATES = {
  LEAD: 'lead_acknowledgement',
  DISCOVERY: 'discovery_acknowledgement',
  SALES: 'sales_notification',
  RENEWAL: 'renewal_reminder',
  ASSESSMENT: 'assessment_report',
} as const;

export const EVENT_TYPES = {
  EMAIL_ACK: 'email.acknowledgement',
  EMAIL_DISCOVERY: 'email.discovery_acknowledgement',
  EMAIL_SALES: 'email.sales_notification',
  EMAIL_RENEWAL: 'email.renewal_reminder',
  EMAIL_ASSESSMENT: 'email.assessment_report',
  CRM_SYNC: 'crm.sync_lead',
  AI_SCORE_LEAD: 'ai.score_lead',
  AI_ENRICH_LEAD: 'ai.enrich_lead',
  AI_DEDUP_LEAD: 'ai.dedup_lead',
  AI_DRAFT_FOLLOWUP: 'ai.draft_followup',
  AI_EXTRACT_CONVERSATION: 'ai.extract_conversation',
  AI_OPPORTUNITY_HEALTH: 'ai.opportunity_health',
  AI_GENERATE_PROPOSAL: 'ai.generate_proposal',
} as const;

export const AI_TASK_KINDS = [
  'score_lead',
  'enrich_lead',
  'dedup_lead',
  'draft_followup',
  'extract_conversation',
  'opportunity_health',
  'generate_proposal',
] as const;
export type AiTaskKind = (typeof AI_TASK_KINDS)[number];
