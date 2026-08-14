export type Service = {
    number: string;
    name: string;
    description: string;
    tags: string[];
    icon: "spark" | "chat" | "grid";
    delay?: string;
};

export type Project = {
    category: string;
    name: string;
    tagline: string;
    description: string;
    tags: string[];
    challenge: string;
    outcome: string;
    contribution: string;
    url: string;
    imageUrl?: string;
    visual:
        | "ema"
        | "docunova"
        | "uniecho"
        | "doubtace"
        | "gloziia"
        | "glamsync";
};

export type TeamMember = {
    initials: string;
    name: string;
    role: string;
    avatar: "av1" | "av2" | "av3" | "av4";
    url: string;
    photoUrl?: string;
};

export type CmsLink = {
    label: string;
    href: string;
    openInNewTab?: boolean;
    style?: "default" | "primary" | "secondary";
};

export type SeoContent = {
    metaTitle: string;
    metaDescription: string;
    keywords: string[];
    canonicalUrl?: string;
    preventIndexing: boolean;
    preventFollowing: boolean;
    openGraphTitle?: string;
    openGraphDescription?: string;
    openGraphType?: "website" | "article";
    shareImageUrl?: string;
    twitterCard?: "summary" | "summary_large_image";
    twitterTitle?: string;
    twitterDescription?: string;
    twitterImageUrl?: string;
    structuredData?: Record<string, unknown>;
};

export type LandingPageContent = {
    site: {
        siteName: string;
        siteUrl: string;
        logoUrl: string;
        logoAlternativeText: string;
        faviconUrl?: string;
        defaultShareImageUrl?: string;
        twitterHandle?: string;
        navigation: CmsLink[];
        expertiseTicker: string[];
        footerText: string;
    };
    seo: SeoContent;
    hero: {
        eyebrow: string;
        heading: string;
        description: string;
        primaryCta: CmsLink;
        secondaryCta: CmsLink;
        trustItems: string[];
    };
    servicesSection: {
        eyebrow: string;
        heading: string;
        description: string;
        services: Service[];
    };
    whyAranaxSection: {
        eyebrow: string;
        heading: string;
        description: string;
        listHeading: string;
        considerations: string[];
        outcome: string;
    };
    caseStudiesSection: {
        eyebrow: string;
        heading: string;
        description: string;
        caseStudies: Project[];
    };
    aboutSection: {
        eyebrow: string;
        heading: string;
        description: string;
        teamHeading: string;
        statistics: Array<{ value: number; suffix: string; label: string }>;
        teamMembers: TeamMember[];
    };
    contactSection: {
        eyebrow: string;
        heading: string;
        description: string;
        email: string;
        location: string;
    };
};

export const services: Service[] = [
    {
        number: "01",
        name: "AI SaaS Development",
        description:
            "We design and build production-ready AI SaaS platforms with secure architecture, user roles, subscriptions, usage controls, dashboards, APIs and scalable cloud infrastructure.",
        tags: ["SaaS Architecture", "LLM Integration", "Multi-tenant"],
        icon: "spark",
    },
    {
        number: "02",
        name: "RAG & AI Assistants",
        description:
            "We build grounded AI assistants that answer from approved documents, websites and databases, provide source-based responses and escalate uncertain cases to human teams.",
        tags: ["RAG", "AI Chatbots", "Knowledge Search"],
        icon: "chat",
        delay: "d1",
    },
    {
        number: "03",
        name: "Agentic AI Automation",
        description:
            "We develop intelligent AI agents that connect with business tools, execute multi-step workflows, validate outputs and reduce repetitive manual work across operations.",
        tags: ["AI Agents", "Automation", "API Integration"],
        icon: "grid",
        delay: "d2",
    },
];

