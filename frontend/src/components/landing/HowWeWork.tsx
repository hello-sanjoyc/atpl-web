import { SectionChip } from "./SectionChip";
import { CmsText } from "./CmsText";
import type { LandingPageContent } from "./data";

export function HowWeWork({ content }: { content: NonNullable<LandingPageContent["processSection"]> }) {
    return <section id="how-we-work" className="process-section" aria-labelledby="process-heading"><div className="wrap"><SectionChip light>{content.eyebrow}</SectionChip><h2 id="process-heading" className="section-title light"><CmsText text={content.heading} /></h2><ol className="process-grid">{content.steps.map((step) => <li key={step.number}><span>{step.number}</span><h3>{step.title}</h3><p>{step.description}</p></li>)}</ol></div></section>;
}
