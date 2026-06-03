export type Service = {
    number: string;
    name: string;
    description: string;
    tags: string[];
    icon: "spark" | "chat" | "grid";
    delay?: string;
};

export type Project = {
    tag: string;
    name: string;
    note: string;
    url: string;
    visual: "ema" | "docunova" | "radar" | "bars" | "voice";
};

export const services: Service[] = [
    {
        number: "01",
        name: "AI Solutions",
        description:
            "End-to-end AI strategy and implementation. We audit your workflows, identify automation opportunities, and build systems that deliver measurable ROI from day one.",
        tags: ["LLM Integration", "Strategy", "Automation"],
        icon: "spark",
    },
    {
        number: "02",
        name: "Chatbot Development",
        description:
            "Context-aware conversational agents that handle customer support, lead qualification, and knowledge retrieval - 24/7, across every channel, at any scale.",
        tags: ["NLP", "RAG", "Multi-channel"],
        icon: "chat",
        delay: "d1",
    },
    {
        number: "03",
        name: "AI Tools & Platforms",
        description:
            "Custom-built AI applications - from internal copilots and analytics dashboards to B2B SaaS products powered by the latest foundation models and fine-tuned pipelines.",
        tags: ["SaaS", "Fine-tuning", "API Design"],
        icon: "grid",
        delay: "d2",
    },
];

export const projects: Project[] = [
    {
        tag: "Email Assistant",
        name: "EMA - Smarter Inbox Management",
        note: "AI email assistant that helps you manage your inbox, draft replies, organize conversations, and save time with smarter email workflows.",
        url: "#",
        visual: "ema",
    },
    {
        tag: "Legal document summariser",
        name: "DocuNova AI",
        note: "Upload a PDF or DOCX. Get a structured one-page brief with key dates, obligations, red flags, and renewal clauses - in plain English.",
        url: "https://docunova.app",
        visual: "docunova",
    },
    {
        tag: "Chatbot for University",
        name: "UniChat - Conversational AI",
        note: "Multilingual text & voice based chatbot for university and higher education.",
        url: "#",
        visual: "voice",
    },
];

export const team = [
    ["SC", "Sanjoy C", "AI Strategist", "av1"],
    ["KP", "Kausik", "Product Manager", "av2"],
    ["ST", "Sabyasachi", "AI Enthuast", "av3"],
    ["AD", "Avigyan", "Head of Design", "av4"],
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
