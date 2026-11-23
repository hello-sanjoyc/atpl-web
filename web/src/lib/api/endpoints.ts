export const CMS_ENDPOINTS = {
    homePage: "/api/home-page",
    siteSettings: "/api/site-setting",
    contact: "/api/contact",
} as const;

export const CMS_CACHE_TAGS = {
    content: "cms:content",
    homePage: "cms:home-page",
    siteSettings: "cms:site-settings",
} as const;

export const CRM_ENDPOINTS = {
    publicLeads: "/api/v1/public/leads",
    options: "/api/v1/options",
    countries: "/api/v1/countries",
} as const;
