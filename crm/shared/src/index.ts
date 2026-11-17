export const ROLES = [
    "super_admin",
    "sales_manager",
    "sales_executive",
    "marketing_manager",
    "finance",
    "read_only_analyst",
] as const;
export type Role = (typeof ROLES)[number];

export const PERMISSIONS = [
    "leads.read",
    "leads.create",
    "leads.update",
    "leads.assign",
    "leads.delete",
    "leads.export",
    "leads.pii",
    "pipeline.view_all",
    "opportunities.read",
    "opportunities.create",
    "opportunities.update",
    "opportunities.close",
    "follow_ups.manage",
    "customers.read",
    "customers.manage",
    "campaigns.manage",
    "referrals.manage",
    "revenue.read",
    "revenue.manage",
    "revenue.export",
    "analytics.read",
    "analytics.financial",
    "users.manage",
] as const;
export type Permission = (typeof PERMISSIONS)[number];

const SALES_ROLES_ALL = PERMISSIONS;

export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
    super_admin: SALES_ROLES_ALL,
    sales_manager: [
        "leads.read",
        "leads.create",
        "leads.update",
        "leads.assign",
        "leads.delete",
        "leads.export",
        "leads.pii",
        "pipeline.view_all",
        "opportunities.read",
        "opportunities.create",
        "opportunities.update",
        "opportunities.close",
        "follow_ups.manage",
        "customers.read",
        "customers.manage",
        "referrals.manage",
        "revenue.read",
        "analytics.read",
        "analytics.financial",
    ],
    sales_executive: [
        "leads.read",
        "leads.create",
        "leads.update",
        "leads.pii",
        "opportunities.read",
        "opportunities.create",
        "opportunities.update",
        "follow_ups.manage",
        "customers.read",
    ],
    marketing_manager: [
        "leads.read",
        "pipeline.view_all",
        "campaigns.manage",
        "referrals.manage",
        "analytics.read",
        "analytics.financial",
    ],
    finance: [
        "revenue.read",
        "revenue.manage",
        "revenue.export",
        "analytics.read",
        "analytics.financial",
        "customers.read",
        "opportunities.read",
        "pipeline.view_all",
    ],
    read_only_analyst: [
        "leads.read",
        "pipeline.view_all",
        "opportunities.read",
        "customers.read",
        "revenue.read",
        "analytics.read",
    ],
};

export const OWNER_ROLES = [
    "super_admin",
    "sales_manager",
    "sales_executive",
] as const;

export const LEAD_STAGES = [
    { key: "new_lead", name: "New Lead", position: 1, terminal: false },
    { key: "contacted", name: "Contacted", position: 2, terminal: false },
    { key: "qualified", name: "Qualified", position: 3, terminal: false },
    {
        key: "discovery_scheduled",
        name: "Discovery Scheduled",
        position: 4,
        terminal: false,
    },
    {
        key: "discovery_completed",
        name: "Discovery Completed",
        position: 5,
        terminal: false,
    },
    {
        key: "proposal_sent",
        name: "Proposal Sent",
        position: 6,
        terminal: false,
    },
    { key: "negotiation", name: "Negotiation", position: 7, terminal: false },
    { key: "won", name: "Won", position: 8, terminal: true },
    { key: "lost", name: "Lost", position: 9, terminal: true },
    { key: "nurturing", name: "Nurturing", position: 10, terminal: false },
] as const;
export type LeadStageKey = (typeof LEAD_STAGES)[number]["key"];

export const OPPORTUNITY_STAGES = [
    {
        key: "discovery",
        name: "Discovery",
        position: 1,
        probability: "0.2000",
        terminal: false,
    },
    {
        key: "proposal_sent",
        name: "Proposal Sent",
        position: 2,
        probability: "0.4000",
        terminal: false,
    },
    {
        key: "negotiation",
        name: "Negotiation",
        position: 3,
        probability: "0.7000",
        terminal: false,
    },
    {
        key: "won",
        name: "Won",
        position: 4,
        probability: "1.0000",
        terminal: true,
    },
    {
        key: "lost",
        name: "Lost",
        position: 5,
        probability: "0.0000",
        terminal: true,
    },
] as const;
export type OpportunityStageKey = (typeof OPPORTUNITY_STAGES)[number]["key"];

