import { SectionChip } from "./SectionChip";
import { CmsText } from "./CmsText";
import type { LandingPageContent } from "./data";

export function Faq({ content }: { content: NonNullable<LandingPageContent["faqSection"]> }) {
    return <section id="faq" className="faq-section" aria-labelledby="faq-heading"><div className="wrap"><SectionChip className="reveal">{content.eyebrow}</SectionChip><h2 id="faq-heading" className="section-title reveal d1"><CmsText text={content.heading} /></h2><div className="faq-list">{content.items.map(({ question, answer }, index) => <details className={`reveal faq-item--${index + 1}`} key={question} name="homepage-faq"><summary>{question}</summary><div className="faq-answer"><p>{answer}</p></div></details>)}</div></div></section>;
}
