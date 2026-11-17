import { CmsText } from "./CmsText";
import type { LandingPageContent } from "./data";
import { SectionChip } from "./SectionChip";

export function Evidence({ content }: { content: NonNullable<LandingPageContent["evidenceSection"]> }) {
    return (
        <section id="delivery-facts" className="evidence-section" aria-labelledby="delivery-facts-heading">
            <div className="wrap evidence-section__inner">
                <SectionChip className="reveal">{content.eyebrow}</SectionChip>
                <h2 id="delivery-facts-heading" className="section-title reveal d1"><CmsText text={content.heading} /></h2>
                <div className="evidence-section__copy reveal d2">
                    {content.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                </div>
            </div>
        </section>
    );
}
