export type CmsLink = { label: string; href: string; openInNewTab?: boolean; style?: "default" | "primary" | "secondary" };

export type SeoContent = {
    metaTitle: string; metaDescription: string; keywords: string[]; canonicalUrl?: string;
    preventIndexing: boolean; preventFollowing: boolean; openGraphTitle?: string;
    openGraphDescription?: string; openGraphType?: "website" | "article";
    shareImageUrl?: string; twitterCard?: "summary" | "summary_large_image";
    twitterTitle?: string; twitterDescription?: string; twitterImageUrl?: string;
    structuredData?: Record<string, unknown>; answerSummary?: string;
    questions: Array<{ question: string; answer: string }>;
};

export type Service = { slug: string; number: string; name: string; description: string; tags: string[]; icon: "spark" | "chat" | "grid" };
export type Project = { slug: string; category: string; name: string; tagline: string; description: string; tags: string[]; challenge: string; outcome: string; contribution: string; url: string; imageUrl?: string; visual: "ema" | "docunova" | "uniecho" | "doubtace" | "gloziia" | "glamsync" };
export type TeamMember = { initials: string; name: string; role: string; avatar: "av1" | "av2" | "av3" | "av4"; url: string; photoUrl?: string };

export type LandingPageContent = {
    site: { siteName: string; siteUrl: string; logoUrl: string; logoAlternativeText: string; faviconUrl?: string; defaultShareImageUrl?: string; twitterHandle?: string; navigation: CmsLink[]; expertiseTicker: string[]; footerText: string };
    seo: SeoContent;
    hero: { eyebrow: string; heading: string; description: string; primaryCta: CmsLink; secondaryCta: CmsLink; trustItems: string[] };
    servicesSection: { eyebrow: string; heading: string; description: string; services: Service[] };
    whyAranaxSection: { eyebrow: string; heading: string; description: string; listHeading: string; considerations: string[]; outcome: string };
    caseStudiesSection: { eyebrow: string; heading: string; description: string; caseStudies: Project[] };
    aboutSection: { eyebrow: string; heading: string; description: string; teamHeading: string; statistics: Array<{ value: number; suffix: string; label: string }>; teamMembers: TeamMember[] };
    aboutPage?: { pageContent: { eyebrow: string; title: string; workTitle: string; workDescription: string; teamTitle: string; profileLabel: string }; seo: SeoContent };
    contactSection: { eyebrow: string; heading: string; description: string; email: string; location: string };
    buyerSegments?: { eyebrow: string; heading: string; items: Array<{ title: string; challenge: string; service: string; deliverable: string; cta: string; href: string }> };
    processSection?: { eyebrow: string; heading: string; steps: Array<{ number: string; title: string; description: string }> };
    faqSection?: { eyebrow: string; heading: string; items: Array<{ question: string; answer: string }> };
    finalCta?: { eyebrow: string; heading: string; description: string; cta: CmsLink };
};