export const projects: Project[] = [
    {
        category: "AI Email Productivity",
        name: "EMA — Smarter Inbox Management",
        tagline: "From a crowded inbox to a prioritised workday",
        description:
            "An AI-powered email assistant that prioritises messages, prepares contextual replies, identifies follow-ups and turns inbox activity into an organised workflow.",
        tags: ["Agentic AI", "Email Automation", "Productivity SaaS"],
        challenge:
            "Professionals need to prioritise emails, understand requests, respond, schedule meetings and track follow-ups—work traditional inboxes largely leave to the user.",
        outcome:
            "EMA turns a passive inbox into an organised workflow, helping users move from messages to meaningful next actions.",
        contribution:
            "Product strategy, UI/UX design, AI workflow engineering, web and mobile development, backend systems, integrations and deployment.",
        url: "https://ema.aranax.tech",
        visual: "ema",
    },
    {
        category: "AI Document Intelligence",
        name: "DocuNova — Understand Contracts Faster",
        tagline: "Turning dense agreements into decision-ready information",
        description:
            "Transforms complex contracts into structured summaries, important obligations, renewal dates, potential risks and document-grounded answers.",
        tags: ["RAG", "Document AI", "B2B SaaS"],
        challenge:
            "Important obligations, deadlines and risks can be difficult to locate quickly across long, complex business documents.",
        outcome:
            "DocuNova makes contract information easier to review, discuss and act on without losing document context.",
        contribution:
            "Product design and engineering for document ingestion, retrieval workflows, structured analysis and a secure SaaS experience.",
        url: "https://docunova.app",
        visual: "docunova",
    },
    {
        category: "Conversational AI for Education",
        name: "UniEcho — AI Student Assistant",
        tagline: "One reliable assistant across the entire student journey",
        description:
            "A multilingual university assistant that answers questions about admissions, examinations, fees, results and student services.",
        tags: ["Conversational AI", "Multilingual", "Education"],
        challenge:
            "Students need clear answers across admissions, examinations, fees, results and services—often across more than one language.",
        outcome:
            "UniEcho gives students a single, accessible starting point for navigating essential university information.",
        contribution:
            "Conversational product design, multilingual knowledge experiences and scalable assistant engineering for student services.",
        url: "https://uniecho.io",
        visual: "uniecho",
    },
    {
        category: "AI-Powered Learning",
        name: "DoubtAce — Exam-Ready Doubt Resolution",
        tagline:
            "Helping students understand how an answer should be solved and presented",
        description:
            "Turns photographed questions and textbook content into board-aware, step-by-step explanations designed around examination requirements.",
        tags: ["EdTech", "OCR", "Generative AI"],
        challenge:
            "Students need help turning printed and photographed study material into explanations that reflect their examination requirements.",
        outcome:
            "DoubtAce makes complex questions more approachable with structured, step-by-step learning support.",
        contribution:
            "Learning experience design, OCR workflows and generative AI engineering for contextual explanations.",
        url: "https://doubtace.com",
        visual: "doubtace",
    },
    {
        category: "Beauty Marketplace & Operations",
        name: "Gloziia — Salon Marketplace and Management Platform",
        tagline: "Connecting customer discovery with salon operations",
        description:
            "A two-sided platform that helps customers discover and book beauty services while enabling salon partners to manage appointments, branches, employees and revenue.",
        tags: ["Marketplace", "Mobile App", "Operations SaaS"],
        challenge:
            "Beauty businesses need to serve customers while coordinating appointments, branches, employees and everyday operations.",
        outcome:
            "Gloziia connects salon discovery and booking with the operational tools partners need to run their businesses.",
        contribution:
            "Marketplace product design, mobile experiences and operational SaaS workflows for beauty service partners.",
        url: "https://gloziia.com",
        visual: "gloziia",
    },
    {
        category: "Vertical SaaS for Beauty Professionals",
        name: "GlamSync — SaaS for Independent Makeup Artists",
        tagline:
            "Giving artists one calm system for running the business behind their craft",
        description:
            "Combines appointments, client records, invoicing, reminders, portfolios, marketing and inventory in one workspace for beauty professionals.",
        tags: ["Vertical SaaS", "CRM", "Business Automation"],
        challenge:
            "Beauty professionals often manage appointments, clients, payments, marketing and inventory across disconnected tools.",
        outcome:
            "GlamSync brings the day-to-day business behind beauty services into one focused workspace.",
        contribution:
            "Vertical SaaS product design, CRM workflows and business automation engineering for independent professionals.",
        url: "https://glamsync.app",
        visual: "glamsync",
    },
];

export const team: TeamMember[] = [
    {
        initials: "SC",
        name: "Sanjoy Chowdhury",
        role: "Founder & AI SaaS Architect",
        avatar: "av1",
        url: "https://www.linkedin.com/in/sanjoyc/",
    },
    {
        initials: "KP",
        name: "Kausik Pan",
        role: "Product Manager & Web Solutions Lead",
        avatar: "av2",
        url: "https://www.linkedin.com/in/kousik-pan-395a21116/",
    },
    {
        initials: "ST",
        name: "Sabyasachi Tripathi",
        role: "Full-Stack & AI Engineer",
        avatar: "av3",
        url: "https://www.linkedin.com/in/sabyasachi-tripathy-a402381a9/",
    },
    {
        initials: "AD",
        name: "Avigyan Das",
        role: "Head of Design",
        avatar: "av4",
        url: "https://www.linkedin.com/in/avigyandas/",
    },
];

export const marqueeItems = [
    "AI Strategy",
    "Chatbot Development",
    "Custom AI Tools",
    "LLM Integration",
    "Data Intelligence",
    "Process Automation",
    "Voice AI",
    "RAG Systems",
];

