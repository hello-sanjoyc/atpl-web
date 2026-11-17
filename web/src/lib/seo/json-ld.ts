import type { SeoContent } from "@/components/landing/data";

export function cmsJsonLd(seo: SeoContent) {
    return [
        ...(seo.structuredData ? [seo.structuredData] : []),
        ...(seo.answerSummary ? [{ "@context": "https://schema.org", "@type": "WebPage", description: seo.answerSummary }] : []),
        ...(seo.questions.length > 0 ? [{ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: seo.questions.map(({ question, answer }) => ({ "@type": "Question", name: question, acceptedAnswer: { "@type": "Answer", text: answer } })) }] : []),
    ];
}
