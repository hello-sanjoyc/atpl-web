// Paths are relative to apiClient.baseURL, which is VITE_API_BASE_URL + VITE_API_PREFIX
// (the /api/v1 prefix lives in .env). Do NOT prefix the version here or requests double up.

export const endpoints = {
    health: "/health",
    ready: "/ready",

    auth: {
        login: `/auth/login`,
        me: `/auth/me`,
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
    },

    opportunities: {
        list: `/opportunities`,
        create: `/opportunities`,
        byId: (id: string | number) => `/opportunities/${id}`,
        update: (id: string | number) => `/opportunities/${id}`,
        stage: (id: string | number) => `/opportunities/${id}/stage`,
        proposals: (id: string | number) => `/opportunities/${id}/proposals`,
        history: (id: string | number) => `/opportunities/${id}/history`,
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
        update: (id: string | number) => `/users/${id}`,
    },

    public: {
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