export const fallbackLandingPage: LandingPageContent = {
    site: {
        siteName: "Aranax Technologies",
        siteUrl: "https://aranax.tech",
        logoUrl: "/assets/images/logo.png",
        logoAlternativeText: "Aranax Technologies",
        defaultShareImageUrl: "/assets/images/og-image.webp",
        navigation: [
            { label: "Services", href: "#services" },
            { label: "Case Studies", href: "#case-studies" },
            { label: "About", href: "#about" },
            { label: "Let's Talk", href: "#contact", style: "primary" },
        ],
        expertiseTicker: marqueeItems,
        footerText: "© 2026 Aranax Technologies. All rights reserved.",
    },
    seo: {
        metaTitle:
            "AI SaaS Development Company | RAG & Agentic AI | Aranax Technologies",
        metaDescription:
            "Aranax Technologies designs and builds scalable AI SaaS platforms, RAG applications, intelligent agents and workflow automation for startups, agencies and enterprises.",
        keywords: [
            "AI SaaS development",
            "RAG applications",
            "agentic AI",
            "AI workflow automation",
            "LLM integration",
        ],
        canonicalUrl: "https://aranax.tech/",
        preventIndexing: false,
        preventFollowing: false,
        openGraphType: "website",
        twitterCard: "summary_large_image",
    },
    hero: {
        eyebrow: "AI Development Agency",
        heading: "Build an *AI product*\nthat *works beyond* the demo.",
        description:
            "Aranax Technologies helps startups, agencies and enterprises design, build and scale secure AI SaaS platforms, RAG applications, intelligent agents and workflow automation.\n\nFrom technical feasibility and system architecture to product development, deployment and optimisation, we turn complex AI ideas into dependable software products.",
        primaryCta: {
            label: "Discuss Your AI Product",
            href: "#contact",
            style: "primary",
        },
        secondaryCta: {
            label: "View Our Case Studies",
            href: "#case-studies",
            style: "secondary",
        },
        trustItems: [
            "12+ Yrs. in Product Development",
            "Architecture-First Development",
            "AI, Web and Mobile Engineering",
            "Supporting Clients Worldwide",
        ],
    },
    servicesSection: {
        eyebrow: "What We Build",
        heading: "AI products built for\n*real-world use*",
        description:
            "From RAG applications and intelligent agents to complete AI SaaS platforms, we design secure, scalable solutions around your data, workflows and business goals.",
        services,
    },
    whyAranaxSection: {
        eyebrow: "Why Aranax",
        heading: "Architecture first.\n*AI second.*\nBusiness outcome always.",
        description:
            "Many AI prototypes look impressive during a demonstration but fail when exposed to real customers, unreliable data, high usage and security requirements.\nAranax approaches AI development as product engineering.",
        listHeading: "We consider",
        considerations: [
            "Multi-tenant architecture",
            "Data privacy and user permissions",
            "Retrieval quality and hallucination controls",
            "AI evaluation and observability",
            "Human review and escalation",
            "Token consumption and infrastructure costs",
            "API reliability and failure handling",
            "Product analytics and usage limits",
            "Security, deployment and long-term maintainability",
        ],
        outcome:
            "The result is not simply an AI feature. It is a product designed to operate reliably in production.",
    },
    caseStudiesSection: {
        eyebrow: "Selected Case Studies",
        heading: "Products engineered around *real business problems.*",
        description:
            "From AI assistants to industry-specific SaaS platforms, we help founders and businesses turn complex ideas into secure, scalable and production-ready digital products.",
        caseStudies: projects,
    },
    aboutSection: {
        eyebrow: "Our Story",
        heading: "We build *beyond* the *AI prototype*.",
        description:
            "Founded in 2015, Aranax Technologies helps startups, agencies and enterprises design, build and scale AI SaaS, RAG, web and mobile products.\n\nLed by more than 25 years of software architecture experience, our team combines strategic thinking with practical engineering to create secure, scalable systems built for real-world use.",
        teamHeading: "Core Team",
        statistics: [
            { value: 25, suffix: "+", label: "Years in Software Architecture" },
            { value: 10, suffix: "+", label: "Years Building Products" },
            { value: 32, suffix: "+", label: "Projects Delivered" },
            { value: 14, suffix: "", label: "Team Members" },
        ],
        teamMembers: team,
    },
    contactSection: {
        eyebrow: "Get in Touch",
        heading: "Let's build\nsomething\n*extraordinary.*",
        description:
            "Whether you have a clear brief or just a spark of an idea, we'd love to hear from you. Our team typically responds within 24 hours.",
        email: "hello@aranax.tech",
        location: "Kolkata, India - Richmond, USA",
    },
};
