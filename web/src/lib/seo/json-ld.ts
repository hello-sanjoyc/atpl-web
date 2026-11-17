import type { LandingPageContent, SeoContent } from "@/components/landing/data";

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

/** Homepage-wide entities that are not owned by a single CMS SEO component. */
export function homepageEntityJsonLd(content: LandingPageContent) {
    const siteUrl = content.site.siteUrl.replace(/\/$/, "");
    const organizationId = `${siteUrl}/#organization`;
    const founderId = `${siteUrl}/#sanjoy-chowdhury`;

    return {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "Organization",
                "@id": organizationId,
                name: content.site.siteName,
                url: `${siteUrl}/`,
                logo: new URL(content.site.logoUrl, `${siteUrl}/`).toString(),
                email: "hello@aranax.tech",
                foundingDate: "2015",
                founder: { "@id": founderId },
            },
            {
                "@type": "WebSite",
                "@id": `${siteUrl}/#website`,
                name: content.site.siteName,
                url: `${siteUrl}/`,
                publisher: { "@id": organizationId },
                inLanguage: "en",
            },
            {
                "@type": "Person",
                "@id": founderId,
                name: "Sanjoy Chowdhury",
                jobTitle: "Founder & AI SaaS Architect",
                url: "https://www.linkedin.com/in/sanjoyc/",
                image: `${siteUrl}/assets/images/sanjoyc.jpg`,
                worksFor: { "@id": organizationId },
            },
            ...content.servicesSection.services.map((service) => ({
                "@type": "Service",
                "@id": `${siteUrl}/services/${service.slug}#service`,
                name: service.name,
                serviceType: service.name,
                description: service.description,
                url: `${siteUrl}/services/${service.slug}`,
                provider: { "@id": organizationId },
                areaServed: "Worldwide",
            })),
        ],
    };
}
