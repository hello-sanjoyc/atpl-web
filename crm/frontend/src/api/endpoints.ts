// Paths are relative to apiClient.baseURL, which is VITE_API_BASE_URL + VITE_API_PREFIX
// (the /api/v1 prefix lives in .env). Do NOT prefix the version here or requests double up.

export const endpoints = {
    health: "/health",
    ready: "/ready",

    auth: {
        login: `/auth/login`,
        me: `/auth/me`,
        permissions: `/auth/permissions`,
    },

    leads: {
        list: `/leads`,
        create: `/leads`,
        byId: (id: string | number) => `/leads/${id}`,
        update: (id: string | number) => `/leads/${id}`,
        delete: (id: string | number) => `/leads/${id}`,
        stage: (id: string | number) => `/leads/${id}/stage`,
        assign: (id: string | number) => `/leads/${id}/assign`,
        qualify: (id: string | number) => `/leads/${id}/qualify`,
        activities: (id: string | number) => `/leads/${id}/activities`,
        history: (id: string | number) => `/leads/${id}/history`,
        scoreExplain: (id: string | number) => `/leads/${id}/score-explain`,
        conversations: (id: string | number) => `/leads/${id}/conversations`,
        followUpDraft: (id: string | number) => `/leads/${id}/follow-up-draft`,
        suggestAssignee: (id: string | number) => `/leads/${id}/suggest-assignee`,
    },

    repSkills: {
        byUserId: (id: string | number) => `/users/${id}/rep-skills`,
    },

    ai: {
        copilotQuery: `/copilot/query`,
    },

    opportunities: {
        list: `/opportunities`,
        create: `/opportunities`,
        byId: (id: string | number) => `/opportunities/${id}`,
        update: (id: string | number) => `/opportunities/${id}`,
        stage: (id: string | number) => `/opportunities/${id}/stage`,
        proposals: (id: string | number) => `/opportunities/${id}/proposals`,
        generateProposal: (id: string | number) => `/opportunities/${id}/proposals/generate`,
        health: (id: string | number) => `/opportunities/${id}/health`,
        history: (id: string | number) => `/opportunities/${id}/history`,
    },

    forecasts: {
        revenue: `/forecasts/revenue`,
    },

    copilot: {
        query: `/copilot/query`,
    },

    followUps: {
        list: `/follow-ups`,
        create: `/follow-ups`,
        complete: (id: string | number) => `/follow-ups/${id}/complete`,
    },

    customers: {
        list: `/customers`,
        create: `/customers`,
        byId: (id: string | number) => `/customers/${id}`,
        update: (id: string | number) => `/customers/${id}`,
        contacts: (id: string | number) => `/customers/${id}/contacts`,
        contracts: (id: string | number) => `/customers/${id}/contracts`,
        history: (id: string | number) => `/customers/${id}/history`,
        renewals: `/contracts/renewals`,
    },

    revenue: {
        records: `/revenue-records`,
        createRecord: `/revenue-records`,
        exchangeRates: `/exchange-rates`,
        createExchangeRate: `/exchange-rates`,
    },

    campaigns: {
        list: `/campaigns`,
        create: `/campaigns`,
        byId: (id: string | number) => `/campaigns/${id}`,
        update: (id: string | number) => `/campaigns/${id}`,
        acquisitionCosts: (id: string | number) =>
            `/campaigns/${id}/acquisition-costs`,
    },

    acquisitionCosts: {
        create: `/acquisition-costs`,
    },

    referrals: {
        list: `/referrals`,
        create: `/referrals`,
        byId: (id: string | number) => `/referrals/${id}`,
    },

    analytics: {
        overview: `/analytics/overview`,
        trends: `/analytics/trends`,
        attribution: `/analytics/attribution`,
    },

    events: `/events`,

    settings: {
        llm: `/settings/llm`,
        llmById: (id: string) => `/settings/llm/${id}`,
        llmActivate: (id: string) => `/settings/llm/${id}/activate`,
        llmTest: (id: string) => `/settings/llm/${id}/test`,
        roles: `/settings/roles`,
        rolesPermissions: `/settings/roles/permissions`,
        roleById: (role: string) => `/settings/roles/${role}`,
        rolePermissionsById: (role: string) => `/settings/roles/${role}/permissions`,
        rolesMeta: `/settings/roles/meta`,
        roleMetaById: (role: string) => `/settings/roles/${role}/meta`,
        optionsAdmin: `/settings/options`,
        optionByIdAdmin: (id: string) => `/settings/options/${id}`,
        securityEvents: `/settings/security-events`,
        securityConfig: `/settings/security-config`,
        auditLogs: `/settings/audit-logs`,
        auditEntityTypes: `/settings/audit-logs/entity-types`,
        forecastSettings: `/settings/forecast`,
    },

    geo: {
        countries: `/countries`,
    },

    options: `/options`,

    exports: {
        leads: `/exports/leads.csv`,
        revenue: `/exports/revenue-records.csv`,
    },

    users: {
        list: `/users`,
        create: `/users`,
        byId: (id: string | number) => `/users/${id}`,
        update: (id: string | number) => `/users/${id}`,
    },

    public: {
        chatMessage: `/public/chat/message`,
        enquiry: `/public/leads`,
        discovery: `/public/discovery-requests`,
        bookingConfig: `/public/booking-config`,
        assessment: {
            list: `/public/assessments`,
            bySlug: (slug: string) => `/public/assessments/${slug}`,
            evaluate: (slug: string) => `/public/assessments/${slug}/evaluate`,
            submit: (slug: string) => `/public/assessments/${slug}/submissions`,
        },
    },
} as const;
