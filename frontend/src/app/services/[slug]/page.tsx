import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ServicePageChrome } from "@/components/landing/ServicePageChrome";
import { mapSeo, mediaUrl } from "@/lib/cms/content.server";
import { getLandingPageContent } from "@/lib/cms/cache.server";
import { getServiceBySlug } from "@/lib/cms/page-content.server";
import { cmsJsonLd } from "@/lib/seo/json-ld";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ slug: string }> };
type ServicePageContent = { eyebrow: string; cta: { label: string; href: string }; audienceTitle: string; audience: string[]; problemsTitle: string; problems: string[]; deliverablesTitle: string; deliverables: string[]; capabilitiesTitle: string; capabilities: string[]; architectureTitle: string; architecture: string; processTitle: string; process: Array<{ title: string; description: string }>; workTitle: string; caseStudies: Array<{ name: string; url: string; description: string }>; faqTitle: string; faqs: Array<{ question: string; answer: string }>; relatedTitle: string; related: Array<{ name: string; href: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> { const service = await getServiceBySlug((await params).slug); return service?.seo ? { title: service.seo.metaTitle, description: service.seo.metaDescription } : {}; }

export default async function ServicePage({ params }: Props) {
    const service = await getServiceBySlug((await params).slug);
    if (!service) notFound();
    const page = service.pageContent as unknown as ServicePageContent | null;
    const chrome = await getLandingPageContent();
    const jsonLd = service.seo ? cmsJsonLd(mapSeo(service.seo)) : [];
    const heroImageUrl = mediaUrl(service.heroImage);

    return <ServicePageChrome settings={chrome.site} contact={chrome.contactSection}>{jsonLd.length > 0 ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} /> : null}<main className="service-page"><section className={heroImageUrl ? "service-hero service-hero--with-art" : "service-hero"}><div className="wrap service-hero-grid"><div className="service-hero-copy"><nav className="breadcrumbs" aria-label="Breadcrumb"><a href="/">Home</a><span>/</span><a href="/#services">Services</a><span>/</span><span aria-current="page">{service.name}</span></nav>{page ? <p className="service-eyebrow">{page.eyebrow}</p> : null}<h1>{service.name}</h1><p className="service-summary">{service.description}</p>{page ? <a className="btn-a" href={page.cta.href}>{page.cta.label}</a> : null}</div>{heroImageUrl ? <div className="service-hero-art"><img src={heroImageUrl} alt={`${service.name} platform architecture visual`} /></div> : null}</div></section>{page ? <div className="wrap service-layout"><section className="service-panel"><h2>{page.audienceTitle}</h2><ul>{page.audience.map((item) => <li key={item}>{item}</li>)}</ul></section><section className="service-panel"><h2>{page.problemsTitle}</h2><ul>{page.problems.map((item) => <li key={item}>{item}</li>)}</ul></section><section className="service-wide"><h2>{page.deliverablesTitle}</h2><div className="deliverable-grid">{page.deliverables.map((item, index) => <article key={item}><span>0{index + 1}</span><h3>{item}</h3></article>)}</div></section><section className="service-wide service-split"><div><h2>{page.capabilitiesTitle}</h2><ul>{page.capabilities.map((item) => <li key={item}>{item}</li>)}</ul></div><div><h2>{page.architectureTitle}</h2><p>{page.architecture}</p></div></section><section className="service-wide"><h2>{page.processTitle}</h2><ol className="engagement-steps">{page.process.map((item) => <li key={item.title}><strong>{item.title}</strong><span>{item.description}</span></li>)}</ol></section>{page.caseStudies.length > 0 ? <section className="service-wide"><h2>{page.workTitle}</h2><div className="case-link-grid">{page.caseStudies.map((item) => { const external = item.url.startsWith('http'); return <a href={item.url} key={item.name} target={external ? "_blank" : undefined} rel={external ? "noopener noreferrer" : undefined}><h3>{item.name} <span aria-hidden="true">↗</span></h3><p>{item.description}</p></a>; })}</div></section> : null}<section className="service-wide service-faq"><h2>{page.faqTitle}</h2>{page.faqs.map((item) => <details key={item.question} name="service-faq"><summary>{item.question}</summary><div className="faq-answer"><p>{item.answer}</p></div></details>)}</section><section className="service-wide related-services"><h2>{page.relatedTitle}</h2><div>{page.related.map((item) => <a href={item.href} key={item.href}>{item.name} <span aria-hidden="true">→</span></a>)}</div></section></div> : null}</main></ServicePageChrome>;
}
