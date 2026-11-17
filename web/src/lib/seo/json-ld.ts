import type { SeoContent } from "@/components/landing/data";

export function cmsJsonLd(seo: SeoContent) {
    return [
        ...(seo.structuredData ? [seo.structuredData] : []),
        ...(seo.answerSummary ? [{ "@context": "https://schema.org", "@type": "WebPage", description: seo.answerSummary }] : []),
        ...(seo.questions.length > 0 ? [{ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: seo.questions.map(({ question, answer }) => ({ "@type": "Question", name: question, acceptedAnswer: { "@type": "Answer", text: answer } })) }] : []),
    ];
}

/**
 * The homepage explains a six-step delivery process, so expose that process
 * in a machine-readable form as well as in the visible ordered list.
 */
export function homepageHowToJsonLd() {
    return {
        "@context": "https://schema.org",
        "@type": "HowTo",
        name: "How to take an AI product from idea to launch with Aranax",
        description:
            "Aranax uses a six-step product-engineering process: discovery, architecture, implementation, testing, deployment and ongoing support.",
        step: [
            {
                "@type": "HowToStep",
                position: 1,
                name: "Discovery",
                text: "Clarify user needs, success measures and delivery constraints.",
            },
            {
                "@type": "HowToStep",
                position: 2,
                name: "Architecture",
                text: "Define the technical approach, scope and system decisions.",
            },
            {
                "@type": "HowToStep",
                position: 3,
                name: "Implementation",
                text: "Build the agreed product in focused, reviewable increments.",
            },
            {
                "@type": "HowToStep",
                position: 4,
                name: "Testing",
                text: "Verify key workflows, integrations and release readiness.",
            },
            {
                "@type": "HowToStep",
                position: 5,
                name: "Deployment",
                text: "Support a controlled release and handover.",
            },
            {
                "@type": "HowToStep",
                position: 6,
                name: "Ongoing support",
                text: "Maintain, improve and extend the product as needs change.",
            },
        ],
    };
}
