export type StrapiResponse<T> = {
    data: T;
    meta: Record<string, unknown>;
};

export type CmsMedia = {
    documentId: string;
    url: string;
    alternativeText?: string | null;
    width?: number | null;
    height?: number | null;
};

export type CmsTextItem = {
    id: number;
    text: string;
};

export type CmsLink = {
    id: number;
    label: string;
    href: string;
    openInNewTab: boolean;
    style: "default" | "primary" | "secondary";
};

export type CmsSeo = {
    metaTitle: string;
    metaDescription: string;
    focusKeyword?: string | null;
    keywords?: CmsTextItem[];
    canonicalUrl?: string | null;
    preventIndexing?: boolean | null;
    preventFollowing?: boolean | null;
    openGraphTitle?: string | null;
    openGraphDescription?: string | null;
    openGraphType?: "website" | "article" | null;
    shareImage?: CmsMedia | null;
    twitterCard?: "summary" | "summary_large_image" | null;
    twitterTitle?: string | null;
    twitterDescription?: string | null;
    twitterImage?: CmsMedia | null;
    structuredData?: Record<string, unknown> | null;
    answerSummary?: string | null;
    questions?: Array<{ id: number; question: string; answer: string }>;
};

export type CmsService = {
    documentId: string;
    slug: string;
    name: string;
    number: string;
    description: string;
    tags?: CmsTextItem[];
    icon: "spark" | "chat" | "grid";
    sortOrder: number;
    pageContent?: Record<string, unknown> | null;
    heroImage?: CmsMedia | null;
    seo?: CmsSeo | null;
};

export type CmsCaseStudy = {
    documentId: string;
    slug: string;
    name: string;
    category: string;
    tagline: string;
    description: string;
    challenge: string;
    outcome: string;
    contribution: string;
    tags?: CmsTextItem[];
    websiteUrl: string;
    visual: "ema" | "docunova" | "uniecho" | "doubtace" | "gloziia" | "glamsync";
    coverImage?: CmsMedia | null;
    sortOrder: number;
    pageContent?: Record<string, unknown> | null;
    seo?: CmsSeo | null;
};

export type CmsTeamMember = {
    documentId: string;
    name: string;
    initials: string;
    role: string;
    profileUrl: string;
    avatarStyle: "av1" | "av2" | "av3" | "av4";
    photo?: CmsMedia | null;
    sortOrder: number;
};

export type CmsHomePage = {
    documentId: string;
    title: string;
    seo: CmsSeo;
    heroSection: {
        eyebrow: string;
        heading: string;
        description: string;
        primaryCta: CmsLink;
        secondaryCta: CmsLink;
        trustItems?: CmsTextItem[];
    } | null;
    servicesSection: {
        eyebrow: string;
        heading: string;
        description: string;
        services?: CmsService[];
    } | null;
    whyAranaxSection: {
        eyebrow: string;
        heading: string;
        description: string;
        listHeading: string;
        considerations?: CmsTextItem[];
        outcome: string;
    } | null;
    caseStudiesSection: {
        eyebrow: string;
        heading: string;
        description: string;
        caseStudies?: CmsCaseStudy[];
    } | null;
    aboutSection: {
        eyebrow: string;
        heading: string;
        description: string;
        teamHeading: string;
        statistics?: Array<{
            id: number;
            value: number;
            suffix?: string | null;
            label: string;
        }>;
        teamMembers?: CmsTeamMember[];
        pageContent?: Record<string, unknown> | null;
        seo?: CmsSeo | null;
    } | null;
    contactSection: {
        eyebrow: string;
        heading: string;
        description: string;
        email: string;
        location: string;
    } | null;
    buyerSegments?: LandingPageJson | null;
    processSection?: LandingPageJson | null;
    faqSection?: LandingPageJson | null;
    evidenceSection?: LandingPageJson | null;
    finalCta?: LandingPageJson | null;
};

export type LandingPageJson = Record<string, unknown>;

export type CmsSiteSettings = {
    documentId: string;
    siteName: string;
    siteUrl: string;
    logo?: CmsMedia | null;
    favicon?: CmsMedia | null;
    defaultShareImage?: CmsMedia | null;
    twitterHandle?: string | null;
    logoAssetPath: string;
    logoAlternativeText: string;
    navigation?: CmsLink[];
    expertiseTicker?: CmsTextItem[];
    footerText: string;
};
