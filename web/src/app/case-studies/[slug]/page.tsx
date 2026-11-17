import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ServicePageChrome } from "@/components/landing/ServicePageChrome";
import { ImacMockup } from "@/components/landing/ImacMockup";
import { mapSeo, mediaUrl } from "@/lib/cms/content.server";
import { getLandingPageContent } from "@/lib/cms/cache.server";
import { getCaseStudyBySlug } from "@/lib/cms/page-content.server";
import { cmsJsonLd } from "@/lib/seo/json-ld";
import { metadataFromCmsSeo } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };
type CasePageContent = {
    context: { label: string; title: string; audience: string; copy: string };
    challenge: { label: string; title: string; copy: string };
    contribution: { label: string; title: string; copy: string };
    outcome: { label: string; title: string; copy: string };
    cta: { label: string; title: string; description: string; button: { label: string; href: string } };
};

function CaseStudyTitle({ name }: { name: string }) {
    const match = name.match(/^(.*?)\s+[-—]\s+(.*)$/);
    if (!match) return name;

    return <>{match[1]} <span aria-hidden="true">-</span> <span className="case-hero-title-detail">{match[2]}</span></>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const entry = await getCaseStudyBySlug((await params).slug);
    if (!entry?.seo) return {};
    const { site } = await getLandingPageContent();
    return metadataFromCmsSeo(mapSeo(entry.seo), site, mediaUrl(entry.coverImage));
}

export default async function CaseStudyPage({ params }: Props) {
    const entry = await getCaseStudyBySlug((await params).slug);
    if (!entry) notFound();

    const page = entry.pageContent as unknown as CasePageContent | null;
    const chrome = await getLandingPageContent();
    const jsonLd = entry.seo ? cmsJsonLd(mapSeo(entry.seo)) : [];
    const imageUrl = mediaUrl(entry.coverImage);

    return (
        <ServicePageChrome settings={chrome.site} contact={chrome.contactSection}>
            {jsonLd.length > 0 ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} /> : null}
            <main className="case-page">
                <section className={`case-hero case-${entry.visual}`}>
                    <div className="wrap">
                        <nav className="breadcrumbs" aria-label="Breadcrumb">
                            <a href="/">Home</a><span>/</span><a href="/#case-studies">Case Studies</a><span>/</span><span aria-current="page">{entry.name}</span>
                        </nav>
                        <div className="case-hero-grid">
                            <div className="case-hero-copy">
                                <p className="case-kicker">{entry.category}</p>
                                <h1><CaseStudyTitle name={entry.name} /></h1>
                                <p className="case-tagline">{entry.tagline}</p>
                                <p className="case-intro">{entry.description}</p>
                                <ul className="case-hero-tags">{entry.tags?.map(({ text }) => <li key={text}>{text}</li>)}</ul>
                                <a className="btn-a case-hero-product" href={entry.websiteUrl} target="_blank" rel="noopener noreferrer">Visit product <span aria-hidden="true">↗</span></a>
                            </div>
                            {imageUrl ? <ImacMockup src={imageUrl} alt={`${entry.name} website screenshot`} /> : null}
                        </div>
                    </div>
                </section>
                {page ? <div className="wrap case-layout">
                    <section className="case-summary"><p className="case-section-label">{page.context.label}</p><h2>{page.context.title}</h2><p>{page.context.audience}</p><p>{page.context.copy}</p></section>
                    <section className="case-problem"><p className="case-section-label">{page.challenge.label}</p><h2>{page.challenge.title}</h2><p>{entry.challenge}</p><p>{page.challenge.copy}</p></section>
                    <section className="case-contribution"><p className="case-section-label">{page.contribution.label}</p><h2>{page.contribution.title}</h2><p>{entry.contribution}</p><p>{page.contribution.copy}</p></section>
                    <section className="case-outcome"><p className="case-section-label">{page.outcome.label}</p><h2>{page.outcome.title}</h2><p>{entry.outcome}</p><p>{page.outcome.copy}</p></section>
                    <section className="case-cta"><div><p className="case-section-label">{page.cta.label}</p><h2>{page.cta.title}</h2><p>{page.cta.description}</p></div><div className="case-cta-actions"><a className="btn-a" href={page.cta.button.href}>{page.cta.button.label}</a></div></section>
                </div> : null}
            </main>
        </ServicePageChrome>
    );
}
