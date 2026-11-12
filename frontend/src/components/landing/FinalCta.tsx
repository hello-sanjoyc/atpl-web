import { ArrowUpRight } from "./icons";
import { CmsText } from "./CmsText";
import type { LandingPageContent } from "./data";

export function FinalCta({ content }: { content: NonNullable<LandingPageContent["finalCta"]> }) {
    return <section className="final-cta" aria-labelledby="final-cta-heading"><div className="wrap"><div><p className="final-cta-kicker">{content.eyebrow}</p><h2 id="final-cta-heading"><CmsText text={content.heading} /></h2><p>{content.description}</p></div><a className="btn-a" href={content.cta.href}>{content.cta.label} <ArrowUpRight /></a></div></section>;
}
