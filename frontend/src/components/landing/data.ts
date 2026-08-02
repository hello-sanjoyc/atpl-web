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
    visual:
        | "ema"
        | "docunova"
        | "uniecho"
        | "doubtace"
        | "gloziia"
        | "glamsync";
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

export const team = [
    [
        "SC",
        "Sanjoy Chowdhury",
        "Founder & AI SaaS Architect",
        "av1",
        "https://www.linkedin.com/in/sanjoyc/",
    ],
    [
        "KP",
        "Kausik Pan",
        "Product Manager & Web Solutions Lead",
        "av2",
        "https://www.linkedin.com/in/kousik-pan-395a21116/",
    ],
    [
        "ST",
        "Sabyasachi Tripathi",
        "Full-Stack & AI Engineer",
        "av3",
        "https://www.linkedin.com/in/sabyasachi-tripathy-a402381a9/",
    ],
    [
        "AD",
        "Avigyan Das",
        "Head of Design",
        "av4",
        "https://www.linkedin.com/in/avigyandas/",
    ],
] as const;

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
