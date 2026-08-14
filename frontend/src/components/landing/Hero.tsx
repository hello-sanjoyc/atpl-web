import { ArrowRight, ArrowUpRight } from "./icons";
import { CmsText } from "./CmsText";
import type { LandingPageContent } from "./data";

export function Hero({ content }: { content: LandingPageContent["hero"] }) {
    return (
        <section id="hero" aria-labelledby="hero-h1">
            <div className="blob blob-amber" aria-hidden="true" />
            <div className="blob blob-sage" aria-hidden="true" />

            <div className="hero-inner wrap">
                <p className="hero-eyebrow" aria-hidden="true">
                    <span className="eyebrow-dot" />
                    {content.eyebrow}
                </p>
                <h1 className="hero-title" id="hero-h1">
                    {content.heading.split("\n").map((line, index) => (
                        <span className="hero-line" key={`${line}-${index}`}>
                            <span className="hero-line-inner">
                                <CmsText text={line} />
                            </span>
                        </span>
                    ))}
                </h1>
                <div className="hero-bottom">
                    <p className="hero-desc">
                        <CmsText text={content.description} />
                    </p>
                    <div className="hero-actions">
                        <a
                            className="btn-a"
                            href={content.primaryCta.href}
                            target={content.primaryCta.openInNewTab ? "_blank" : undefined}
                            rel={content.primaryCta.openInNewTab ? "noopener noreferrer" : undefined}
                        >
                            {content.primaryCta.label}
                            <ArrowUpRight />
                        </a>
                        <a
                            className="btn-ghost"
                            href={content.secondaryCta.href}
                            target={content.secondaryCta.openInNewTab ? "_blank" : undefined}
                            rel={content.secondaryCta.openInNewTab ? "noopener noreferrer" : undefined}
                        >
                            {content.secondaryCta.label}
                            <ArrowRight />
                        </a>
                    </div>
                </div>
                <ul className="hero-trust-strip" aria-label="Our capabilities">
                    {content.trustItems.map((item) => (
                        <li key={item}>{item}</li>
                    ))}
                </ul>
            </div>

            <div className="scroll-cue" aria-hidden="true">
                <span>Scroll</span>
                <div className="scroll-line" />
            </div>
        </section>
    );
}