export const LOST_REASONS = [
    "price",
    "timing",
    "competitor",
    "no_budget",
    "no_response",
    "scope_mismatch",
    "other",
] as const;
export const SERVICE_INTERESTS = [
    "ai_saas",
    "rag_ai",
    "white_label_agency",
    "web_development",
    "mobile_development",
    "custom_software",
] as const;
export type ServiceInterest = (typeof SERVICE_INTERESTS)[number];
export const SERVICE_INTEREST_LABELS: Record<ServiceInterest, string> = {
    ai_saas: "AI SaaS",
    rag_ai: "RAG AI",
    white_label_agency: "White Label Agency",
    web_development: "Web Development",
    mobile_development: "Mobile Development",
    custom_software: "Custom Software",
};
/** Ready-made {value,label} options for Service interest selects. */
export const SERVICE_INTEREST_OPTIONS = SERVICE_INTERESTS.map((v) => ({
    value: v,
    label: SERVICE_INTEREST_LABELS[v],
}));
export const BUDGET_RANGES = [
    "unknown",
    "under_5k",
    "5k_20k",
    "20k_50k",
    "over_50k",
] as const;
export type BudgetRange = (typeof BUDGET_RANGES)[number];
export const BUDGET_RANGE_LABELS: Record<BudgetRange, string> = {
    unknown: "Unknown",
    under_5k: "Under 5k",
    "5k_20k": "5k - 20k",
    "20k_50k": "20k - 50k",
    over_50k: "Over 50k",
};
/** Ready-made {value,label} options for Budget range selects. */
export const BUDGET_RANGE_OPTIONS = BUDGET_RANGES.map((v) => ({
    value: v,
    label: BUDGET_RANGE_LABELS[v],
}));
export const TIMELINES = [
    "exploring",
    "three_to_six_months",
    "one_to_three_months",
    "immediate",
] as const;
export type Timeline = (typeof TIMELINES)[number];
export const TIMELINE_LABELS: Record<Timeline, string> = {
    exploring: "Exploring",
    three_to_six_months: "3 - 6 months",
    one_to_three_months: "1 - 3 months",
    immediate: "Immediate",
};
export const OPPORTUNITY_TYPES = [
    "new_business",
    "cross_sell",
    "upgrade",
    "renewal",
] as const;
export type OpportunityType = (typeof OPPORTUNITY_TYPES)[number];
export const OPPORTUNITY_TYPE_LABELS: Record<OpportunityType, string> = {
    new_business: "New Business",
    cross_sell: "Cross-sell",
    upgrade: "Upgrade",
    renewal: "Renewal",
};
export const CONTRACT_KINDS = [
    "subscription",
    "maintenance",
    "support",
] as const;
export type ContractKind = (typeof CONTRACT_KINDS)[number];
export const CONTRACT_KIND_LABELS: Record<ContractKind, string> = {
    subscription: "Subscription",
    maintenance: "Maintenance",
    support: "Support",
};
export const LEAD_PRIORITIES = ["low", "medium", "high"] as const;
export const LEAD_QUALIFICATION = [
    "unqualified",
    "qualified",
    "disqualified",
] as const;

/** Channel through which the lead was captured. */
export const CAPTURE_CHANNELS = [
    "contact_form",
    "email",
    "live_chat",
    "phone",
    "whatsapp",
    "social_dm",
    "other",
] as const;
export type CaptureChannel = (typeof CAPTURE_CHANNELS)[number];
export const CAPTURE_CHANNEL_LABELS: Record<CaptureChannel, string> = {
    contact_form: "Contact Form",
    email: "Email",
    live_chat: "Live Chat",
    phone: "Phone",
    whatsapp: "WhatsApp",
    social_dm: "Social DM",
    other: "Other",
};

/** Origin that the lead came from. */
export const LEAD_SOURCES = [
    "website",
    "google_ads",
    "linkedin",
    "referral",
    "email",
    "upwork",
    "other",
] as const;
export type LeadSource = (typeof LEAD_SOURCES)[number];
export const LEAD_SOURCE_LABELS: Record<LeadSource, string> = {
    website: "Website",
    google_ads: "Google Ads",
    linkedin: "LinkedIn",
    referral: "Referral",
    email: "Email",
    upwork: "Upwork",
    other: "Other",
};
export const ACTIVITY_TYPES = [
    "note",
    "call",
    "email",
    "meeting",
    "system",
    "duplicate_submission",
] as const;

/** Currencies offered in the Currency dropdowns. First entry is the default. */
export const CURRENCIES = ["INR", "USD", "EUR", "GBP", "AUD", "CAD", "JPY", "CNY"] as const;
export type Currency = (typeof CURRENCIES)[number];
export const DEFAULT_CURRENCY: Currency = "INR";
/** Ready-made {value,label} options for Currency selects. */
export const CURRENCY_OPTIONS = CURRENCIES.map((c) => ({ value: c, label: c }));

export const QUALIFICATION_THRESHOLD = 60;
export const EXPORT_ROW_LIMIT = 10_000;

/**
 * Dropdown fields whose options are managed in the database (table `option_items`) rather than in
 * code. The public GET /options endpoint returns these groups, and the backend validates incoming
 * values against the DB rows for the same category — so options can be added/edited from the data
 * without a source change. Logic-bound enums (stages, priority, roles, statuses) are not here.
 */
export const OPTION_CATEGORIES = [
    "service_interest",
    "budget_range",
    "timeline",
    "capture_channel",
    "lead_source",
    "opportunity_type",
    "contract_kind",
    "currency",
] as const;
export type OptionCategory = (typeof OPTION_CATEGORIES)[number];

export interface OptionItemSeed {
    value: string;
    label: string;
}

/** The option set each category ships with; a migration seeds `option_items` from this. */
export const DEFAULT_OPTION_ITEMS: Record<OptionCategory, readonly OptionItemSeed[]> = {
    service_interest: SERVICE_INTERESTS.map((v) => ({ value: v, label: SERVICE_INTEREST_LABELS[v] })),
    budget_range: BUDGET_RANGES.map((v) => ({ value: v, label: BUDGET_RANGE_LABELS[v] })),
    timeline: TIMELINES.map((v) => ({ value: v, label: TIMELINE_LABELS[v] })),
    capture_channel: CAPTURE_CHANNELS.map((v) => ({ value: v, label: CAPTURE_CHANNEL_LABELS[v] })),
    lead_source: LEAD_SOURCES.map((v) => ({ value: v, label: LEAD_SOURCE_LABELS[v] })),
    opportunity_type: OPPORTUNITY_TYPES.map((v) => ({ value: v, label: OPPORTUNITY_TYPE_LABELS[v] })),
    contract_kind: CONTRACT_KINDS.map((v) => ({ value: v, label: CONTRACT_KIND_LABELS[v] })),
    currency: CURRENCIES.map((v) => ({ value: v, label: v })),
};
