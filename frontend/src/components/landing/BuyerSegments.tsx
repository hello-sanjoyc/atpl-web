import { SectionChip } from "./SectionChip";
import { CmsText } from "./CmsText";
import type { LandingPageContent } from "./data";

export function BuyerSegments({ content }: { content: NonNullable<LandingPageContent["buyerSegments"]> }) {
    return <section id="who-we-help" className="buyer-section" aria-labelledby="buyers-heading"><div className="wrap"><SectionChip>{content.eyebrow}</SectionChip><h2 id="buyers-heading" className="section-title"><CmsText text={content.heading} /></h2><div className="buyer-grid">{content.items.map((segment) => <article className="buyer-card" key={segment.title}><h3>{segment.title}</h3><p><strong>Challenge:</strong> {segment.challenge}</p><p><strong>Relevant services:</strong> {segment.service}</p><p><strong>Typical outcome:</strong> {segment.deliverable}</p><a href={segment.href}>{segment.cta} <span aria-hidden="true">→</span></a></article>)}</div></div></section>;
}
