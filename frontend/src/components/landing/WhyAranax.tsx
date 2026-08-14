import { SectionChip } from "./SectionChip";
import { CmsText } from "./CmsText";
import type { LandingPageContent } from "./data";

export function WhyAranax({ content }: { content: LandingPageContent["whyAranaxSection"] }) {
    return (
        <section id="why-aranax" aria-labelledby="why-aranax-h2">
            <div className="wrap">
                <SectionChip className="reveal">{content.eyebrow}</SectionChip>
                <h2 className="why-aranax-title reveal d1" id="why-aranax-h2">
                    <CmsText text={content.heading} />
                </h2>
                <div className="why-aranax-copy reveal d2">
                    <p>
                        <CmsText text={content.description} />
                    </p>
                </div>

                <div className="why-aranax-grid">
                    <div className="why-aranax-considerations reveal d2">
                        <p className="why-aranax-kicker">{content.listHeading}</p>
                        <ol>
                            {content.considerations.map((consideration) => (
                                <li key={consideration}>{consideration}</li>
                            ))}
                        </ol>
                    </div>
                </div>

                <p className="why-aranax-outcome reveal d3">
                    {content.outcome}
                </p>
            </div>
        </section>
    );
}
