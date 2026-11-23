import type {
  LeadStageKey,
  OpportunityStageKey,
  Role,
} from '@aranax/contracts';

// These mirror the backend row shapes. Optional fields may be null in responses.

export interface LeadEnrichmentData {
  companySize?: string;
  industry?: string;
  website?: string;
  techStack?: string[];
  linkedinUrl?: string;
  verifiedAt?: string;
  source: 'clearbit' | 'hunter' | 'ai_inference';
  aiInferred?: boolean;
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  company?: string | null;
  country?: string | null;
  serviceInterest?: string | null;
  budgetRange?: string | null;
  timeline?: string | null;
  message?: string | null;
  captureChannel?: string | null;
  leadSource?: string | null;
  stage: LeadStageKey;
  priority: 'low' | 'medium' | 'high';
  qualificationStatus: 'unqualified' | 'qualified' | 'disqualified';
  score?: number | null;
  aiScore?: number | null;
  aiScoreReason?: string | null;
  aiSummary?: string | null;
  enrichmentData?: LeadEnrichmentData | null;
  duplicateGroupId?: string | null;
  ownerId?: string | null;
  campaignId?: string | null;
  referralId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LeadActivity {
  id: string;
  type: string;
  body: string;
  createdAt: string;
  actorId?: string | null;
}

export interface Opportunity {
  id: string;
  title: string;
  stage: OpportunityStageKey;
  status: 'open' | 'won' | 'lost';
  opportunityType: string;
  estimatedValue: string;
  currency: string;
  expectedCloseDate?: string | null;
  serviceInterest?: string | null;
  ownerId?: string | null;
  leadId?: string | null;
  customerId?: string | null;
  /** Only present on the single-opportunity detail response, not the list. */
  leadName?: string | null;
  /** Only present on the single-opportunity detail response, not the list. */
  customerName?: string | null;
  country?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FollowUp {
  id: string;
  title: string;
  notes?: string | null;
  status: 'open' | 'completed' | 'cancelled';
  dueAt: string;
  ownerId?: string | null;
  leadId?: string | null;
  opportunityId?: string | null;
  customerId?: string | null;
  leadName?: string | null;
  opportunityTitle?: string | null;
  customerName?: string | null;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  company?: string | null;
  email: string;
  phone?: string | null;
  status: 'active' | 'churned';
  country?: string | null;
  sourceLeadId?: string | null;
  referralId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Contact {
  id: string;
  customerId: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  role?: string | null;
  isPrimary: boolean;
  createdAt: string;
}

export interface CustomerDetailResponse {
  customer: Customer;
  contacts: Contact[];
  contracts: Contract[];
  opportunities: Opportunity[];
  referral: { id: string; code: string; referrerName: string } | null;
}

export interface Contract {
  id: string;
  name: string;
  kind: string;
  value: string;
  currency: string;
  customerId: string;
  opportunityId?: string | null;
  startsOn?: string | null;
  renewsOn?: string | null;
  status: 'active' | 'ended';
  createdAt: string;
}

export interface RevenueRecord {
  id: string;
  kind: 'invoiced' | 'collected';
  amount: string;
  currency: string;
  recognizedOn: string;
  customerId?: string | null;
  customerName?: string | null;
  opportunityId?: string | null;
  contractId?: string | null;
  createdAt: string;
}

export interface ExchangeRate {
  id: string;
  base: string;
  quote: string;
  rate: string;
  rateDate: string;
  source: string;
}

export interface Campaign {
  id: string;
  name: string;
  slug: string;
  channel: string;
  status: 'active' | 'paused' | 'ended';
  startsOn?: string | null;
  endsOn?: string | null;
  createdAt: string;
}

export interface Referral {
  id: string;
  code: string;
  referrerName: string;
  referrerEmail?: string | null;
  createdAt: string;
}

export interface ReferralDetailResponse {
  referral: Referral;
  leads: Lead[];
  customers: Customer[];
}

export interface UserRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: Role;
  isActive: boolean;
  createdAt: string;
}
