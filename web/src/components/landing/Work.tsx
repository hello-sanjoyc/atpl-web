import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";

import type { LandingPageContent } from "./data";
import { CmsText } from "./CmsText";
import { ArrowUpRight, ProjectVisual } from "./icons";
import { SectionChip } from "./SectionChip";

function CaseStudyCardTitle({ name }: { name: string }) {
    const match = name.match(/^(.*?)\s+[-—]\s+(.*)$/);
    if (!match) return name;

    return <>{match[1]} <span aria-hidden="true">-</span> <span className="wc-name-detail">{match[2]}</span></>;
}

export function Work({ content }: { content: LandingPageContent["caseStudiesSection"] }) {
    const stackRef = useRef<HTMLDivElement>(null);
    const [activeIndex, setActiveIndex] = useState(0);

    useEffect(() => {
        const cards = Array.from(stackRef.current?.querySelectorAll<HTMLElement>(".case-stack-card") ?? []);
        if (!cards.length) return;

        let frame = 0;
        const update = () => {
            frame = 0;
            if (window.innerWidth <= 680) return;
            let current = 0;
            cards.forEach((card, index) => {
                const stickyTop = Number.parseFloat(window.getComputedStyle(card).top);
                if (card.getBoundingClientRect().top <= stickyTop + 1) current = index;
            });
            setActiveIndex(current);
        };
        const schedule = () => {
            if (!frame) frame = window.requestAnimationFrame(update);
        };

        schedule();
        window.addEventListener("scroll", schedule, { passive: true });
        window.addEventListener("resize", schedule);
        return () => {
            window.cancelAnimationFrame(frame);
            window.removeEventListener("scroll", schedule);
            window.removeEventListener("resize", schedule);
        };
    }, [content.caseStudies]);

    return (
        <section id="case-studies" aria-labelledby="work-h2">
            <div className="wrap">
                <div className="work-header">
                    <div>
                        <SectionChip className="reveal">
                            {content.eyebrow}
                        </SectionChip>
                        <h2 className="work-title reveal d1" id="work-h2">
                            <CmsText text={content.heading} />
                        </h2>
                        <div className="work-title-copy reveal d2">
                            <p>
                                {content.description}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="work-grid work-grid--stack reveal" ref={stackRef}>
                    {content.caseStudies.map((project, index) => (
                        <article
                            className={`wc wc-${project.visual} case-stack-card${index === activeIndex ? " is-current" : ""}${index < activeIndex ? " is-past" : ""}`}
                            key={project.name}
                            style={{
                                "--stack-offset": `calc(${index} * var(--stack-peek))`,
                                "--stack-order": index + 1,
                            } as CSSProperties}
                        >
                            <a
                                className="wc-card-link"
                                href={`/case-studies/${project.slug}`}
                                aria-label={`Read the ${project.name} case study`}
                            />
                            <div className="wc-over">
                                <header className="wc-card-header">
                                    <h3 className="wc-name"><CaseStudyCardTitle name={project.name} /></h3>
                                    <span className="wc-tag">{project.category}</span>
                                </header>
                                <div className="wc-card-body">
                                    <h4 className="wc-hero-title" aria-hidden="true"><CaseStudyCardTitle name={project.name} /></h4>
                                    <p className="wc-tagline">{project.tagline}</p>
                                    <a className="wc-top-product" href={project.url} target="_blank" rel="noopener noreferrer">
                                        Visit Product <ArrowUpRight />
                                    </a>
                                    <div className="wc-card-actions">
                                        <ul className="wc-tags" aria-label="Capabilities">
                                            {project.tags.map((tag) => <li key={tag}>{tag}</li>)}
                                        </ul>
                                    </div>
                                    <div className="wc-card-main">
                                        <div className="wc-media">
                                            <ProjectVisual
                                                visual={project.visual}
                                                imageUrl={project.imageUrl}
                                                alt={`${project.name} cover image`}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </article>
                    ))}
                    <div className="work-stack-spacer" aria-hidden="true" />
                </div>
            </div>
        </section>
    );
}
